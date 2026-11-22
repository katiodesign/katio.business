ALTER TABLE "CatalogItem" ADD COLUMN "pricingManual" BOOLEAN NOT NULL DEFAULT false, ADD COLUMN "bundleFactor" DECIMAL(18,8) NOT NULL DEFAULT 1;
UPDATE "CatalogItem" SET "pricingManual" = true WHERE NOT "isBundle" AND ("pricingHours" IS NULL OR "pricingDirectCost" IS NULL);
UPDATE "CatalogItem" b SET "bundleFactor" = b.price / totals.total FROM (SELECT c."bundleId", SUM(c.quantity * i.price) AS total FROM "CatalogBundleComponent" c JOIN "CatalogItem" i ON i.id = c."componentId" GROUP BY c."bundleId") totals WHERE b.id = totals."bundleId" AND totals.total > 0 AND b."isBundle";
