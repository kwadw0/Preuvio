import { Link } from "react-router-dom"

function ForgotPasswordPage() {
  return (
    <div style={{ minHeight: "100svh", display: "grid", placeItems: "center", padding: 32, background: "var(--bg)" }}>
      <div style={{ textAlign: "center", maxWidth: 440 }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: "var(--bg-soft)", border: "1px solid var(--line)", display: "inline-grid", placeItems: "center", marginBottom: 16 }} aria-hidden>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        </div>
        <h1 style={{ fontFamily: "var(--display)", fontSize: 24, letterSpacing: "-0.03em", margin: "0 0 8px" }}>Forgot password</h1>
        <p style={{ color: "var(--muted)", fontSize: 14, lineHeight: 1.6, margin: 0 }}>
          Reset instructions coming soon. Contact your workspace admin or check your email for a reset link.
        </p>
        <div style={{ marginTop: 24, display: "flex", gap: 12, justifyContent: "center" }}>
          <Link to="/login" className="btn btn--ghost">Back to sign in</Link>
          <Link to="/" className="btn btn--primary">Home</Link>
        </div>
      </div>
    </div>
  )
}

export default ForgotPasswordPage
