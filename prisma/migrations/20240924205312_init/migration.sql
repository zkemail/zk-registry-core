-- CreateTable
CREATE TABLE "regex_blueprints" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "slug" VARCHAR(255),
    "tags" VARCHAR(255),
    "email_query" TEXT,
    "use_new_sdk" BOOLEAN,
    "name" VARCHAR(255) NOT NULL,
    "ignore_body_hash_check" BOOLEAN,
    "enable_masking" BOOLEAN,
    "sha_precompute_selector" VARCHAR(255),
    "email_body_max_length" INTEGER,
    "sender_domain" VARCHAR(255),
    "dkim_selector" VARCHAR(255),
    "decomposedRegex" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "regex_blueprints_pkey" PRIMARY KEY ("id")
);
