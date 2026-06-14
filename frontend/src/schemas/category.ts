/**
 * Category metadata. One `meta.toml` per category directory.
 *
 *  data/categories/<id>/
 *  ├── meta.toml         # ← validated by this schema
 *  └── apis.jsonl        # ← line-validated by ApiRecordSchema
 */
import { z } from "zod"

export const CategoryMetaSchema = z.object({
  id: z
    .string()
    .min(1)
    .max(64)
    .regex(/^[a-z0-9-]+$/, "id must be kebab-case (a-z, 0-9, dash)"),
  display_name: z.string().min(1).max(128),
  icon: z.string().min(1).max(16),
  blurb: z.string().max(500).default(""),
  order: z.number().int().min(0).max(9999).default(99),
})
export type CategoryMeta = z.infer<typeof CategoryMetaSchema>
