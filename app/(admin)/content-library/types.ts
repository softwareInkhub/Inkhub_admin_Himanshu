export type Role = 'admin' | 'editor' | 'viewer' | 'marketing' | 'operations'

export type Namespace = {
  id: string
  key: string
  name: string
  description?: string
  tags: string[]
  createdAt: string
  updatedAt: string
}

export type ContentItem = {
  id: string
  namespaceKey: string
  title: string
  slug?: string
  type: 'text' | 'image' | 'video' | 'audio' | 'file' | 'json' | 'richtext' | 'html'
  status: 'draft' | 'published' | 'archived'
  labels: string[]
  locale?: string
  summary?: string
  previewUrl?: string
  storageKey?: string
  bytes?: number
  checksum?: string
  version: number
  meta: Record<string, any>
  createdBy: string
  updatedBy: string
  createdAt: string
  updatedAt: string
  deletedAt?: string | null
}

export type VersionHistory = {
  id: string
  contentId: string
  version: number
  diffSummary?: string
  changedFields: string[]
  createdBy: string
  createdAt: string
}

export type Policies = {
  role: Role
  permittedNamespaces: string[]
  tags?: string[]
}

export type PagedItems = {
  items: ContentItem[]
  nextCursor?: string
}


