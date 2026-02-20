/*
  Warnings:

  - You are about to drop the column `isActive` on the `NutritionGoal` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_NutritionGoal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "caloriesTarget" REAL,
    "proteinTarget" REAL,
    "carbsTarget" REAL,
    "fatTarget" REAL,
    "fiberTarget" REAL,
    "sugarTarget" REAL,
    "sodiumTarget" REAL,
    "startDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "NutritionGoal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_NutritionGoal" ("caloriesTarget", "carbsTarget", "createdAt", "endDate", "fatTarget", "fiberTarget", "id", "proteinTarget", "sodiumTarget", "startDate", "sugarTarget", "updatedAt", "userId") SELECT "caloriesTarget", "carbsTarget", "createdAt", "endDate", "fatTarget", "fiberTarget", "id", "proteinTarget", "sodiumTarget", "startDate", "sugarTarget", "updatedAt", "userId" FROM "NutritionGoal";
DROP TABLE "NutritionGoal";
ALTER TABLE "new_NutritionGoal" RENAME TO "NutritionGoal";
CREATE UNIQUE INDEX "NutritionGoal_userId_startDate_key" ON "NutritionGoal"("userId", "startDate");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
