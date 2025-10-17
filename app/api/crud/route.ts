import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient, DescribeTableCommand } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand, DeleteCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';

const region = process.env.AWS_REGION || 'us-east-1'

// Check if AWS credentials are available
const hasAWSCredentials = () => {
  return !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) || 
         !!(process.env.AWS_PROFILE) ||
         process.env.AWS_SESSION_TOKEN; // For temporary credentials
};

// Initialize AWS clients only if credentials are available
let client: DynamoDBClient | null = null;
let docClient: DynamoDBDocumentClient | null = null;

if (hasAWSCredentials()) {
  try {
    client = new DynamoDBClient({ region });
    docClient = DynamoDBDocumentClient.from(client);
  } catch (error) {
    console.error('Failed to initialize AWS clients:', error);
  }
}

async function describeKeySchema(tableName: string) {
  if (!client || !docClient) {
    throw new Error('AWS DynamoDB client not initialized. Please configure AWS credentials.');
  }
  const tableDesc = await client.send(new DescribeTableCommand({ TableName: tableName }));
  const keySchema = tableDesc.Table?.KeySchema || [];
  const partitionKey = keySchema.find(k => k.KeyType === 'HASH')?.AttributeName as string | undefined;
  const sortKey = keySchema.find(k => k.KeyType === 'RANGE')?.AttributeName as string | undefined;
  return { partitionKey, sortKey };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tableName = searchParams.get('tableName') || '';
  const operation = searchParams.get('operation') || '';

  if (!tableName) return NextResponse.json({ error: 'tableName is required' }, { status: 400 });

  // Check if AWS credentials are configured
  if (!hasAWSCredentials() || !client || !docClient) {
    return NextResponse.json({ 
      error: 'AWS credentials not configured. Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables.',
      code: 'AWS_CREDENTIALS_MISSING',
      instructions: 'Create a .env.local file with your AWS credentials. See env.example for reference.'
    }, { status: 503 });
  }

  try {
    switch (operation) {
      case 'listViews': {
        const result = await docClient.send(new ScanCommand({ TableName: tableName }));
        const items = result.Items || [];
        return NextResponse.json({ success: true, views: items });
      }
      default:
        return NextResponse.json({ error: 'Invalid operation' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('GET /api/crud error:', error);
    
    // Provide more specific error messages
    if (error.name === 'ResourceNotFoundException') {
      return NextResponse.json({ 
        error: `DynamoDB table '${tableName}' not found. Please create the table first.`,
        code: 'TABLE_NOT_FOUND'
      }, { status: 404 });
    } else if (error.name === 'AccessDeniedException') {
      return NextResponse.json({ 
        error: 'Access denied to DynamoDB. Please check your AWS credentials and permissions.',
        code: 'ACCESS_DENIED'
      }, { status: 403 });
    }
    
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tableName, operation, viewName, searchState, description, created_at, createdAt, updatedAt, userId } = body || {};
    if (!tableName) return NextResponse.json({ error: 'tableName is required' }, { status: 400 });

    // Check if AWS credentials are configured
    if (!hasAWSCredentials() || !client || !docClient) {
      return NextResponse.json({ 
        error: 'AWS credentials not configured. Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables.',
        code: 'AWS_CREDENTIALS_MISSING',
        instructions: 'Create a .env.local file with your AWS credentials. See env.example for reference.'
      }, { status: 503 });
    }

    switch (operation) {
      case 'saveView': {
        if (!viewName || !searchState) return NextResponse.json({ error: 'viewName and searchState are required' }, { status: 400 });
        const { partitionKey, sortKey } = await describeKeySchema(tableName);
        if (!partitionKey) return NextResponse.json({ error: 'Unable to determine table key schema' }, { status: 500 });

        const now = Date.now();
        const item: any = {
          viewName,
          description: description || '',
          userId: userId || 'anonymous',
          searchState,
          createdAt: createdAt ?? now,
          updatedAt: updatedAt ?? now,
        };

        // Ensure keys are present according to actual table schema
        if (partitionKey !== 'viewName') item[partitionKey] = item['viewName'];
        if (sortKey) {
          if (sortKey in item === false) {
            // Prefer provided values; otherwise default per table schema
            if (sortKey === 'created_at') item['created_at'] = created_at ?? now;
            else if (sortKey === 'updatedAt') item['updatedAt'] = updatedAt ?? now;
            else item[sortKey] = now;
          }
        }

        await docClient.send(new PutCommand({ TableName: tableName, Item: item }));
        return NextResponse.json({ success: true, view: item });
      }
      default:
        return NextResponse.json({ error: 'Invalid operation' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('POST /api/crud error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { tableName, operation, viewName } = body || {};
    if (!tableName || !operation || !viewName) return NextResponse.json({ error: 'tableName, operation, and viewName are required' }, { status: 400 });

    // Check if AWS credentials are configured
    if (!hasAWSCredentials() || !client || !docClient) {
      return NextResponse.json({ 
        error: 'AWS credentials not configured. Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables.',
        code: 'AWS_CREDENTIALS_MISSING',
        instructions: 'Create a .env.local file with your AWS credentials. See env.example for reference.'
      }, { status: 503 });
    }

    switch (operation) {
      case 'setDefaultView': {
        // Implementation left minimal; clients can read the flag from the item
        const { partitionKey, sortKey } = await describeKeySchema(tableName);
        const scan = await docClient.send(new ScanCommand({ TableName: tableName }));
        const items = (scan.Items || []).filter((i: any) => i[partitionKey || 'viewName'] === viewName);
        if (items.length === 0) return NextResponse.json({ error: 'View not found' }, { status: 404 });
        const target = items.sort((a: any, b: any) => (b[sortKey || 'updatedAt'] ?? 0) - (a[sortKey || 'updatedAt'] ?? 0))[0];
        target.isDefault = true;
        await docClient.send(new PutCommand({ TableName: tableName, Item: target }));
        return NextResponse.json({ success: true, view: target });
      }
      default:
        return NextResponse.json({ error: 'Invalid operation' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('PUT /api/crud error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { tableName, operation, viewName, sortKeyValue } = body || {};
    if (!tableName || !operation || !viewName) return NextResponse.json({ error: 'tableName, operation, and viewName are required' }, { status: 400 });

    // Check if AWS credentials are configured
    if (!hasAWSCredentials() || !client || !docClient) {
      return NextResponse.json({ 
        error: 'AWS credentials not configured. Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables.',
        code: 'AWS_CREDENTIALS_MISSING',
        instructions: 'Create a .env.local file with your AWS credentials. See env.example for reference.'
      }, { status: 503 });
    }

    switch (operation) {
      case 'deleteView': {
        const { partitionKey, sortKey } = await describeKeySchema(tableName);
        let key: any = { [partitionKey || 'viewName']: viewName };
        if (sortKey) {
          if (sortKeyValue !== undefined) key[sortKey] = sortKeyValue;
          else {
            // find latest by sortKey
            const scan = await docClient.send(new ScanCommand({ TableName: tableName }));
            const items = (scan.Items || []).filter((i: any) => i[partitionKey || 'viewName'] === viewName);
            if (items.length === 0) return NextResponse.json({ error: 'View not found' }, { status: 404 });
            const latest = items.sort((a: any, b: any) => (b[sortKey] ?? 0) - (a[sortKey] ?? 0))[0];
            key[sortKey] = latest[sortKey];
          }
        }
        await docClient.send(new DeleteCommand({ TableName: tableName, Key: key }));
        return NextResponse.json({ success: true });
      }
      default:
        return NextResponse.json({ error: 'Invalid operation' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('DELETE /api/crud error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
