import { useState } from "react"
import { Link } from "react-router-dom"
import { ApiError } from "../lib/api"
import * as authApi from "../features/auth/api"

function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [working, setWorking] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) {
      setError("Enter your work email.")
      return
    }
    setWorking(true)
    setError(null)
    try {
      await authApi.forgotPassword(email)
      setSent(true)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Request failed")
    } finally {
      setWorking(false)
    }
  }

  return (
    <div style={{ minHeight: "100svh", display: "grid", placeItems: "center", padding: 32, background: "var(--bg)" }}>
      <div className="dash__card" style={{ maxWidth: 440, width: "100%", padding: 20, display: "grid", gap: 12, textAlign: "center" }}>
        <h1 style={{ fontFamily: "var(--display)", fontSize: 24, letterSpacing: "-0.03em", margin: 0 }}>Forgot password</h1>
        {sent ? (
          <p style={{ color: "var(--muted)", fontSize: 14, lineHeight: 1.6, margin: 0 }}>
            If an account exists for {email.trim()}, a reset link is on its way. Check your inbox.
          </p>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "grid", gap: 10, textAlign: "left" }}>
            <label className="field"><span>Work email *</span><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ada@company.com" style={{ minHeight: 44 }} autoComplete="email" /></label>
            {error && <div style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--danger)" }}>{error}</div>}
            <button className="btn btn--primary" disabled={working}>{working ? "Sending…" : "Send reset link"}</button>
          </form>
        )}
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <Link to="/login" className="btn btn--ghost">Back to sign in</Link>
          <Link to="/" className="btn btn--ghost">Home</Link>
        </div>
      </div>
    </div>
  )
}

export default ForgotPasswordPage
