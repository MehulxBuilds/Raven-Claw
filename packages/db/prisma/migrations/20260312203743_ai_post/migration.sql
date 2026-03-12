/*
  Warnings:

  - A unique constraint covering the columns `[polarCustomerId]` on the table `user` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[polarSubscriptionId]` on the table `user` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "SubscriptionTierType" AS ENUM ('Free', 'PRO', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "SubscriptionStatusType" AS ENUM ('ACTIVE', 'INACTIVE', 'CANCELED');

-- CreateEnum
CREATE TYPE "MediaPost" AS ENUM ('X', 'YOUTUBE', 'INSTAGRAM', 'PEERLIST', 'REDDIT', 'LINKEDIN');

-- CreateEnum
CREATE TYPE "PreferredPostTopic" AS ENUM ('TECH', 'SCIENCE', 'POLITICS', 'BUSINESS', 'AI', 'PROGRAMMING', 'CYBERSECURITY', 'SPACE', 'STARTUPS');

-- CreateEnum
CREATE TYPE "PostStatus" AS ENUM ('PENDING', 'REVIEWED', 'POSTED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "PostMadeByType" AS ENUM ('CRON', 'MANNUAL');

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "TotalTokenConsumed" DECIMAL(12,2),
ADD COLUMN     "dailyTokenConsumed" DECIMAL(12,2),
ADD COLUMN     "polarCustomerId" TEXT,
ADD COLUMN     "polarSubscriptionId" TEXT,
ADD COLUMN     "preferredPostMedia" "MediaPost"[],
ADD COLUMN     "preferredPostTopics" "PreferredPostTopic"[],
ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'USER',
ADD COLUMN     "subscriptionStatus" "SubscriptionStatusType" NOT NULL DEFAULT 'INACTIVE',
ADD COLUMN     "subscriptionTier" "SubscriptionTierType" NOT NULL DEFAULT 'Free';

-- CreateTable
CREATE TABLE "AIPosts" (
    "id" TEXT NOT NULL,
    "mediaPosts" "MediaPost" NOT NULL DEFAULT 'X',
    "postTopics" "PreferredPostTopic" NOT NULL DEFAULT 'TECH',
    "postMadeBy" "PostMadeByType" NOT NULL DEFAULT 'CRON',
    "title" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "topic" TEXT,
    "source" TEXT,
    "sourceUrl" TEXT,
    "trend_score" DECIMAL(2,2),
    "engagementScore" INTEGER,
    "commentCount" INTEGER,
    "tokensConsumed" DECIMAL(12,2),
    "hash" TEXT,
    "status" "PostStatus" NOT NULL DEFAULT 'PENDING',
    "userId" TEXT NOT NULL,
    "isPosted" BOOLEAN NOT NULL DEFAULT false,
    "errorMessage" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIPosts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AIPosts_hash_key" ON "AIPosts"("hash");

-- CreateIndex
CREATE INDEX "AIPosts_trend_score_idx" ON "AIPosts"("trend_score");

-- CreateIndex
CREATE INDEX "AIPosts_createdAt_idx" ON "AIPosts"("createdAt");

-- CreateIndex
CREATE INDEX "AIPosts_status_idx" ON "AIPosts"("status");

-- CreateIndex
CREATE UNIQUE INDEX "user_polarCustomerId_key" ON "user"("polarCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "user_polarSubscriptionId_key" ON "user"("polarSubscriptionId");

-- AddForeignKey
ALTER TABLE "AIPosts" ADD CONSTRAINT "AIPosts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
