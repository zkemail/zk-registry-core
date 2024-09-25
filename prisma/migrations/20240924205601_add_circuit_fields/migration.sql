-- CreateEnum
CREATE TYPE "CircuitType" AS ENUM ('CIRCOM');

-- AlterTable
ALTER TABLE "regex_blueprints" ADD COLUMN     "circuit" TEXT,
ADD COLUMN     "circuitType" "CircuitType" NOT NULL DEFAULT 'CIRCOM';
