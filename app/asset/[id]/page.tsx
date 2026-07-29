import { prisma } from "@/lib/prisma";
import { isAuthenticated } from "@/lib/auth";
import { AssetForm } from "@/components/AssetForm";
import { AssetReadView } from "@/components/AssetReadView";
import { OpprettSakForm } from "@/components/OpprettSakForm";
import { PinForm } from "@/components/PinForm";
import { PageLayout } from "@/components/PageLayout";
import { notFound } from "next/navigation";

const TENANT_ID = process.env.WM_TENANT_ID!;

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ rediger?: string; sak?: string; pin_error?: string }>;
};

export default async function AssetPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { rediger, sak, pin_error } = await searchParams;

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

  // "Opprett sak" — no auth needed
  if (sak === "1") {
    return (
      <Shell id={id} authed={authed}>
        <OpprettSakForm assetId={id} />
      </Shell>
    );
  }

  // "Rediger" — auth required
  if (rediger === "1") {
    if (!authed) {
      return <PinForm returnTo={`/asset/${id}?rediger=1`} error={!!pin_error} />;
    }
    return (
      <Shell id={id} authed={authed}>
        <AssetForm assetId={id} initial={asset as never} tenantId={TENANT_ID} />
      </Shell>
    );
  }

  // Default: read-only view
  const meldinger = authed
    ? await prisma.assetMelding.findMany({
        where: { assetId: id },
        orderBy: { opprettet: "desc" },
      })
    : [];

  return (
    <Shell id={id} authed={authed}>
      <AssetReadView asset={asset as never} authed={authed} meldinger={meldinger as never} />
    </Shell>
  );
}

function Shell({ id, authed, children }: { id: string; authed: boolean; children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", background: "#F0F2F5", display: "flex", flexDirection: "column" }}>
      <header style={{ background: "#1C2233", boxShadow: "0 1px 4px rgba(0,0,0,0.25)" }}>
        <PageLayout style={{ height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <a href={authed ? "/admin/assets" : "/"}>
            <img
              src="/logo-horisontal.svg"
              alt="Kontorcompaniet"
              className="wm-logo"
              style={{ filter: "brightness(0) invert(1)" }}
            />
          </a>
          {authed && (
            <a href="/admin/assets" style={{ color: "#9ca3af", fontSize: "0.85rem" }}>
              ← Oversikt
            </a>
          )}
        </PageLayout>
      </header>
      <main style={{ flex: 1 }}>
        <PageLayout style={{ paddingTop: "1.5rem", paddingBottom: "2rem" }}>
          {children}
        </PageLayout>
      </main>
    </div>
  );
}
