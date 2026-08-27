import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../features/auth/context"
import { validateSignup, type SignupErrors } from "../features/auth/validation"
import { ApiError } from "../lib/api"
import "./SignupPage.css"

type PasswordRule = { label: string; test: (v: string) => boolean }

const passwordRules: PasswordRule[] = [
  { label: "At least 8 characters", test: (v) => v.length >= 8 },
  { label: "One uppercase letter", test: (v) => /[A-Z]/.test(v) },
  { label: "One lowercase letter", test: (v) => /[a-z]/.test(v) },
  { label: "One number", test: (v) => /[0-9]/.test(v) },
]

function SignupPage() {
  const navigate = useNavigate()
  const { signup } = useAuth()

  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [errors, setErrors] = useState<SignupErrors>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const passwordScore = passwordRules.filter((r) => r.test(password)).length

  function handleBlur(field: string) {
    setTouched((prev) => ({ ...prev, [field]: true }))
    const result = validateSignup({
      first_name: firstName,
      last_name: lastName,
      email,
      password,
      phone,
    })
    setErrors(result)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const payload = {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: email.trim().toLowerCase(),
      password,
      phone: phone.trim(),
    }

    const result = validateSignup(payload)
    setErrors(result)
    setTouched({ first_name: true, last_name: true, email: true, password: true, phone: true })

    if (Object.keys(result).length > 0) return

    setIsSubmitting(true)
    try {
      await signup(payload)
      // New users must complete organization onboarding before dashboard
      navigate("/onboarding", { replace: true })
    } catch (err) {
      if (err instanceof ApiError) {
        // Map known status codes to user-friendly messages without leaking internals
        if (err.status === 409) {
          setErrors({ form: "An account with this email already exists." })
        } else if (err.status === 400) {
          // Server validation — surface message but keep generic if too verbose
          const msg = err.message.includes("password") ? err.message : "Please check your details and try again."
          setErrors({ form: msg })
        } else if (err.status === 0) {
          setErrors({ form: "Network error. Please check your connection." })
        } else {
          setErrors({ form: err.message || "Something went wrong. Please try again." })
        }
      } else {
        setErrors({ form: "Something went wrong. Please try again." })
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

          <h1 className="signup__headline">
            Get proof.<br />Stay compliant.
          </h1>
          <p className="signup__tagline">
            Create your first compliance form in 3 minutes. Invite partners with a single link. Always have audit-ready proof.
          </p>

          <ul className="signup__benefits">
            <li><span className="signup__benefit-dot" aria-hidden /><span>Build any compliance form or clone from public templates</span></li>
            <li><span className="signup__benefit-dot" aria-hidden /><span>Invite partners via secure link — no account maze</span></li>
            <li><span className="signup__benefit-dot" aria-hidden /><span>Real-time tracking with one-click audit exports</span></li>
          </ul>
        </div>
      </div>

      {/* Right — form */}
      <div className="signup__right">
        <div className="signup__form-wrap">
          <div className="signup__form-header">
            <h2>Create your account</h2>
            <p>Start your 14-day free trial. No credit card required.</p>
          </div>

          <form className="signup__form" onSubmit={handleSubmit} noValidate>
            {errors.form && (
              <div role="alert" style={{ background: "#FDF0EF", border: "1px solid #E8C4C3", color: "#7A2E2C", padding: "10px 12px", borderRadius: 8, fontSize: 13 }}>
                {errors.form}
              </div>
            )}

            <div className="signup__row">
              <div className="signup__field">
                <label htmlFor="first_name">First name</label>
                <input
                  id="first_name"
                  type="text"
                  placeholder="Ada"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  onBlur={() => handleBlur("first_name")}
                  aria-invalid={touched.first_name && !!errors.first_name}
                  aria-describedby={errors.first_name ? "err-first-name" : undefined}
                  className={touched.first_name && errors.first_name ? "signup__input--error" : ""}
                  autoComplete="given-name"
                />
                {touched.first_name && errors.first_name && (
                  <span className="signup__error" id="err-first-name" role="alert">{errors.first_name}</span>
                )}
              </div>
              <div className="signup__field">
                <label htmlFor="last_name">Last name</label>
                <input
                  id="last_name"
                  type="text"
                  placeholder="Lovelace"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  onBlur={() => handleBlur("last_name")}
                  aria-invalid={touched.last_name && !!errors.last_name}
                  aria-describedby={errors.last_name ? "err-last-name" : undefined}
                  className={touched.last_name && errors.last_name ? "signup__input--error" : ""}
                  autoComplete="family-name"
                />
                {touched.last_name && errors.last_name && (
                  <span className="signup__error" id="err-last-name" role="alert">{errors.last_name}</span>
                )}
              </div>
            </div>

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
              <label htmlFor="phone">Phone</label>
              <input
                id="phone"
                type="tel"
                placeholder="+1 555 000 0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onBlur={() => handleBlur("phone")}
                aria-invalid={touched.phone && !!errors.phone}
                aria-describedby={errors.phone ? "err-phone" : undefined}
                className={touched.phone && errors.phone ? "signup__input--error" : ""}
                autoComplete="tel"
              />
              {touched.phone && errors.phone && (
                <span className="signup__error" id="err-phone" role="alert">{errors.phone}</span>
              )}
            </div>

            <div className="signup__field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => handleBlur("password")}
                aria-invalid={touched.password && !!errors.password}
                aria-describedby={errors.password ? "err-password" : "password-rules"}
                className={touched.password && errors.password ? "signup__input--error" : ""}
                autoComplete="new-password"
              />
              {touched.password && errors.password && (
                <span className="signup__error" id="err-password" role="alert">{errors.password}</span>
              )}

              {password.length > 0 && (
                <div className="signup__strength" id="password-rules">
                  <div className="signup__strength-bar">
                    <div
                      className="signup__strength-fill"
                      style={{
                        width: `${(passwordScore / passwordRules.length) * 100}%`,
                        background: passwordScore <= 1 ? "var(--muted-2)" : passwordScore <= 2 ? "#C9B8A0" : passwordScore <= 3 ? "var(--verdant)" : "var(--forest)",
                      }}
                    />
                  </div>
                  <div className="signup__rules">
                    {passwordRules.map((rule) => (
                      <span key={rule.label} className={`signup__rule ${rule.test(password) ? "signup__rule--pass" : ""}`}>
                        <span className="signup__rule-dot" aria-hidden />
                        {rule.label}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button type="submit" className="btn btn--primary btn--lg signup__submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating account…" : "Create account"}
              {!isSubmitting && <svg className="btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M13 5l7 7-7 7"/></svg>}
            </button>
          </form>

          <p className="signup__footer">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default SignupPage
