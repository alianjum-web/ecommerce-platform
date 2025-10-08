-- AlterTable
ALTER TABLE "Coupon" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "maxDiscount" DOUBLE PRECISION,
ADD COLUMN     "minOrderValue" DOUBLE PRECISION,
ADD COLUMN     "userIds" TEXT[];
