-- CreateEnum
CREATE TYPE "CircuitType" AS ENUM ('CIRCOM');

-- CreateTable
CREATE TABLE "regex_blueprints" (
    "id" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "slug" VARCHAR(255),
    "tags" VARCHAR(255),
    "email_query" TEXT,
    "use_new_sdk" BOOLEAN,
    "name" VARCHAR(255) NOT NULL,
    "ignore_body_hash_check" BOOLEAN NOT NULL DEFAULT true,
    "enable_masking" BOOLEAN,
    "sha_precompute_selector" VARCHAR(255),
    "email_body_max_length" INTEGER,
    "sender_domain" VARCHAR(255),
    "dkim_selector" VARCHAR(255),
    "decomposed_regexes" JSONB NOT NULL,
    "externalInputs" JSONB,
    "subject" BOOLEAN NOT NULL DEFAULT true,
    "timestamp" BOOLEAN NOT NULL DEFAULT true,
    "from" BOOLEAN NOT NULL DEFAULT true,
    "to" BOOLEAN NOT NULL DEFAULT true,
    "circuitType" "CircuitType" NOT NULL DEFAULT 'CIRCOM',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "regex_blueprints_pkey" PRIMARY KEY ("id")
);
