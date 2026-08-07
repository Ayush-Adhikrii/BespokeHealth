-- These columns exist in schema.prisma and in the local dev database (added
-- outside of a tracked migration at some point) but were never captured in
-- migration history, so any database built purely from migrations (e.g.
-- production) was missing them. IF NOT EXISTS makes this safe to apply
-- everywhere, including databases that already have the columns.
ALTER TABLE "Doctor" ADD COLUMN IF NOT EXISTS "image_url" TEXT;
ALTER TABLE "Doctor" ADD COLUMN IF NOT EXISTS "avg_rating" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Doctor" ADD COLUMN IF NOT EXISTS "rating_count" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Doctor" ADD COLUMN IF NOT EXISTS "is_active" BOOLEAN NOT NULL DEFAULT true;
