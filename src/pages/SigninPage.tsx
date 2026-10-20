import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../features/auth/context"
import * as partnersApi from "../features/partners/api"
import { setPartnerCache } from "../features/partners/usePartnerProfile"
import { validateLogin, type LoginErrors } from "../features/auth/validation"
import { ApiError } from "../lib/api"
import "./SignupPage.css"

function SigninPage() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [errors, setErrors] = useState<LoginErrors>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  function handleBlur(field: string) {
    setTouched((prev) => ({ ...prev, [field]: true }))
    const result = validateLogin({ email, password })
    setErrors(result)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const payload = { email: email.trim().toLowerCase(), password }
    const result = validateLogin(payload)
    setErrors(result)
    setTouched({ email: true, password: true })

    if (Object.keys(result).length > 0) return

    setIsSubmitting(true)
    try {
      await login(payload)
      // role_id in the JWT/profile is a UUID, so it can never identify a
      // partner by name. Probe the partner-scoped endpoint instead:
      // 200 => partner user, 403 => org member.
      try {
        const partner = await partnersApi.getMyPartner()
        setPartnerCache(partner)
        navigate("/assignments", { replace: true })
        return
      } catch {
        // not a partner user — seed the guard so it does not probe again
        setPartnerCache(null)
      }
      navigate("/dashboard", { replace: true })
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          setErrors({ form: "Invalid email or password." })
        } else if (err.status === 400) {
          setErrors({ form: err.message || "Please check your details." })
        } else if (err.status === 0) {
          setErrors({ form: "Network error. Please check your connection." })
        } else {
          setErrors({ form: err.message || "Sign in failed. Please try again." })
        }
      } else {
        setErrors({ form: "Sign in failed. Please try again." })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="signup">
      {/* Left — branding */}
      <div className="signup__left">
        <div className="signup__left-inner">
          <Link to="/" className="brand" aria-label="Preuvio home">
            <span className="brand__mark" aria-hidden>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 3l7 4v5c0 5-3.5 7.5-7 8-3.5-.5-7-3-7-8V7l7-4z" />
                <path d="M9 12l2 2 4-4" />
              </svg>
            </span>
            Preuvio
          </Link>

          <h1 className="signup__headline">Welcome back.</h1>
          <p className="signup__tagline">Sign in to track compliance, review partner submissions, and keep every document audit-ready.</p>

          <ul className="signup__benefits">
            <li><span className="signup__benefit-dot" aria-hidden /><span>See who is compliant in real time</span></li>
            <li><span className="signup__benefit-dot" aria-hidden /><span>Review, approve, and export proof in one click</span></li>
            <li><span className="signup__benefit-dot" aria-hidden /><span>Stay ahead of expiries with smart reminders</span></li>
          </ul>
        </div>
      </div>

      {/* Right — form */}
      <div className="signup__right">
        <div className="signup__form-wrap">
          <div className="signup__form-header">
            <h2>Sign in to Preuvio</h2>
            <p>Enter your credentials to continue.</p>
          </div>

          <form className="signup__form" onSubmit={handleSubmit} noValidate>
            {errors.form && (
              <div role="alert" style={{ background: "#FDF0EF", border: "1px solid #E8C4C3", color: "#7A2E2C", padding: "10px 12px", borderRadius: 8, fontSize: 13 }}>
                {errors.form}
              </div>
            )}

            <div className="signup__field">
              <label htmlFor="email">Work email</label>
              <input
                id="email"
                type="email"
                placeholder="ada@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => handleBlur("email")}
                aria-invalid={touched.email && !!errors.email}
                aria-describedby={errors.email ? "err-email" : undefined}
                className={touched.email && errors.email ? "signup__input--error" : ""}
                autoComplete="email"
                inputMode="email"
              />
              {touched.email && errors.email && (
                <span className="signup__error" id="err-email" role="alert">{errors.email}</span>
              )}
            </div>

            <div className="signup__field">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <label htmlFor="password">Password</label>
                <Link to="/forgot-password" style={{ fontSize: 13, color: "var(--accent)", fontWeight: 600 }}>Forgot password?</Link>
              </div>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => handleBlur("password")}
                aria-invalid={touched.password && !!errors.password}
                aria-describedby={errors.password ? "err-password" : undefined}
                className={touched.password && errors.password ? "signup__input--error" : ""}
                autoComplete="current-password"
              />
              {touched.password && errors.password && (
                <span className="signup__error" id="err-password" role="alert">{errors.password}</span>
              )}
            </div>

            <button type="submit" className="btn btn--primary btn--lg signup__submit" disabled={isSubmitting}>
              {isSubmitting ? "Signing in…" : "Sign in"}
              {!isSubmitting && <svg className="btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M13 5l7 7-7 7"/></svg>}
            </button>
          </form>

          <p className="signup__footer">
            Don't have an account? <Link to="/signup">Create account</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default SigninPage
