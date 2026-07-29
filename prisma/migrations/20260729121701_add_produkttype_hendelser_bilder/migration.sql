-- AlterTable
ALTER TABLE "Asset" ADD COLUMN     "bilder" TEXT[],
ADD COLUMN     "notat" TEXT,
ADD COLUMN     "produkttypeId" TEXT;

-- AlterTable
ALTER TABLE "Modell" ADD COLUMN     "produkttypeId" TEXT;

-- CreateTable
CREATE TABLE "Produkttype" (
    "id" TEXT NOT NULL,
    "navn" TEXT NOT NULL,

    CONSTRAINT "Produkttype_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetHendelse" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "tekst" TEXT NOT NULL,
    "opprettet" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssetHendelse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Produkttype_navn_key" ON "Produkttype"("navn");

-- AddForeignKey
ALTER TABLE "Modell" ADD CONSTRAINT "Modell_produkttypeId_fkey" FOREIGN KEY ("produkttypeId") REFERENCES "Produkttype"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_produkttypeId_fkey" FOREIGN KEY ("produkttypeId") REFERENCES "Produkttype"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetHendelse" ADD CONSTRAINT "AssetHendelse_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
