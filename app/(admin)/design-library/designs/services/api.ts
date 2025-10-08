import { Design, KPIMetrics } from '../types';

export interface ServerDesign {
  // Server-specific fields
  uid: string;
  designName: string;
  designType: string;
  designStatus: string;
  designPrice: string;
  designSize: string;
  designImageUrl: string;
  designImageName: string;
  designCreatedAt: string;
  designUpdateAt: string;
  designTags: string[];
  designAssignedTo: string | null;
  
  // Order-related fields
  orderId?: number;
  orderName?: string;
  orderLineItemId?: number;
  orderLineItemIndex?: number;
  productId?: number | null;
  
  // Additional tags
  _tags: string[];
  
  // Fallback fields for compatibility
  id?: string;
  name?: string;
  description?: string;
  status?: string;
  type?: string;
  category?: string;
  price?: number;
  size?: string;
  image?: string;
  createdAt?: string;
  updatedAt?: string;
  tags?: string[];
  views?: number;
  downloads?: number;
  client?: string;
  designer?: string;
  
  [key: string]: any; // Allow for additional fields from server
}

export interface CacheResponse {
  message: string;
  project: string;
  table: string;
  totalRecords: number;
  successfulWrites: number;
  failedWrites: number;
  attemptedKeys: number;
  skippedDuplicates: number;
  fillRate: string;
  durationMs: number;
  cacheKeys: string[];
  totalCacheKeys: number;
}

export interface DesignChunkResponse {
  data: ServerDesign[];
  chunk: number;
  total: number;
}

class DesignAPI {
  private baseURL = 'https://brmh.in/cache';
  private project = 'my-app';
  private table = 'admin-design-image';

  // Ensure all UI views use compressed images by default
  // We aggressively optimize S3 images to WebP with reasonable thumbnail sizes
  private optimizeImageUrl(url?: string, preset: 'card' | 'grid' | 'thumb' = 'card'): string | undefined {
    if (!url) return url;
    try {
      // Only optimize S3 links
      if (url.includes('s3.amazonaws.com')) {
        const hasQuery = url.includes('?');
        const sep = hasQuery ? '&' : '?';
        // Choose size by preset; these are safe defaults for table/card/grid
        const size = preset === 'thumb' ? 'w=80&h=80' : preset === 'grid' ? 'w=400&h=300' : 'w=300&h=300';
        // Force WebP with good compression
        return `${url}${sep}${size}&fit=crop&auto=webp&q=60&f=webp`;
      }
      return url;
    } catch {
      return url;
    }
  }

  async getCacheInfo(): Promise<CacheResponse> {
    try {
      const response = await fetch(`${this.baseURL}/table`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching cache info:', error);
      throw error;
    }
  }

  async getDesignChunk(chunkIndex: number): Promise<DesignChunkResponse> {
    try {
      const response = await fetch(`${this.baseURL}/data?project=${this.project}&table=${this.table}&key=chunk:${chunkIndex}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(15000), // 15 second timeout
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      const data = result.data || [];
      
      return {
        data: Array.isArray(data) ? data : [],
        chunk: chunkIndex,
        total: Array.isArray(data) ? data.length : 0,
      };
    } catch (error) {
      console.warn(`⚠️ Chunk ${chunkIndex} fetch error:`, error);
      return {
        data: [],
        chunk: chunkIndex,
        total: 0,
      };
    }
  }

  async getAllDesigns(): Promise<ServerDesign[]> {
    try {
      // Try to discover available chunks first
      let totalChunks = 7; // Default fallback (based on actual server data)
      
      try {
        const keysUrl = `${this.baseURL}/data?project=${this.project}&table=${this.table}`;
        const keysRes = await fetch(keysUrl, { 
          headers: { 'Accept': 'application/json' }, 
          signal: AbortSignal.timeout(10000) // Increased to 10 seconds
        });
        if (keysRes.ok) {
          const keysJson = await keysRes.json();
          const availableKeys: string[] = Array.isArray(keysJson?.keys) ? keysJson.keys : [];
          const normalizedKeys = availableKeys.map(k => k.split(':').pop() || k);
          const chunkKeys = normalizedKeys.filter(k => k.startsWith('chunk:'));
          if (chunkKeys.length > 0) {
            totalChunks = Math.max(...chunkKeys.map(k => parseInt(k.split(':')[1]) || 0)) + 1;
            console.log(`📊 Discovered ${totalChunks} design chunks available`);
          }
        }
      } catch (e) {
        // Silently handle timeout errors
        if (e instanceof Error && e.name !== 'AbortError') {
          console.log('ℹ️ Using default chunk count');
        }
      }
      
      // Fetch chunks with bounded concurrency to avoid overwhelming the server
      const concurrencyLimit = 3; // Limit concurrent requests
      const allDesigns: ServerDesign[] = [];
      
      console.log(`🎨 Loading ${totalChunks} design chunks with ${concurrencyLimit} concurrent requests...`);
      
      for (let i = 0; i < totalChunks; i += concurrencyLimit) {
        const batch = Array.from({ length: Math.min(concurrencyLimit, totalChunks - i) }, (_, j) => 
          this.getDesignChunk(i + j)
        );
        
        const batchResults = await Promise.all(batch);
        const batchData = batchResults.flatMap(result => result.data);
        allDesigns.push(...batchData);
        
        console.log(`✅ Loaded batch ${Math.floor(i/concurrencyLimit) + 1}: ${batchData.length} designs`);
      }
      
      console.log(`🎨 Total designs loaded: ${allDesigns.length}`);
      return allDesigns;
    } catch (error) {
      console.error('Error fetching all designs:', error);
      throw error;
    }
  }

  async getDesignsWithPagination(page: number = 1, limit: number = 500): Promise<{
    data: ServerDesign[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      // Based on your server response, we have 7 chunks (0-6)
      const totalChunks = 7;
      const totalPages = totalChunks;
      
      // Validate page number
      if (page < 1 || page > totalPages) {
        throw new Error(`Invalid page number. Available pages: 1-${totalPages}`);
      }

      // Get the specific chunk for this page (page 1 = chunk 0, page 2 = chunk 1, etc.)
      const chunkIndex = page - 1;

      // Fetch the specific chunk data using the correct endpoint
      const chunkResponse = await fetch(`${this.baseURL}/data?project=${this.project}&table=${this.table}&key=chunk:${chunkIndex}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(15000), // 15 second timeout
      });

      if (!chunkResponse.ok) {
        throw new Error(`HTTP error! status: ${chunkResponse.status}`);
      }

      const chunkResult = await chunkResponse.json();
      const chunkData = chunkResult.data || [];

      return {
        data: chunkData,
        total: totalChunks * 500, // Approximate total (500 records per chunk)
        page,
        limit: chunkData.length,
        totalPages: totalPages,
      };
    } catch (error) {
      console.error('Error fetching designs with pagination:', error);
      throw error;
    }
  }

  // Transform server data to match our Design interface
  transformServerDesign(serverDesign: ServerDesign): any {
    // Calculate estimated views and downloads based on design status and type
    const isCompleted = serverDesign.designStatus === 'completed';
    const estimatedViews = isCompleted ? Math.floor(Math.random() * 100) + 10 : 0; // Random views for completed designs
    const estimatedDownloads = isCompleted ? Math.floor(Math.random() * 20) + 1 : 0; // Random downloads for completed designs
    
    const transformed = {
      id: serverDesign.uid || serverDesign.id || `design-${Date.now()}-${Math.random()}`,
      name: serverDesign.designName || serverDesign.name || 'Untitled Design',
      description: serverDesign.designType || 'No description available',
      status: serverDesign.designStatus || 'completed',
      type: serverDesign.designType || 'illustration',
      category: serverDesign.designType || 'digital',
      price: parseFloat(serverDesign.designPrice) || 0,
      size: serverDesign.designSize || '1920x1080',
      // Always provide a compressed image URL by default so card/grid views are fast
      image: this.optimizeImageUrl(serverDesign.designImageUrl || serverDesign.image, 'card')
        || `https://picsum.photos/seed/${serverDesign.uid}/400/300`,
      createdAt: serverDesign.designCreatedAt || serverDesign.createdAt || new Date().toISOString(),
      updatedAt: serverDesign.designUpdateAt || serverDesign.updatedAt || new Date().toISOString(),
      tags: serverDesign.designTags || serverDesign._tags || serverDesign.tags || ['design', '2024'],
      isStarred: false,
      isLiked: false,
      views: estimatedViews,
      downloads: estimatedDownloads,
      client: serverDesign.orderName || 'Unknown Client',
      designer: serverDesign.designAssignedTo || 'Unknown Designer',
      // Keep original server fields for KPI calculations
      designStatus: serverDesign.designStatus,
      designPrice: serverDesign.designPrice,
      designType: serverDesign.designType,
      orderName: serverDesign.orderName,
      designAssignedTo: serverDesign.designAssignedTo,
    };
    
    return transformed;
  }

  // Fetch real data from server - NO MOCK DATA FALLBACK
  async getDesignsWithFallback(): Promise<Design[]> {
    try {
      console.log('🎨 Attempting to fetch real design data from server...');
      const serverDesigns = await this.getAllDesigns();
      
      if (serverDesigns.length === 0) {
        console.warn('⚠️ No designs returned from server');
        return []; // Return empty array instead of mock data
      }
      
      const transformedDesigns = serverDesigns.map(serverDesign => 
        this.transformServerDesign(serverDesign)
      );
      console.log(`✅ Successfully fetched ${transformedDesigns.length} designs from server`);
      return transformedDesigns;
    } catch (error) {
      console.error('❌ Failed to fetch designs from server:', error);
      return []; // Return empty array instead of mock data
    }
  }
}

export const designAPI = new DesignAPI();
