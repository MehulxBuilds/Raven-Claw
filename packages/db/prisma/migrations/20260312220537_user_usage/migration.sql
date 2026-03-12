/*
  Warnings:

  - You are about to drop the column `topic` on the `AIPosts` table. All the data in the column will be lost.
  - You are about to drop the column `trend_score` on the `AIPosts` table. All the data in the column will be lost.
  - The `source` column on the `AIPosts` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `TotalTokenConsumed` on the `user` table. All the data in the column will be lost.
  - You are about to drop the column `dailyTokenConsumed` on the `user` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "TrendSource" AS ENUM ('REDDIT', 'HACKERNEWS', 'GOOGLE_TRENDS', 'NEWS');

-- DropIndex
DROP INDEX "AIPosts_trend_score_idx";

-- AlterTable
ALTER TABLE "AIPosts" DROP COLUMN "topic",
DROP COLUMN "trend_score",
ADD COLUMN     "topicId" TEXT,
ADD COLUMN     "trendScore" DECIMAL(4,3),
DROP COLUMN "source",
ADD COLUMN     "source" "TrendSource";

-- AlterTable
ALTER TABLE "user" DROP COLUMN "TotalTokenConsumed",
DROP COLUMN "dailyTokenConsumed";

-- CreateTable
CREATE TABLE "Topic" (
    "id" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "category" "PreferredPostTopic" NOT NULL,
    "trendScore" DECIMAL(4,3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Topic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_usage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "TotalTokenConsumed" DECIMAL(12,2),
    "dailyTokenConsumed" DECIMAL(12,2),
    "generationCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_usage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Topic_query_key" ON "Topic"("query");

-- CreateIndex
CREATE INDEX "Topic_query_idx" ON "Topic"("query");

-- CreateIndex
CREATE UNIQUE INDEX "user_usage_userId_key" ON "user_usage"("userId");

-- CreateIndex
CREATE INDEX "AIPosts_trendScore_idx" ON "AIPosts"("trendScore");

-- CreateIndex
CREATE INDEX "AIPosts_topicId_idx" ON "AIPosts"("topicId");

-- CreateIndex
CREATE INDEX "AIPosts_userId_idx" ON "AIPosts"("userId");

-- AddForeignKey
ALTER TABLE "AIPosts" ADD CONSTRAINT "AIPosts_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_usage" ADD CONSTRAINT "user_usage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
