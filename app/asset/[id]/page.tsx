import { prisma } from "@/lib/prisma";
import { isAuthenticated } from "@/lib/auth";
import { AssetForm } from "@/components/AssetForm";
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
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f5f4f0" }}>
        <form
          method="POST"
          action="/api/auth/form"
          style={{ background: "white", padding: "2rem", borderRadius: 8, display: "flex", flexDirection: "column", gap: "1rem", width: 280, boxShadow: "0 2px 12px rgba(0,0,0,0.1)" }}
        >
          <h2 style={{ margin: 0, fontSize: "1.2rem" }}>Skriv inn PIN</h2>
          <input type="hidden" name="returnTo" value={`/asset/${id}`} />
          <input
            type="password"
            name="pin"
            inputMode="numeric"
            placeholder="PIN"
            autoFocus
            style={{ padding: "0.75rem", fontSize: "1.1rem", border: "1px solid #ccc", borderRadius: 6, textAlign: "center", letterSpacing: "0.3em" }}
          />
          {pin_error && (
            <p style={{ margin: 0, color: "#c00", fontSize: "0.875rem" }}>Feil PIN – prøv igjen</p>
          )}
          <button
            type="submit"
            style={{ padding: "0.75rem", background: "#1a1a1a", color: "white", border: "none", borderRadius: 6, fontSize: "1rem", cursor: "pointer" }}
          >
            Logg inn
          </button>
        </form>
      </div>
    );
  }

  return (
    <main style={{ padding: "1rem" }}>
      <AssetForm assetId={id} initial={asset as never} tenantId={TENANT_ID} />
    </main>
  );
}
