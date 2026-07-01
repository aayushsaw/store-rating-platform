-- AlterTable
ALTER TABLE "refresh_tokens" ADD COLUMN     "ip_address" VARCHAR(45),
ADD COLUMN     "last_used_at" TIMESTAMP(3),
ADD COLUMN     "user_agent" VARCHAR(500);
