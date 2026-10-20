import { useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { ApiError } from "../lib/api"
import * as authApi from "../features/auth/api"

export default function ResetPasswordPage() {
  const [params] = useSearchParams()
  const [token, setToken] = useState(params.get("token") ?? "")
  const [password, setPassword] = useState("")
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [working, setWorking] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!token.trim() || password.length < 8) {
      setError("Token required and password must be at least 8 characters.")
      return
    }
    setWorking(true)
    setError(null)
    try {
      await authApi.resetPassword(token.trim(), password)
      setDone(true)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Reset failed")
    } finally {
      setWorking(false)
    }
  }

  return (
    <div style={{ minHeight: "100svh", display: "grid", placeItems: "center", padding: 32 }}>
      <div className="dash__card" style={{ maxWidth: 460, width: "100%", padding: 20, display: "grid", gap: 12 }}>
        <span className="dash__ledger-kicker"><i /> Auth • reset password</span>
        <h1 style={{ fontFamily: "var(--display)", fontSize: 22, margin: 0 }}>Set a new password</h1>
        {done ? (
          <>
            <div style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--verdant)" }}>Password reset — sign in with your new password.</div>
            <Link to="/login" className="btn btn--primary">Sign in →</Link>
          </>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "grid", gap: 10 }}>
            <label className="field"><span>Token *</span><input value={token} onChange={(e) => setToken(e.target.value)} placeholder="reset token" style={{ minHeight: 44 }} /></label>
            <label className="field"><span>New password * (min 8)</span><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" style={{ minHeight: 44 }} autoComplete="new-password" /></label>
            {error && <div style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--danger)" }}>{error}</div>}
            <button className="btn btn--primary" disabled={working}>{working ? "Resetting…" : "Reset password"}</button>
          </form>
        )}
        <Link to="/login" className="btn btn--ghost">Back to sign in</Link>
      </div>
    </div>
  )
}
