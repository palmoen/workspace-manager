-- CreateEnum
CREATE TYPE "AssetStatus" AS ENUM ('ubrukt', 'registrert', 'trenger_service', 'kassert');

-- CreateTable
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL,
    "navn" TEXT NOT NULL,
    "logoUrl" TEXT,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Kunde" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "navn" TEXT NOT NULL,

    CONSTRAINT "Kunde_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lokasjon" (
    "id" TEXT NOT NULL,
    "kundeId" TEXT NOT NULL,
    "navn" TEXT NOT NULL,

    CONSTRAINT "Lokasjon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Produsent" (
    "id" TEXT NOT NULL,
    "navn" TEXT NOT NULL,

    CONSTRAINT "Produsent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Modell" (
    "id" TEXT NOT NULL,
    "produsentId" TEXT NOT NULL,
    "navn" TEXT NOT NULL,

    CONSTRAINT "Modell_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Asset" (
    "id" TEXT NOT NULL,
    "status" "AssetStatus" NOT NULL DEFAULT 'ubrukt',
    "tenantId" TEXT NOT NULL,
    "kundeId" TEXT,
    "lokasjonId" TEXT,
    "modellId" TEXT,
    "kjopsdato" TIMESTAMP(3),
    "garantiMaaneder" INTEGER,
    "opprettet" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sistEndret" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Produsent_navn_key" ON "Produsent"("navn");

-- CreateIndex
CREATE UNIQUE INDEX "Modell_produsentId_navn_key" ON "Modell"("produsentId", "navn");

-- AddForeignKey
ALTER TABLE "Kunde" ADD CONSTRAINT "Kunde_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lokasjon" ADD CONSTRAINT "Lokasjon_kundeId_fkey" FOREIGN KEY ("kundeId") REFERENCES "Kunde"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Modell" ADD CONSTRAINT "Modell_produsentId_fkey" FOREIGN KEY ("produsentId") REFERENCES "Produsent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_kundeId_fkey" FOREIGN KEY ("kundeId") REFERENCES "Kunde"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_lokasjonId_fkey" FOREIGN KEY ("lokasjonId") REFERENCES "Lokasjon"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_modellId_fkey" FOREIGN KEY ("modellId") REFERENCES "Modell"("id") ON DELETE SET NULL ON UPDATE CASCADE;
