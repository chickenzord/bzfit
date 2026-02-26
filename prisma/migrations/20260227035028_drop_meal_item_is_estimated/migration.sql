/*
  Warnings:

  - You are about to drop the column `isEstimated` on the `MealItem` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_MealItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mealId" TEXT NOT NULL,
    "foodId" TEXT NOT NULL,
    "servingId" TEXT NOT NULL,
    "quantity" REAL NOT NULL DEFAULT 1.0,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MealItem_mealId_fkey" FOREIGN KEY ("mealId") REFERENCES "Meal" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MealItem_foodId_fkey" FOREIGN KEY ("foodId") REFERENCES "Food" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MealItem_servingId_fkey" FOREIGN KEY ("servingId") REFERENCES "Serving" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_MealItem" ("createdAt", "foodId", "id", "mealId", "notes", "quantity", "servingId", "updatedAt") SELECT "createdAt", "foodId", "id", "mealId", "notes", "quantity", "servingId", "updatedAt" FROM "MealItem";
DROP TABLE "MealItem";
ALTER TABLE "new_MealItem" RENAME TO "MealItem";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
