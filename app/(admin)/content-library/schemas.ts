import { z } from 'zod'

export const namespaceSchema = z.object({
  id: z.string(),
  key: z.string().min(2).max(64),
  name: z.string().min(2).max(128),
  description: z.string().optional(),
  tags: z.array(z.string()),
  createdAt: z.string(),
  updatedAt: z.string(),
}).strict()

export const contentItemSchema = z.object({
  id: z.string(),
  namespaceKey: z.string(),
  title: z.string().min(1),
  slug: z.string().optional(),
  type: z.enum(['text','image','video','audio','file','json','richtext','html']),
  status: z.enum(['draft','published','archived']),
  labels: z.array(z.string()),
  locale: z.string().optional(),
  summary: z.string().optional(),
  previewUrl: z.string().url().optional(),
  storageKey: z.string().optional(),
  bytes: z.number().int().nonnegative().max(10 * 1024 * 1024).optional(), // 10MB safeguard for images
  checksum: z.string().optional(),
  version: z.number().int().positive(),
  meta: z.record(z.any()),
  createdBy: z.string(),
  updatedBy: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  deletedAt: z.union([z.string(), z.null()]).optional(),
}).strict()

export const versionHistorySchema = z.object({
  id: z.string(),
  contentId: z.string(),
  version: z.number().int().positive(),
  diffSummary: z.string().optional(),
  changedFields: z.array(z.string()),
  createdBy: z.string(),
  createdAt: z.string(),
}).strict()

export type NamespaceInput = z.infer<typeof namespaceSchema>
export type ContentItemInput = z.infer<typeof contentItemSchema>
export type VersionHistoryInput = z.infer<typeof versionHistorySchema>


