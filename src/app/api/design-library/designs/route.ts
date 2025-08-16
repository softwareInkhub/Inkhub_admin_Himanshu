import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, PutCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { redis } from '@/utils/redis';

// Helper function to create a user-friendly error message
function getErrorMessage(error: any): string {
  if (error.code === 'ENOTFOUND') {
    return 'Unable to connect to AWS DynamoDB. Please check your internet connection and AWS configuration.';
  }
  if (error.code === 'CredentialsProviderError') {
    return 'AWS credentials are missing or invalid. Please check your AWS configuration.';
  }
  if (error.code === 'ResourceNotFoundException') {
    return 'The specified DynamoDB table does not exist. Please check your table name configuration.';
  }
  if (error.code === 'AccessDeniedException') {
    return 'Access denied to DynamoDB. Please check your AWS permissions.';
  }
  return 'An error occurred while fetching designs. Please try again later.';
}

const client = new DynamoDBClient({ 
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
  }
});
const docClient = DynamoDBDocumentClient.from(client);

const CACHE_TTL = 6 * 60 * 60; // 6 hours in seconds
const ALL_DESIGNS_CACHE_KEY = 'design_library:all';
const CACHE_LOCK_KEY = 'design_library:lock';
const LOCK_TTL = 300; // 5 minutes in seconds
const PARTIAL_CACHE_KEY = 'design_library:partial';
const LAST_SCAN_POSITION_KEY = 'design_library:last_scan_position';

// Lock mechanism with retry and force release
async function acquireLock(retries = 3, delay = 1000): Promise<boolean> {
  // First check if there's a stale lock
  const lockValue = await redis.get(CACHE_LOCK_KEY);
  if (lockValue) {
    const lockTimestamp = parseInt(lockValue);
    if (Date.now() - lockTimestamp > LOCK_TTL * 1000) {
      console.log('[Debug] 🔒 Found stale lock, forcing release');
      await releaseLock();
    }
  }

  for (let i = 0; i < retries; i++) {
    const timestamp = Date.now().toString();
    const locked = await redis.set(CACHE_LOCK_KEY, timestamp, 'EX', LOCK_TTL, 'NX');
    if (locked === 'OK') {
      console.log('[Debug] 🔒 Lock acquired successfully');
      return true;
    }
    console.log(`[Debug] 🔒 Lock acquisition attempt ${i + 1} failed, retrying...`);
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  console.log('[Debug] 🔒 Failed to acquire lock after all retries');
  return false;
}

async function releaseLock(): Promise<void> {
  try {
    await redis.del(CACHE_LOCK_KEY);
    console.log('[Debug] 🔓 Lock released successfully');
  } catch (error) {
    console.error('[Debug] ❌ Error releasing lock:', error);
  }
}

// Function to check if lock is stale
async function isLockStale(): Promise<boolean> {
  try {
    const lockValue = await redis.get(CACHE_LOCK_KEY);
    if (!lockValue) return false;
    
    const lockTimestamp = parseInt(lockValue);
    return Date.now() - lockTimestamp > LOCK_TTL * 1000;
  } catch (error) {
    console.error('[Debug] ❌ Error checking lock status:', error);
    return false;
  }
}

// Function to fetch all designs from DynamoDB (no lock logic here)
async function fetchAllDesigns() {
  console.log('[Debug] 🚀 Starting DynamoDB fetch for designs at:', new Date().toISOString());
  const startTime = Date.now();
  const allItems: any[] = [];
  let lastEvaluatedKey: any = undefined;
  let scanCount = 0;

  try {
    // Check if we have a last scan position
    const lastScanPosition = await redis.get(LAST_SCAN_POSITION_KEY);
    if (lastScanPosition) {
      console.log('[Debug] 🔄 Resuming from last scan position');
      lastEvaluatedKey = JSON.parse(lastScanPosition);
      // Get existing partial cache
      const partialData = await redis.get(PARTIAL_CACHE_KEY);
      if (partialData) {
        allItems.push(...JSON.parse(partialData));
        console.log(`[Debug] 📦 Loaded ${allItems.length} items from partial cache`);
      }
    }

    while (true) {
      // Check if lock is stale during long operations
      if (await isLockStale()) {
        console.log('[Debug] 🔒 Lock became stale during fetch, releasing...');
        await releaseLock();
        throw new Error('Lock became stale during fetch');
      }

      scanCount++;
      console.log(`[Debug] 📊 DynamoDB Scan #${scanCount} for designs starting...`);
      
    const command = new ScanCommand({
      TableName: process.env.DESIGN_TABLE,
        Limit: 1000,
        ExclusiveStartKey: lastEvaluatedKey,
    });

    const response = await docClient.send(command);
    const items = response.Items || [];
      
      console.log(`[Debug] 📊 DynamoDB Scan #${scanCount} for designs complete. Items fetched: ${items.length}`);
      
      // Cache partial results as we go
      if (items.length > 0) {
        allItems.push(...items);
        await redis.set(PARTIAL_CACHE_KEY, JSON.stringify(allItems), 'EX', CACHE_TTL);
        console.log(`[Debug] 💾 Cached ${allItems.length} partial designs`);
      }

      lastEvaluatedKey = response.LastEvaluatedKey;
      if (!lastEvaluatedKey) {
        // Clear the last scan position when we're done
        await redis.del(LAST_SCAN_POSITION_KEY);
        break;
      }

      // Store the current scan position
      await redis.set(LAST_SCAN_POSITION_KEY, JSON.stringify(lastEvaluatedKey), 'EX', CACHE_TTL);
      console.log('[Debug] 📍 Saved scan position for resume');

      await new Promise(resolve => setTimeout(resolve, 100));
    }

    const endTime = Date.now();
    console.log(`[Debug] ✅ DynamoDB fetch for designs complete:
      - Total time: ${endTime - startTime}ms
      - Total items: ${allItems.length}
      - Number of scans: ${scanCount}
      - Timestamp: ${new Date().toISOString()}
    `);

    return allItems;
  } catch (error) {
    console.error('[Debug] ❌ Error during DynamoDB fetch:', error);
    throw error;
  }
}

// Function to get designs from cache or fetch from DB
async function getDesignsFromCache() {
  console.log('[Debug] 🔍 Checking Valkey cache for designs at:', new Date().toISOString());
  const startTime = Date.now();
  
  try {
    // First check for complete cache
    const cachedData = await redis.get(ALL_DESIGNS_CACHE_KEY);
    if (cachedData) {
      const parsedData = JSON.parse(cachedData);
      console.log(`[Debug] 🎯 Complete Cache HIT for designs:
        - Cache check time: ${Date.now() - startTime}ms
        - Items in cache: ${parsedData.length}
        - Timestamp: ${new Date().toISOString()}
      `);
      return parsedData;
    }

    // Then check for partial cache
    const partialData = await redis.get(PARTIAL_CACHE_KEY);
    if (partialData) {
      const parsedPartial = JSON.parse(partialData);
      console.log(`[Debug] 🎯 Partial Cache HIT for designs:
        - Cache check time: ${Date.now() - startTime}ms
        - Items in cache: ${parsedPartial.length}
        - Timestamp: ${new Date().toISOString()}
      `);

      // Check if we have a last scan position
      const lastScanPosition = await redis.get(LAST_SCAN_POSITION_KEY);
      if (lastScanPosition) {
        console.log('[Debug] 🔄 Found last scan position, attempting to trigger background fetch');
        // Try to acquire the lock before starting background fetch
        acquireLock().then(hasLock => {
          if (hasLock) {
            fetchAllDesigns()
              .then(async (designs) => {
                if (designs && designs.length && !(await redis.get(LAST_SCAN_POSITION_KEY))) {
                  await redis.set(ALL_DESIGNS_CACHE_KEY, JSON.stringify(designs), 'EX', CACHE_TTL);
                }
              })
              .catch(error => {
                console.error('[Debug] ❌ Error in background fetch:', error);
              })
              .finally(() => releaseLock());
          } else {
            console.log('[Debug] 🔒 Could not acquire lock for background fetch, skipping');
          }
        });
      }

      return parsedPartial;
    }

    console.log(`[Debug] ❌ Cache MISS for designs:
      - Cache check time: ${Date.now() - startTime}ms
      - Timestamp: ${new Date().toISOString()}
    `);

    // Try to acquire lock before fetching
    const hasLock = await acquireLock();
    if (!hasLock) {
      console.log('[Debug] 🔒 Another process is fetching designs, returning empty array');
      return [];
    }

    try {
      console.log('[Debug] 🚀 Fetching designs from DynamoDB...');
      const designs = await fetchAllDesigns();
      
      console.log('[Debug] 💾 Caching complete designs in Valkey...');
      const cacheStartTime = Date.now();
      await redis.set(ALL_DESIGNS_CACHE_KEY, JSON.stringify(designs), 'EX', CACHE_TTL);
      const cacheEndTime = Date.now();
      
      console.log(`[Debug] ✅ Cache population for designs complete:
        - Cache time: ${cacheEndTime - cacheStartTime}ms
        - Items cached: ${designs.length}
        - TTL: ${CACHE_TTL} seconds
        - Timestamp: ${new Date().toISOString()}
      `);
      
      return designs;
    } finally {
      await releaseLock();
    }
  } catch (error) {
    console.error('[Debug] ❌ Error in getDesignsFromCache:', error);
    await releaseLock();
    throw error;
  }
}

// Background refresh function
async function refreshDesignsInBackground() {
  const hasLock = await acquireLock();
  if (!hasLock) {
    console.log('[Debug] 🔒 Another process is refreshing designs, skipping');
    return;
  }

  try {
    console.log('[Debug] 🔄 Starting background refresh of designs...');
    const designs = await fetchAllDesigns();
    await redis.set(ALL_DESIGNS_CACHE_KEY, JSON.stringify(designs), 'EX', CACHE_TTL);
    console.log('[Debug] ✅ Background refresh complete');
  } catch (error) {
    console.error('[Debug] ❌ Error during background refresh:', error);
  } finally {
    await releaseLock();
  }
}

// Add a function to check if fetching is in progress
async function isFetchingInProgress(): Promise<boolean> {
  const lockValue = await redis.get(CACHE_LOCK_KEY);
  return !!lockValue;
}

// Add a function to force start fetching
async function forceStartFetching(): Promise<void> {
  const hasLock = await acquireLock();
  if (!hasLock) {
    console.log('[Debug] 🔒 Another process is already fetching');
    return;
  }

  try {
    console.log('[Debug] 🚀 Force starting fetch from DynamoDB...');
    await fetchAllDesigns();
  } finally {
    await releaseLock();
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Number(searchParams.get('limit')) || 500;
    const lastKey = searchParams.get('lastKey') ? JSON.parse(searchParams.get('lastKey')!) : undefined;
    const forceRefresh = searchParams.get('forceRefresh') === 'true';
    const forceStart = searchParams.get('forceStart') === 'true';

    console.log(`[Debug] 📥 Designs request received:
      - Limit: ${limit}
      - Force Refresh: ${forceRefresh}
      - Force Start: ${forceStart}
      - Last Key: ${lastKey ? 'Present' : 'None'}
      - Timestamp: ${new Date().toISOString()}
    `);

    if (forceRefresh) {
      console.log('[Debug] 🔄 Force refresh requested for designs, clearing cache...');
      await redis.del(ALL_DESIGNS_CACHE_KEY);
      await redis.del(PARTIAL_CACHE_KEY);
      await redis.del(LAST_SCAN_POSITION_KEY);
      console.log('[Debug] ✅ Designs cache cleared');
    }

    if (forceStart) {
      console.log('[Debug] 🚀 Force start requested for designs...');
      await forceStartFetching();
    }

    // Get designs from cache or start fetching
    const allDesigns = await getDesignsFromCache();

    // If we got empty array (cache miss and couldn't acquire lock),
    // trigger background refresh and return empty result
    if (allDesigns.length === 0) {
      refreshDesignsInBackground().catch(console.error);
      return NextResponse.json({ items: [], lastEvaluatedKey: null, total: 0 });
    }

    // Handle pagination
    const startIndex = lastKey ? allDesigns.findIndex((d: any) => d.uid === lastKey.uid) + 1 : 0;
    const endIndex = startIndex + limit;
    const paginatedDesigns = allDesigns.slice(startIndex, endIndex);
    const hasMore = endIndex < allDesigns.length;

    console.log(`[Debug] 📤 Designs response prepared:
      - Total items: ${allDesigns.length}
      - Paginated items: ${paginatedDesigns.length}
      - Has more: ${hasMore}
      - Start index: ${startIndex}
      - End index: ${endIndex}
      - Timestamp: ${new Date().toISOString()}
    `);

    const result = {
      items: paginatedDesigns,
      lastEvaluatedKey: hasMore ? paginatedDesigns[paginatedDesigns.length - 1] : null,
      total: allDesigns.length
    };
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[Debug] ❌ Error occurred while fetching designs:', error);
    const errorMessage = getErrorMessage(error);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const command = new PutCommand({
      TableName: process.env.DESIGN_TABLE,
      Item: data,
    });
    await docClient.send(command);
    
    // Invalidate cache after creating new design
    await redis.del(ALL_DESIGNS_CACHE_KEY);
    await redis.del(PARTIAL_CACHE_KEY);
    await redis.del(LAST_SCAN_POSITION_KEY);
    
    return NextResponse.json({ message: 'Design created successfully' });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({ error: 'Failed to create design', details: errorMessage }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json();
    const { uid, ...fields } = data;
    if (!uid) return NextResponse.json({ error: 'Missing uid' }, { status: 400 });
    
    const updateExpression = 'set ' + Object.keys(fields).map((k) => `#${k} = :${k}`).join(', ');
    const expressionAttributeNames = Object.keys(fields).reduce((acc, k) => ({ ...acc, [`#${k}`]: k }), {});
    const expressionAttributeValues = Object.keys(fields).reduce((acc, k) => ({ ...acc, [`:${k}`]: fields[k] }), {});
    
    const command = new UpdateCommand({
      TableName: process.env.DESIGN_TABLE,
      Key: { uid },
      UpdateExpression: updateExpression,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW',
    });
    const result = await docClient.send(command);
    
    // Invalidate cache after updating design
    await redis.del(ALL_DESIGNS_CACHE_KEY);
    await redis.del(PARTIAL_CACHE_KEY);
    await redis.del(LAST_SCAN_POSITION_KEY);
    
    return NextResponse.json(result.Attributes);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({ error: 'Failed to update design', details: errorMessage }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { uid } = await request.json();
    if (!uid) return NextResponse.json({ error: 'Missing uid' }, { status: 400 });
    
    const command = new DeleteCommand({
      TableName: process.env.DESIGN_TABLE,
      Key: { uid },
    });
    await docClient.send(command);
    
    // Invalidate cache after deleting design
    await redis.del(ALL_DESIGNS_CACHE_KEY);
    await redis.del(PARTIAL_CACHE_KEY);
    await redis.del(LAST_SCAN_POSITION_KEY);
    
    return NextResponse.json({ message: 'Design deleted successfully' });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({ error: 'Failed to delete design', details: errorMessage }, { status: 500 });
  }
} 