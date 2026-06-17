/**
 * Runtime + compile-time contract for an API record.
 *
 * The data layer at `data/categories/<id>/apis.jsonl` is the source of
 * truth. This schema is what we trust — anything that doesn't parse
 * gets rejected at build time and the build fails loudly.
 *
 * Keep this in lockstep with `frontend/scripts/build-data.ts`. If you
 * add a field, also update the build script's row-to-record mapper.
 */
import { z } from "zod"

/* ----------------------------- primitives ----------------------------- */

export const AuthSchema = z.enum(["none", "apiKey", "oauth2", "xAuth", "xAuth+apiKey"])
export type Auth = z.infer<typeof AuthSchema>

export const CorsSchema = z.union([z.boolean(), z.literal("unknown")]).nullable()
export type Cors = z.infer<typeof CorsSchema>

export const HttpsSchema = z.boolean().nullable()
export type Https = z.infer<typeof HttpsSchema>

export const GradeSchema = z.enum(["A", "B", "C", "D", "F"])
export type Grade = z.infer<typeof GradeSchema>

/* -------------------------- the API record --------------------------- */

const _httpUrl = (msg = "url must be http(s)") =>
  z.string().refine((u) => /^https?:\/\/[^\s<>"'`]+$/.test(u), { message: msg })

export const ApiRecordSchema = z.object({
  id: z.string().min(1).max(128),
  name: z.string().min(1).max(256),
  url: _httpUrl(),
  description: z.string().max(500).default(""),
  category_id: z.string().min(1).max(64),
  auth: AuthSchema.optional(),
  https: HttpsSchema.optional(),
  cors: CorsSchema.optional(),
  source: z.string().min(1).max(256),
  source_url: _httpUrl("source_url must be http(s)").optional(),
  tags: z.string().max(2000).default(""),
  quality_score: z.number().int().min(0).max(100).default(0),
  quality_grade: GradeSchema.optional(),
  status: z.string().default("active"),
  deprecated: z.boolean().default(false),
  last_verified: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "last_verified must be YYYY-MM-DD")
    .optional(),
}).superRefine((r, ctx) => {
  if (r.quality_grade != null && r.quality_grade !== scoreToGrade(r.quality_score)) {
    ctx.addIssue({
      code: "custom",
      message: `quality_grade "${r.quality_grade}" doesn't match score ${r.quality_score} (expected "${scoreToGrade(r.quality_score)}")`,
      path: ["quality_grade"],
    })
  }
})
export type ApiRecord = z.infer<typeof ApiRecordSchema>

/* --------------------------- tag helpers ----------------------------- */

export const splitTags = (raw: string | null | undefined): string[] =>
  (raw ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)

/* ----------------------- quality score heuristic --------------------- */

export const scoreToGrade = (score: number): Grade => {
  const s = Math.max(0, Math.min(100, Math.round(score)))
  if (s >= 90) return "A"
  if (s >= 75) return "B"
  if (s >= 60) return "C"
  if (s >= 40) return "D"
  return "F"
}

export const gradeToOrder: Record<Grade, number> = { A: 0, B: 1, C: 2, D: 3, F: 4 }

/**
 * Outward-facing record type: the same as `ApiRecord` but with
 * `tags` and `updated_at`/`created_at` normalised to what the rest
 * of the frontend wants (array / ISO string).
 */
export interface ApiView {
  id: string
  name: string
  url: string
  description: string | null
  category_id: string
  auth: Auth | null
  https: Https
  cors: Cors
  source: string | null
  source_url: string | null
  quality_score: number
  quality_grade: Grade | null
  tags: string[]
  status: string
  deprecated: boolean
  last_verified: string | null
  created_at: string | null
  updated_at: string | null
}

export const toApiView = (r: ApiRecord, now = new Date().toISOString()): ApiView => ({
  id: r.id,
  name: r.name,
  url: r.url,
  description: r.description ?? "",
  category_id: r.category_id,
  auth: r.auth ?? null,
  https: r.https ?? null,
  cors: r.cors ?? null,
  source: r.source ?? null,
  source_url: r.source_url ?? null,
  quality_score: r.quality_score,
  quality_grade: r.quality_grade ?? null,
  tags: splitTags(r.tags),
  status: r.deprecated ? "deprecated" : (r.status ?? "active"),
  deprecated: !!r.deprecated,
  last_verified: r.last_verified ?? null,
  created_at: now,
  updated_at: r.last_verified ? `${r.last_verified}T00:00:00Z` : now,
})
