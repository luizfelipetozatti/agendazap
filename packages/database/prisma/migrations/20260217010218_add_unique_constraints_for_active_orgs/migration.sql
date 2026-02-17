-- DropIndex (remove unique constraint global do slug se existir)
DROP INDEX IF EXISTS "organizations_slug_key";

-- CreateIndex: Unique constraint parcial para slug apenas em organizações ATIVAS
CREATE UNIQUE INDEX "organizations_slug_active_key" ON "organizations"("slug") WHERE ("status" = 'ACTIVE');

-- CreateIndex: Unique constraint parcial para name apenas em organizações ATIVAS
CREATE UNIQUE INDEX "organizations_name_active_key" ON "organizations"("name") WHERE ("status" = 'ACTIVE');
