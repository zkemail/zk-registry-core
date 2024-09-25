/*
  Warnings:

  - The primary key for the `regex_blueprints` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Changed the type of `id` on the `regex_blueprints` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "regex_blueprints" DROP CONSTRAINT "regex_blueprints_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ADD CONSTRAINT "regex_blueprints_pkey" PRIMARY KEY ("id");
