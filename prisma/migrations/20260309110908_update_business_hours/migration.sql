/*
  Warnings:

  - The primary key for the `business_hours` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `business_hours` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "business_hours" DROP CONSTRAINT "business_hours_pkey",
DROP COLUMN "id",
ADD COLUMN     "singleton" TEXT NOT NULL DEFAULT 'singleton',
ADD CONSTRAINT "business_hours_pkey" PRIMARY KEY ("singleton");

-- CreateTable
CREATE TABLE "working_days" (
    "dayOfWeek" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "days_off" (
    "date" DATE NOT NULL,
    "reason" VARCHAR(255)
);

-- CreateIndex
CREATE UNIQUE INDEX "working_days_dayOfWeek_key" ON "working_days"("dayOfWeek");

-- CreateIndex
CREATE UNIQUE INDEX "days_off_date_key" ON "days_off"("date");
