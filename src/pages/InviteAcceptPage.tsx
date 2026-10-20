import { useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { ApiError } from "../lib/api"
import { setTokens } from "../lib/token"
import * as authApi from "../features/auth/api"

export default function InviteAcceptPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [token, setToken] = useState(params.get("token") ?? "")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [password, setPassword] = useState("")
  const [phone, setPhone] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [working, setWorking] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!token.trim() || !firstName.trim() || !lastName.trim() || password.length < 8 || !phone.trim()) {
      setError("All fields required; password min 8 characters.")
      return
    }
    setWorking(true)
    setError(null)
    try {
      const res = await authApi.acceptInvite({ token: token.trim(), first_name: firstName.trim(), last_name: lastName.trim(), password, phone: phone.trim() })
      if (res.data?.access_token) {
        setTokens(res.data.access_token, res.data.refresh_token)
        navigate("/assignments", { replace: true })
      } else {
        setError("Invalid server response")
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) setError("Account already exists — sign in instead.")
      else if (err instanceof ApiError && err.status === 404) setError("Invite expired or invalid — ask your org for a new invite.")
      else setError(err instanceof ApiError ? err.message : "Accept failed")
    } finally {
      setWorking(false)
    }
  }

  return (
    <div style={{ minHeight: "100svh", display: "grid", placeItems: "center", padding: 32 }}>
      <div className="dash__card" style={{ maxWidth: 480, width: "100%", padding: 20, display: "grid", gap: 12 }}>
        <span className="dash__ledger-kicker"><i /> Invite • vendor onboarding</span>
        <h1 style={{ fontFamily: "var(--display)", fontSize: 22, margin: 0 }}>Accept invite</h1>
        <p className="mono-muted" style={{ fontSize: 12, margin: 0 }}>Create your vendor account. After accept you land on your work queue.</p>
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 10 }}>
          <label className="field"><span>Invite token *</span><input value={token} onChange={(e) => setToken(e.target.value)} placeholder="invite token" style={{ minHeight: 44 }} /></label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <label className="field"><span>First name *</span><input value={firstName} onChange={(e) => setFirstName(e.target.value)} style={{ minHeight: 44 }} autoComplete="given-name" /></label>
            <label className="field"><span>Last name *</span><input value={lastName} onChange={(e) => setLastName(e.target.value)} style={{ minHeight: 44 }} autoComplete="family-name" /></label>
          </div>
          <label className="field"><span>Password * (min 8)</span><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ minHeight: 44 }} autoComplete="new-password" /></label>
          <label className="field"><span>Phone *</span><input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 415 555 0100" style={{ minHeight: 44 }} autoComplete="tel" /></label>
          {error && <div style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--danger)" }}>{error}</div>}
          <button className="btn btn--primary" disabled={working}>{working ? "Accepting…" : "Accept & open work queue →"}</button>
        </form>
        <div style={{ display: "flex", gap: 8 }}>
          <Link to="/login" className="btn btn--ghost">Sign in instead</Link>
        </div>
      </div>
    </div>
  )
}
