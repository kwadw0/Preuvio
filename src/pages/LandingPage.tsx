import { useState } from "react"
import { Link } from "react-router-dom"
import "./LandingPage.css"
import { config } from "../lib/config"

function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <>
      {/* NAV */}
      <header className="nav" role="banner">
        <div className="container nav__inner">
          <Link to="/" className="brand" aria-label="Preuvio home">
            <span className="brand__mark" aria-hidden>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 3l7 4v5c0 5-3.5 7.5-7 8-3.5-.5-7-3-7-8V7l7-4z" />
                <path d="M9 12l2 2 4-4" />
              </svg>
            </span>
            Preuvio
          </Link>

          <nav className="nav__links" aria-label="Primary">
            <a href="#how-it-works">How it works</a>
            <a href="#features">Features</a>
            <a href="#solutions">Solutions</a>
            <a href="#security">Security</a>
            <a href="#faq">FAQ</a>
          </nav>

          <div className="nav__actions">
            <Link to="/login" className="btn btn--ghost">Sign in</Link>
            <Link to="/signup" className="btn btn--primary hide-mobile">Start collecting — free</Link>
            <button className="nav__toggle" aria-expanded={menuOpen} aria-controls="mobile-drawer" aria-label="Toggle menu" onClick={() => setMenuOpen(v=>!v)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {menuOpen ? <path d="M18 6L6 18M6 6l12 12" /> : <><path d="M4 7h16"/><path d="M4 12h16"/><path d="M4 17h16"/></>}
              </svg>
            </button>
          </div>
        </div>
        {menuOpen && (
          <nav id="mobile-drawer" className="drawer" aria-label="Mobile">
            <a href="#how-it-works" onClick={()=>setMenuOpen(false)}>How it works</a>
            <a href="#features" onClick={()=>setMenuOpen(false)}>Features</a>
            <a href="#solutions" onClick={()=>setMenuOpen(false)}>Solutions</a>
            <a href="#security" onClick={()=>setMenuOpen(false)}>Security</a>
            <a href="#faq" onClick={()=>setMenuOpen(false)}>FAQ</a>
            <Link to="/signup" className="btn btn--primary" style={{justifyContent:"center"}} onClick={()=>setMenuOpen(false)}>Start collecting</Link>
          </nav>
        )}
      </header>

      {/* HERO */}
      <section className="hero">
        <div className="container hero__grid">
          <div className="reveal">
            <div className="eyebrow">
              <span className="eyebrow__dot">✓</span>
              Compliance, without the chase
              <span style={{background:"var(--ivory)", border:"1px solid var(--warm-gray)", borderRadius:999, padding:"2px 8px", fontSize:11, fontWeight:700, color:"var(--verdant)"}}>NEW • Public templates</span>
            </div>
            <h1>
              Stop chasing <br />
              <em>compliance</em> documents.
            </h1>
            <p className="hero__sub">
              Preuvio lets organizations onboard once, build any compliance form, and invite partners via a single link. Track submissions, automate reminders, and always have proof.
            </p>
            <div className="hero__ctas">
              <Link to="/signup" className="btn btn--primary btn--lg">
                Start free — no credit card
                <svg className="btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
              </Link>
              <a href="#how-it-works" className="btn btn--ghost btn--lg">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 8l6 4-6 4V8z"/><circle cx="12" cy="12" r="10"/></svg>
                See how it works
              </a>
            </div>
            <div className="hero__trust">
              <span style={{display:"inline-flex", gap:6, alignItems:"center"}}>
                <span aria-hidden style={{color:"var(--ink)", letterSpacing:"-1px"}}>★★★★★</span>
                <strong style={{color:"var(--ink)"}}>4.9/5</strong> <span style={{color:"var(--muted)"}}>from compliance teams</span>
              </span>
              <span style={{width:1, height:16, background:"var(--line)"}} />
              <span style={{display:"flex", alignItems:"center", gap:8}}>
                <span className="hero__avatars" aria-hidden>
                  <img src="https://i.pravatar.cc/100?img=11" alt="" />
                  <img src="https://i.pravatar.cc/100?img=22" alt="" />
                  <img src="https://i.pravatar.cc/100?img=33" alt="" />
                </span>
                <strong style={{color:"var(--ink)", fontWeight:600}}>2,400+</strong> partners onboarded this month
              </span>
            </div>
          </div>

          {/* Visual mock */}
          <div className="hero__visual reveal" style={{animationDelay:".08s"}} aria-hidden>
            <div className="mock__top">
              <div style={{display:"flex", gap:8, alignItems:"center"}}>
                <span className="mock__dots"><span/><span/><span/></span>
                <span className="mock__title">preuvio — Vendor compliance</span>
              </div>
              <span className="mock__badge">Live tracking</span>
            </div>

            <div className="mock__grid">
              <div className="stat">
                <div className="stat__label">Compliance rate</div>
                <div className="stat__value">94.2%</div>
                <div className="stat__hint stat__hint--up"><i aria-hidden /> 12% this month</div>
              </div>
              <div className="stat">
                <div className="stat__label">Pending</div>
                <div className="stat__value">18</div>
                <div className="stat__hint stat__hint--warn"><i aria-hidden /> 6 expiring soon</div>
              </div>
              <div className="stat">
                <div className="stat__label">Avg. time to submit</div>
                <div className="stat__value">1.8 days</div>
                <div className="stat__hint stat__hint--down"><i aria-hidden /> from 9.4 days</div>
              </div>
            </div>

            <div className="table" role="table">
              <div className="table__head">
                <span>Partners & requests</span>
                <span style={{fontWeight:400, fontFamily:"var(--mono)", fontSize:11}}>Auto-reminders ON</span>
              </div>
              <div className="table__rows">
                <div className="row">
                  <span className="row__partner"><span className="row__avatar">AV</span> Avenor Logistics</span>
                  <span className="mono" style={{fontSize:12, color:"var(--muted)"}}>SOC 2 • Insurance</span>
                  <span className="pill pill--approved">Approved</span>
                  <span style={{fontSize:12, color:"var(--muted)"}}>2h ago</span>
                </div>
                <div className="row">
                  <span className="row__partner"><span className="row__avatar">NS</span> Northstar Supply</span>
                  <span className="mono" style={{fontSize:12, color:"var(--muted)"}}>NDA • ISO 27001</span>
                  <span className="pill pill--submitted">Submitted</span>
                  <span style={{fontSize:12, color:"var(--muted)"}}>Needs review</span>
                </div>
                <div className="row">
                  <span className="row__partner"><span className="row__avatar">QC</span> Quantum Coop</span>
                  <span className="mono" style={{fontSize:12, color:"var(--muted)"}}>W-9 • COI</span>
                  <span className="pill pill--pending">Pending</span>
                  <span style={{fontSize:12, color:"var(--muted)"}}>Reminded</span>
                </div>
                <div className="row">
                  <span className="row__partner"><span className="row__avatar">FL</span> Floren & Co</span>
                  <span className="mono" style={{fontSize:12, color:"var(--muted)"}}>MSA • DPA</span>
                  <span className="pill pill--expired">Expired</span>
                  <span style={{fontSize:12, color:"var(--muted)"}}>Overdue 3d</span>
                </div>
              </div>
            </div>

            <div style={{marginTop:12, display:"flex", gap:8, position:"relative"}}>
              <span style={{flex:1, background:"var(--ink)", color:"white", borderRadius:999, padding:"10px 14px", fontSize:13, fontWeight:600, textAlign:"center"}}>Send reminder → 3 partners</span>
              <span style={{background:"white", border:"1px solid var(--line)", borderRadius:999, padding:"10px 14px", fontSize:13, fontWeight:600}}>Export proof</span>
            </div>
          </div>
        </div>
      </section>

      {/* LOGOS */}
      <section className="logos" aria-label="Trusted by">
        <div className="container logos__inner">
          <span className="logos__label">Trusted by ops & compliance teams at</span>
          <div className="logos__list">
            <span className="logo__item"><i>N</i> Northpeak</span>
            <span className="logo__item"><i>A</i> Avenor</span>
            <span className="logo__item"><i>Q</i> Quantive</span>
            <span className="logo__item"><i>F</i> Floren</span>
            <span className="logo__item"><i>S</i> Sable & Co</span>
            <span className="logo__item"><i>V</i> Veridian</span>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="section">
        <div className="container">
          <div className="section__head">
            <span className="kicker">How it works</span>
            <h2>From invite to proof in 3 steps</h2>
            <p>Built for the real workflow: you own the form, partners do the work, you keep the audit trail.</p>
          </div>

          <div className="steps">
            <article className="step">
              <div className="step__num">01</div>
              <h3>Create or clone a form</h3>
              <p>Build any compliance packet with our form builder — or start from public templates (SOC 2, ISO, COI, W-9, DPA). Add fields, validations, and required docs.</p>
              <div className="step__visual">
                <div style={{display:"flex", gap:6, flexWrap:"wrap"}}>
                  <code>SOC 2 Type II</code> <code>Insurance COI</code> <code>MSA</code>
                </div>
                <div style={{marginTop:8, color:"var(--muted-2)"}}>Drag • Drop • Require • Conditional logic</div>
              </div>
            </article>

            <article className="step">
              <div className="step__num">02</div>
              <h3>Invite partners via link</h3>
              <p>Share a secure link or bulk-invite. Partners get a branded portal — no account maze. They upload, e-sign, and submit in minutes.</p>
              <div className="step__visual">
                <div style={{background:"white", border:"1px solid var(--line)", borderRadius:8, padding:"8px 10px", display:"flex", justifyContent:"space-between", alignItems:"center"}}>
                  <span className="mono">preuv.io/j/avenor-2026</span>
                  <span style={{background:"var(--ink)", color:"white", borderRadius:999, padding:"4px 8px", fontSize:11, fontWeight:700}}>Copy link</span>
                </div>
                <div style={{marginTop:8}}>Auto-reminders • Expiry alerts • Language + branding</div>
              </div>
            </article>

            <article className="step">
              <div className="step__num">03</div>
              <h3>Track & prove compliance</h3>
              <p>Real-time dashboard, version history, and one-click exports. Know who's compliant, who's not, and what's expiring — without spreadsheets.</p>
              <div className="step__visual">
                <div style={{display:"flex", gap:8}}>
                  <span className="pill pill--approved">94% compliant</span>
                  <span className="pill pill--pending">6 expiring</span>
                </div>
                <div style={{marginTop:8}}>Audit trail • Comments • Approvals • PDF export</div>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="section section--soft">
        <div className="container">
          <div className="section__head">
            <span className="kicker">Platform</span>
            <h2>Everything you need to collect proof at scale</h2>
            <p>Flexible enough for any document, opinionated enough to keep you audit-ready.</p>
          </div>

          <div className="features">
            {[
              { title:"Form builder that gets out of the way", desc:"Fields, file uploads, e-signatures, conditional logic. Clone, version, and close forms when done.", bullets:["Rich field types & validations","Reusable blocks & templates","Close / archive anytime"] },
              { title:"Public + private template library", desc:"Start from standard compliance packets or your own. Publish internally or keep private.", bullets:["SOC 2, ISO 27001, COI, W-9","Org-private templates","One-click clone & customize"] },
              { title:"Smart reminders, not spam", desc:"Automated nudges before expiry, on overdue, and on missing fields. Partners thank you.", bullets:["Expiry & renewal alerts","Escalation rules","Branded emails"] },
              { title:"Real-time tracking", desc:"Status per partner, per document. Filter, search, and bulk-act without CSV hell.", bullets:["Pending / Submitted / Approved","Expiry timeline","Bulk approve & remind"] },
              { title:"Partner portal that converts", desc:"Mobile-friendly, no confusing onboarding. Progress bar, help text, and inline errors.", bullets:["Magic link access","Progress & checklist","Inline validation"] },
              { title:"Proof you can export", desc:"Timestamped audit trail, comments, and document versions. Export a compliance packet in one click.", bullets:["Version history","Comments & approvals","PDF / ZIP export"] },
            ].map(f => (
              <article key={f.title} className="feat">
                <span className="feat__icon" aria-hidden>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 12l2 2 4-4"/><path d="M12 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M12 3v6h6"/></svg>
                </span>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
                <ul className="feat__list">
                  {f.bullets.map(b=> <li key={b}>{b}</li>)}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* SOLUTIONS SPLIT */}
      <section id="solutions" className="section">
        <div className="container">
          <div className="section__head">
            <span className="kicker">For everyone</span>
            <h2>Built for both sides of the exchange</h2>
          </div>

          <div className="split">
            <div className="split__card split__card--org">
              <span className="kicker" style={{background:"rgba(255,255,255,.12)", borderColor:"rgba(255,255,255,.18)", color:"white"}}>For organizations</span>
              <h3>Own the process.</h3>
              <p>You decide what to collect, when it expires, and who approves. No more Drive folders named "final_final_v3".</p>
              <ul className="split__list">
                <li><span>◧</span><span><strong>Onboard once,</strong> reuse across vendors, partners, and clients.</span></li>
                <li><span>◧</span><span><strong>Close forms</strong> when a program ends — history stays intact.</span></li>
                <li><span>◧</span><span><strong>Admin & roles</strong> — compliance, legal, ops see what they need.</span></li>
              </ul>
              <div style={{marginTop:22}}>
                <Link to="/signup" className="btn" style={{background:"white", color:"var(--ink)"}}>Create your first form →</Link>
              </div>
            </div>

            <div className="split__card split__card--partner">
              <span className="kicker">For partners</span>
              <h3>Submit in minutes, not days.</h3>
              <p>Clear checklist, progress saved automatically, and reminders that actually help.</p>
              <ul className="split__list">
                <li><span>✓</span><span>No app to install — open the link and go.</span></li>
                <li><span>✓</span><span>Re-use docs across requests; Preuvio remembers.</span></li>
                <li><span>✓</span><span>Know what's approved vs. what needs fixing.</span></li>
              </ul>
              <div style={{marginTop:22, display:"flex", gap:10, flexWrap:"wrap"}}>
                <span className="mono" style={{background:"var(--bg-soft)", border:"1px solid var(--line)", padding:"10px 12px", borderRadius:999, fontSize:12}}>preuv.io/p/quantum-coop</span>
                <span style={{fontSize:13, color:"var(--muted)", alignSelf:"center"}}>Try the partner demo →</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECURITY */}
      <section id="security" className="section section--soft">
        <div className="container security">
          <div>
            <span className="kicker">Security & trust</span>
            <h2>Compliance software should be compliant.</h2>
            <p>Your documents are sensitive. Preuvio is built with encryption, least-privilege access, and an audit trail you can hand to any auditor.</p>
            <div className="badges">
              <span className="badge"><i>🔒</i> SOC 2 Type II in progress</span>
              <span className="badge"><i>◈</i> AES-256 at rest</span>
              <span className="badge"><i>↗</i> TLS 1.3 in transit</span>
              <span className="badge"><i>◎</i> RBAC & SSO</span>
              <span className="badge"><i>✓</i> Audit log</span>
            </div>
            <p style={{marginTop:16, fontSize:13, color:"var(--muted-2)"}}>Data residency options, DPA available, and automatic retention controls. <a href="#" style={{textDecoration:"underline"}}>Read our security overview</a>.</p>
          </div>

          <div className="assurance">
            <div className="assurance__row">
              <div>
                <strong>Retention & expiry</strong><br/><span>Auto-expire & request re-upload</span>
              </div>
              <span className="pill pill--approved">Active</span>
            </div>
            <div className="assurance__row">
              <div>
                <strong>Access control</strong><br/><span>Workspace • Form • Document</span>
              </div>
              <span className="mono" style={{fontSize:12, background:"white", border:"1px solid var(--line)", padding:"6px 8px", borderRadius:999}}>RBAC</span>
            </div>
            <div className="assurance__row">
              <div>
                <strong>Audit trail</strong><br/><span>Who, what, when — immutable</span>
              </div>
              <span style={{fontSize:12, fontWeight:700, color:"var(--ink)", display:"inline-flex", alignItems:"center", gap:6}}><span aria-hidden style={{width:6, height:6, borderRadius:"50%", background:"var(--accent)", display:"inline-block"}} /> Verifiable</span>
            </div>
            <div style={{background:"var(--ink)", color:"white", borderRadius:12, padding:14, display:"flex", justifyContent:"space-between", alignItems:"center"}}>
              <span style={{fontSize:13, fontWeight:600}}>External API ready</span>
              <code style={{background:"rgba(255,255,255,.12)", border:"1px solid rgba(255,255,255,.18)", padding:"6px 8px", borderRadius:8, fontSize:12}}>GET /v1/compliance/proof</code>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING teaser */}
      <section className="section">
        <div className="container">
          <div className="section__head">
            <span className="kicker">Pricing</span>
            <h2>Start free. Scale when you need proof at volume.</h2>
            <p>Transparent today, flexible tomorrow. No per-seat traps.</p>
          </div>

          <div className="pricing">
            <div className="price-card">
              <h3>Starter</h3>
              <div className="price">$0 <small>/ month</small></div>
              <p className="muted" style={{fontSize:13}}>For teams getting organized.</p>
              <ul>
                <li>3 active forms</li>
                <li>50 partners</li>
                <li>Public templates</li>
                <li>Email reminders</li>
              </ul>
              <Link to="/signup" className="btn btn--ghost" style={{marginTop:"auto"}}>Start free</Link>
            </div>

            <div className="price-card price-card--featured">
              <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", position:"relative"}}>
                <h3>Scale</h3>
                <span style={{background:"white", color:"var(--ink)", fontSize:11, fontWeight:800, padding:"6px 10px", borderRadius:999, letterSpacing:".04em"}}>MOST POPULAR</span>
              </div>
              <div className="price">$149 <small>/ month</small></div>
              <p style={{fontSize:13, opacity:.8}}>For teams where compliance is the job.</p>
              <ul>
                <li>Unlimited forms & partners</li>
                <li>Custom branding & SSO</li>
                <li>Advanced reminders & expiry</li>
                <li>Audit export & external API</li>
              </ul>
              <Link to="/signup" className="btn" style={{background:"white", color:"var(--ink)", position:"relative"}}>Start 14-day trial →</Link>
              <span style={{fontSize:12, opacity:.7, marginTop:8, position:"relative"}}>No credit card required • Cancel anytime</span>
            </div>
          </div>
          <p style={{textAlign:"center", marginTop:16, fontSize:13, color:"var(--muted)"}}>Enterprise? <a href="mailto:hello@preuvio.com" style={{textDecoration:"underline", fontWeight:600}}>Talk to us</a> for data residency, SLAs, and private hosting.</p>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="section section--soft">
        <div className="container faq">
          <div>
            <span className="kicker">FAQ</span>
            <h2>Answers before you ask.</h2>
            <p className="muted" style={{fontSize:14}}>If you don't see your question, email <a href="mailto:hello@preuvio.com" style={{textDecoration:"underline", fontWeight:600}}>hello@preuvio.com</a>.</p>
          </div>
          <div className="faq__list">
            <details className="faq__item" open>
              <summary>Can partners reuse documents across forms? <span>−</span></summary>
              <p>Yes. Once a partner uploads a document (e.g., Insurance COI), Preuvio can map it to any matching requirement. You control whether reuse is allowed per form.</p>
            </details>
            <details className="faq__item">
              <summary>What if a form needs to be closed? <span>+</span></summary>
              <p>Close the form — new submissions stop, but existing data, approvals, and audit history remain. Reopen anytime or clone into a new version.</p>
            </details>
            <details className="faq__item">
              <summary>Do I need to build every template from scratch? <span>+</span></summary>
              <p>No. Use our public library for common packets (SOC 2, ISO 27001, W-9, COI, DPA, MSA). Clone, edit, and publish. Or build your own with custom fields and logic.</p>
            </details>
            <details className="faq__item">
              <summary>How does the external API work? <span>+</span></summary>
              <p>The frontend is decoupled via <code className="mono" style={{background:"var(--bg-soft)", padding:"2px 6px", borderRadius:6, border:"1px solid var(--line)"}}>{config.apiBaseUrl}</code>. Pull compliance status, proof bundles, or push invites from your ERP/HRIS. Docs at /docs when you're onboarded.</p>
            </details>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section">
        <div className="container">
          <div className="cta">
            <div>
              <h3>Get proof. Stay compliant.</h3>
              <p>Create your first form in 3 minutes. Invite partners with a link. Sleep before audits.</p>
            </div>
            <div className="cta__actions">
              <Link to="/signup" className="btn" style={{background:"white", color:"var(--ink)"}}>Start free — no credit card</Link>
              <a href="mailto:hello@preuvio.com" className="btn" style={{background:"transparent", color:"white", borderColor:"rgba(255,255,255,.35)"}}>Book a 15-min demo</a>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="container">
          <div className="footer__grid">
            <div>
              <div className="footer__brand"><i>✓</i> Preuvio</div>
              <p style={{fontSize:13, color:"#A8B5B0", marginTop:10, lineHeight:1.6}}>The compliance collection platform. Organizations build forms, partners submit proof, everyone stays audit-ready.</p>
              <p className="mono" style={{fontSize:11, marginTop:14, color:"#8FA39E"}}>API: {config.apiBaseUrl}</p>
            </div>
            <div className="footer__col">
              <h4>Product</h4>
              <a href="#how-it-works">How it works</a>
              <a href="#features">Features</a>
              <a href="#security">Security</a>
              <a href="#">Changelog</a>
            </div>
            <div className="footer__col">
              <h4>Resources</h4>
              <a href="#">Public templates</a>
              <a href="#">Help center</a>
              <a href="#">API docs</a>
              <a href="#">Status</a>
            </div>
            <div className="footer__col">
              <h4>Company</h4>
              <a href="#">About</a>
              <a href="#">Privacy</a>
              <a href="#">Terms</a>
              <a href="mailto:hello@preuvio.com">Contact</a>
            </div>
          </div>
          <div className="footer__bottom">
            <span>© {new Date().getFullYear()} Preuvio Inc. All rights reserved.</span>
            <span style={{display:"flex", gap:12, alignItems:"center"}}>
              <span>SOC 2 • GDPR • AES-256</span>
              <span style={{width:1, height:12, background:"rgba(255,255,255,.12)"}} />
              <a href="#" style={{color:"#A8B5B0"}}>Preuvio is proof.</a>
            </span>
          </div>
        </div>
      </footer>
    </>
  )
}

export default LandingPage
