-- AlterTable
ALTER TABLE "Task" ADD COLUMN "scheduledTime" TEXT;

-- AlterTable
ALTER TABLE "FocusSession" ADD COLUMN "timeLeft" INTEGER,
ADD COLUMN "timerState" TEXT,
ADD COLUMN "lastUpdatedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "FocusSession_userId_timerState_idx" ON "FocusSession"("userId", "timerState");
