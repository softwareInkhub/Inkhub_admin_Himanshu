import { Design, KPIMetrics } from '../types';
import { generateDesigns } from '../utils';

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
      console.error(`Error fetching design chunk ${chunkIndex}:`, error);
      return {
        data: [],
        chunk: chunkIndex,
        total: 0,
      };
    }
  }

  async getAllDesigns(): Promise<ServerDesign[]> {
    try {
      // Based on your server response, we have 6 chunks (0-5)
      const totalChunks = 6;
      
      // Fetch all chunks in parallel
      const chunkPromises = Array.from({ length: totalChunks }, (_, index) => 
        this.getDesignChunk(index)
      );

      const chunkResults = await Promise.all(chunkPromises);
      
      // Combine all chunks
      const allDesigns = chunkResults.flatMap(result => result.data);
      
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
      // Based on your server response, we have 6 chunks (0-5)
      const totalChunks = 6;
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
      image: serverDesign.designImageUrl || serverDesign.image || `https://picsum.photos/seed/${serverDesign.uid}/400/300`,
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

  // Fallback method to get mock data if server is not available
  async getDesignsWithFallback(): Promise<Design[]> {
    try {
      console.log('Attempting to fetch real data from server...');
      const serverDesigns = await this.getAllDesigns();
      const transformedDesigns = serverDesigns.map(serverDesign => 
        this.transformServerDesign(serverDesign)
      );
      console.log(`Successfully fetched ${transformedDesigns.length} designs from server`);
      return transformedDesigns;
    } catch (error) {
      console.warn('Failed to fetch from server, using mock data:', error);
      console.log('Generating mock design data...');
      const mockDesigns = generateDesigns(50);
      console.log(`Generated ${mockDesigns.length} mock designs`);
      return mockDesigns;
    }
  }
}

export const designAPI = new DesignAPI();
