-- AlterTable
ALTER TABLE "Feedback" ADD COLUMN     "channel" TEXT NOT NULL DEFAULT 'MANUAL';

-- CreateIndex
CREATE INDEX "Feedback_channel_idx" ON "Feedback"("channel");
