-- CreateEnum
CREATE TYPE "MeldingType" AS ENUM ('avvik', 'servicebehov', 'reklamasjon');

-- CreateTable
CREATE TABLE "AssetMelding" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "type" "MeldingType" NOT NULL,
    "beskrivelse" TEXT NOT NULL,
    "innsender" TEXT NOT NULL,
    "bilder" TEXT[],
    "opprettet" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "behandlet" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "AssetMelding_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "AssetMelding" ADD CONSTRAINT "AssetMelding_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
