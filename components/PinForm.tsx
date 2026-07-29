export function PinForm({ returnTo, error }: { returnTo: string; error?: boolean }) {
  return (
    <div style={{
      minHeight: "100vh",
      background: "#F0F2F5",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "1rem",
    }}>
      <img
        src="/logo-horisontal.svg"
        alt="Kontorcompaniet"
        style={{ height: 36, marginBottom: "2rem" }}
      />
      <div style={{
        background: "white",
        borderRadius: 12,
        boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
        padding: "2rem",
        width: "100%",
        maxWidth: 320,
      }}>
        <p style={{ fontSize: "0.8rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#6b7280", marginBottom: "0.4rem" }}>
          Workspace Manager
        </p>
        <h1 style={{ fontSize: "1.3rem", marginBottom: "1.5rem", color: "#1C2233" }}>
          Skriv inn PIN
        </h1>
        <form method="POST" action="/api/auth/form" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <input type="hidden" name="returnTo" value={returnTo} />
          <input
            type="password"
            name="pin"
            inputMode="numeric"
            placeholder="• • • •"
            autoFocus
            style={{
              padding: "0.9rem",
              fontSize: "1.4rem",
              border: `1px solid ${error ? "#fca5a5" : "#e2e8f0"}`,
              borderRadius: 8,
              textAlign: "center",
              letterSpacing: "0.4em",
              outline: "none",
              width: "100%",
            }}
          />
          {error && (
            <p style={{ color: "#dc2626", fontSize: "0.85rem", textAlign: "center" }}>
              Feil PIN — prøv igjen
            </p>
          )}
          <button
            type="submit"
            style={{
              padding: "0.85rem",
              background: "#1C2233",
              color: "white",
              border: "none",
              borderRadius: 8,
              fontSize: "1rem",
              fontWeight: 600,
              cursor: "pointer",
              letterSpacing: "0.02em",
            }}
          >
            Logg inn
          </button>
        </form>
      </div>
    </div>
  );
}
