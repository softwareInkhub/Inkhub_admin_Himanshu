import { BaseEntity } from '@/components/shared/types';

export interface Design extends BaseEntity {
  name: string;
  description: string;
  status: 'completed' | 'in_progress' | 'pending' | 'approved' | 'rejected';
  type: 'logo' | 'banner' | 'social_media' | 'print' | 'web' | 'illustration';
  category: 'branding' | 'marketing' | 'social' | 'print' | 'digital';
  price: number;
  size: string;
  image: string;
  tags: string[];
  isStarred: boolean;
  isLiked: boolean;
  views: number;
  downloads: number;
  client: string;
  designer: string;
}

export interface DesignVariant {
  id: string;
  designId: string;
  name: string;
  image: string;
  size: string;
  format: string;
  createdAt: string;
}

export interface KPIMetric {
  label: string;
  value: number;
  change: number;
  changeType: 'increase' | 'decrease';
  gradient: string;
  icon: string;
}

export interface KPIMetrics {
  totalDesigns: KPIMetric;
  completedDesigns: KPIMetric;
  inProgressDesigns: KPIMetric;
  totalValue: KPIMetric;
  totalViews: KPIMetric;
  totalDownloads: KPIMetric;
}

export interface SearchCondition {
  id: string;
  field: string;
  operator: string;
  value: string;
  connector: 'AND' | 'OR';
}

export interface CustomFilter {
  name: string;
  field: string;
  operator: string;
  value: string;
}

export interface DesignsClientProps {
  initialData?: Design[];
}
