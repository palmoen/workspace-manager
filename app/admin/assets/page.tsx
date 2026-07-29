import { isAuthenticated } from "@/lib/auth";
import { AssetDashboard } from "@/components/AssetDashboard";

type Props = {
  searchParams: Promise<{ pin_error?: string }>;
};

export default async function AdminAssetsPage({ searchParams }: Props) {
  const { pin_error } = await searchParams;
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
          <input type="hidden" name="returnTo" value="/admin/assets" />
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
    <>
      <nav style={{ padding: "0.75rem 1.5rem", background: "#1a1a1a", display: "flex", gap: "1.5rem" }}>
        <a href="/admin/print" style={{ color: "#9ca3af", textDecoration: "none", fontSize: "0.9rem" }}>QR-print</a>
        <a href="/admin/assets" style={{ color: "white", textDecoration: "none", fontSize: "0.9rem" }}>Asset-oversikt</a>
      </nav>
      <AssetDashboard />
    </>
  );
}
