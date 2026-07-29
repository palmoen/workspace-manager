import { prisma } from "@/lib/prisma";
import { isAuthenticated } from "@/lib/auth";
import { AssetForm } from "@/components/AssetForm";
import { PinForm } from "@/components/PinForm";
import { notFound } from "next/navigation";

const TENANT_ID = process.env.WM_TENANT_ID!;

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ pin_error?: string }>;
};

export default async function AssetPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { pin_error } = await searchParams;

  const asset = await prisma.asset.findUnique({
    where: { id },
    include: {
      kunde: true,
      lokasjon: true,
      modell: { include: { produsent: true, produkttype: true } },
      produkttype: true,
      hendelser: { orderBy: { opprettet: "desc" } },
    },
  });

  if (!asset) notFound();

  const authed = await isAuthenticated();

  if (!authed) {
    return <PinForm returnTo={`/asset/${id}`} error={!!pin_error} />;
  }

  return (
    <div style={{ minHeight: "100vh", background: "#F0F2F5", display: "flex", flexDirection: "column" }}>
      <header style={{
        background: "#1C2233",
        height: 56,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 1.5rem",
        boxShadow: "0 1px 4px rgba(0,0,0,0.25)",
      }}>
        <a href="/admin/assets">
          <img src="/logo-horisontal.svg" alt="Kontorcompaniet" style={{ height: 26, filter: "brightness(0) invert(1)" }} />
        </a>
        <a href="/admin/assets" style={{ color: "#9ca3af", fontSize: "0.85rem" }}>
          ← Oversikt
        </a>
      </header>
      <main style={{ flex: 1, padding: "1.5rem 1rem", maxWidth: 1100, margin: "0 auto", width: "100%" }}>
        <AssetForm assetId={id} initial={asset as never} tenantId={TENANT_ID} />
      </main>
    </div>
  );
}
