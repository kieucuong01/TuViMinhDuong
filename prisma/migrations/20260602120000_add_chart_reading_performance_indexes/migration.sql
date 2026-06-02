CREATE INDEX "Chart_userId_createdAt_idx" ON "Chart"("userId", "createdAt");

CREATE INDEX "Reading_userId_type_scopeKey_status_createdAt_idx" ON "Reading"("userId", "type", "scopeKey", "status", "createdAt");

CREATE INDEX "Reading_chartId_type_scopeKey_status_idx" ON "Reading"("chartId", "type", "scopeKey", "status");
