import { useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { ApiError } from "../lib/api"
import * as authApi from "../features/auth/api"

export default function VerifyEmailPage() {
  const [params] = useSearchParams()
  const [token, setToken] = useState(params.get("token") ?? "")
  const [state, setState] = useState<"idle" | "working" | "done" | "error">("idle")
  const [message, setMessage] = useState<string | null>(null)

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    if (!token.trim()) return
    setState("working")
    setMessage(null)
    try {
      await authApi.verifyEmail(token.trim())
      setState("done")
      setMessage("Email verified — you can now sign in.")
    } catch (err) {
      setState("error")
      setMessage(err instanceof ApiError ? err.message : "Verification failed")
    }
  }

  return (
    <div style={{ minHeight: "100svh", display: "grid", placeItems: "center", padding: 32 }}>
      <div className="dash__card" style={{ maxWidth: 460, width: "100%", padding: 20, display: "grid", gap: 12 }}>
        <span className="dash__ledger-kicker"><i /> Auth • verify email</span>
        <h1 style={{ fontFamily: "var(--display)", fontSize: 22, margin: 0 }}>Verify email</h1>
        <p className="mono-muted" style={{ fontSize: 12, margin: 0 }}>Paste the token from your signup email, or open the link directly.</p>
        <form onSubmit={handleVerify} style={{ display: "grid", gap: 10 }}>
          <label className="field"><span>Token *</span><input value={token} onChange={(e) => setToken(e.target.value)} placeholder="verification token" style={{ minHeight: 44 }} /></label>
          {message && <div style={{ fontFamily: "var(--mono)", fontSize: 12, color: state === "done" ? "var(--verdant)" : "var(--danger)" }}>{message}</div>}
          <button className="btn btn--primary" disabled={!token.trim() || state === "working"}>{state === "working" ? "Verifying…" : "Verify email"}</button>
        </form>
        <div style={{ display: "flex", gap: 8 }}>
          <Link to="/login" className="btn btn--ghost">Back to sign in</Link>
          <Link to="/assignments" className="btn btn--ghost">Work queue →</Link>
        </div>
      </div>
    </div>
  )
}
