import { Link } from "react-router-dom"
import "../pages/DashboardPage.css"

// Assignments queue is disabled in the backoffice until the partner portal launches.
// The full queue UI is preserved in MyAssignmentsPage.tsx for portal reuse.
export default function AssignmentsDisabledPage() {
  return (
    <>
      <header className="dash__top">
        <span className="dash__crumb"><span>WORK QUEUE</span><strong>Assignments</strong></span>
        <div className="dash__top-actions">
          <Link to="/partners" className="btn btn--ghost" style={{ padding: "7px 12px" }}>Partners</Link>
        </div>
      </header>
      <main className="dash__main">
        <div className="dash__ledger">
          <div className="dash__ledger-left">
            <span className="dash__ledger-kicker"><i /> Partner portal • coming soon</span>
            <h1 style={{ fontSize: 22, margin: "8px 0" }}>Assignments are disabled here</h1>
            <p>The vendor work queue lives in the partner portal. To give a partner work now, open Partners, pick a vendor, and choose Assign form.</p>
          </div>
        </div>
        <section className="dash__card" style={{ padding: 20, display: "grid", gap: 10, justifyItems: "start" }}>
          <span className="mono-muted" style={{ fontSize: 12 }}>Assigning is partner-centric: Partners → vendor dossier → Assigned forms → Assign form.</span>
          <Link to="/partners" className="btn btn--primary">Go to Partners →</Link>
        </section>
      </main>
    </>
  )
}
