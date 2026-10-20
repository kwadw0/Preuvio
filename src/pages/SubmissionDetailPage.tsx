import { useEffect, useMemo, useState } from "react"
import { Link, useParams } from "react-router-dom"
import "./DashboardPage.css"
import "./SubmissionDetailPage.css"
import { ApiError } from "../lib/api"
import * as api from "../features/forms/api"
import { usePartnerProfile } from "../features/partners/usePartnerProfile"
import type { EnrichedSubmissionResponse, FieldType, FormDetailResponse } from "../features/forms/types"

type Decision = "approved" | "rejected" | "revision_required"

type StatusMeta = { label: string; stamp: string; tone: string; pill: string }

const STATUS_META: Record<string, StatusMeta> = {
  pending: { label: "Pending review", stamp: "Pending", tone: "pending", pill: "pill--pending" },
  in_review: { label: "In review", stamp: "In review", tone: "in_review", pill: "pill--submitted" },
  approved: { label: "Approved", stamp: "Approved", tone: "approved", pill: "pill--approved" },
  rejected: { label: "Rejected", stamp: "Rejected", tone: "rejected", pill: "pill--expired" },
  revision_required: { label: "Changes requested", stamp: "Changes requested", tone: "revision", pill: "pill--pending" },
}

const FALLBACK_STATUS: StatusMeta = STATUS_META.pending

const DECISIONS: { value: Decision; title: string; hint: string }[] = [
  { value: "approved", title: "Approve", hint: "Accept these answers as complete evidence." },
  { value: "revision_required", title: "Request changes", hint: "Send it back so the partner can revise and resubmit." },
  { value: "rejected", title: "Reject", hint: "Close it as not accepted." },
]

const ANSWERABLE_TYPES: FieldType[] = ["text", "textarea", "number", "email", "phone", "date", "checkbox", "radio", "select", "multiselect", "file", "richtext"]

type Answer = { key: string; label: string; type?: FieldType; value: unknown }
type AnswerGroup = { id: string; title: string; description?: string | null; answers: Answer[] }

function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—"
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return "—"
  return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
}

function shortId(id: string | null | undefined): string {
  return id ? id.slice(0, 8) : "—"
}

function AnswerValue({ value, type }: { value: unknown; type?: FieldType }) {
  if (value === null || value === undefined || value === "") {
    return <span className="submission-empty">Not answered</span>
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return <span className="submission-empty">Not answered</span>
    return (
      <span className="submission-chips">
        {value.map((v, i) => (
          <span className="submission-chip" key={`${String(v)}-${i}`}>{String(v)}</span>
        ))}
      </span>
    )
  }

  if (typeof value === "boolean") return <>{value ? "Yes" : "No"}</>

  const text = String(value)
  if (type === "date") {
    const d = new Date(text)
    if (!Number.isNaN(d.getTime())) {
      return <time dateTime={text}>{d.toLocaleDateString(undefined, { dateStyle: "medium" })}</time>
    }
  }
  if (type === "email" || (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text) && !text.includes(" "))) {
    return <a className="submission-link" href={`mailto:${text}`}>{text}</a>
  }
  if (/^https?:\/\//i.test(text)) {
    return <a className="submission-link" href={text} target="_blank" rel="noreferrer noopener">{text}</a>
  }

  const multiline = type === "textarea" || type === "richtext" || text.includes("\n")
  return <span className={multiline ? "submission-value is-multiline" : "submission-value"}>{text}</span>
}

export default function SubmissionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { isPartner } = usePartnerProfile()

  const [sub, setSub] = useState<EnrichedSubmissionResponse | null>(null)
  const [formDetail, setFormDetail] = useState<FormDetailResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [decision, setDecision] = useState<Decision | null>(null)
  const [reviewing, setReviewing] = useState(false)
  const [reviewError, setReviewError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    setLoading(true)
    setError(null)

    api.getSubmission(id)
      .then(async (submission) => {
        if (cancelled) return
        setSub(submission)
        try {
          const detail = await api.getFormDetail(submission.form_id)
          if (!cancelled) setFormDetail(detail)
        } catch {
          // The form definition can be out of reach (revoked assignment);
          // fall back to raw response keys.
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof ApiError ? e.message : "Failed to load this submission")
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [id])

  const groups = useMemo<AnswerGroup[]>(() => {
    if (!sub) return []
    const responses = sub.responses ?? {}
    const consumed = new Set<string>()
    const result: AnswerGroup[] = []

    for (const section of formDetail?.sections ?? []) {
      const answers: Answer[] = []
      for (const field of section.fields) {
        if (!(field.key in responses)) continue
        consumed.add(field.key)
        answers.push({
          key: field.key,
          label: field.label,
          type: ANSWERABLE_TYPES.includes(field.field_type) ? field.field_type : undefined,
          value: responses[field.key],
        })
      }
      if (answers.length > 0) {
        result.push({
          id: section.section.id,
          title: section.section.title,
          description: section.section.description,
          answers,
        })
      }
    }

    const leftovers = Object.entries(responses).filter(([key]) => !consumed.has(key))
    if (leftovers.length > 0) {
      result.push({
        id: "additional",
        title: "Additional answers",
        answers: leftovers.map(([key, value]) => ({ key, label: key, value })),
      })
    }

    return result
  }, [sub, formDetail])

  const status = STATUS_META[sub?.status ?? "pending"] ?? FALLBACK_STATUS
  const answerCount = useMemo(
    () => groups.reduce((total, group) => total + group.answers.length, 0),
    [groups]
  )

  async function submitReview() {
    if (!sub || !decision) return
    setReviewing(true)
    setReviewError(null)
    setNotice(null)
    try {
      const updated = await api.reviewSubmission(sub.id, decision)
      setSub((prev) => prev ? {
        ...prev,
        status: updated.status,
        reviewed_at: updated.reviewed_at,
        reviewed_by: updated.reviewed_by,
      } : prev)
      setNotice("Decision recorded. The partner sees the new status right away.")
      setDecision(null)
    } catch (e) {
      setReviewError(e instanceof ApiError ? e.message : "Could not record the decision")
    } finally {
      setReviewing(false)
    }
  }

  const partnerGuidance = !sub ? "" : sub.status === "approved"
    ? "Your organization approved this submission. Nothing else is needed."
    : sub.status === "rejected"
      ? "Your organization did not accept this submission. Contact them if you need the reason in writing."
      : sub.status === "revision_required"
        ? "Your organization asked for changes. Open the dossier to revise and resubmit."
        : sub.status === "in_review"
          ? "A reviewer is looking at this submission now. You will see the decision here."
          : "This submission is queued for review. You will see the decision here."

  return (
    <>
      <header className="dash__top submission-top">
        <span className="dash__crumb">
          <Link to={isPartner ? "/assignments" : "/submissions"} style={{ color: "inherit" }}>
            {isPartner ? "My work" : "Submissions"}
          </Link>
          <span aria-hidden>/</span>
          <strong>{sub?.form_title ?? "Submission"}</strong>
        </span>
        <div className="dash__top-actions">
          <button className="btn btn--ghost submission-top__print" style={{ padding: "7px 12px" }} onClick={() => window.print()}>Print</button>
          <Link className="btn btn--ghost" to={isPartner ? "/assignments" : "/submissions"} style={{ padding: "7px 12px" }}>
            {isPartner ? "My work" : "All submissions"}
          </Link>
        </div>
      </header>

      <main className="dash__main submission-page">
        {loading && (
          <div className="dash__card submission-loading" role="status">
            <span>Loading evidence sheet…</span>
          </div>
        )}

        {!loading && error && (
          <div className="dash__card submission-error">
            <p>{error}</p>
            <Link className="btn btn--ghost btn--sm" to={isPartner ? "/assignments" : "/submissions"}>
              {isPartner ? "Back to my work" : "Back to submissions"}
            </Link>
          </div>
        )}

        {!loading && !error && sub && (
          <>
            <section className="submission-hero" aria-labelledby="submission-title">
              <div className="submission-hero__main">
                <span className="submission-hero__eyebrow">
                  <i aria-hidden /> Evidence sheet • {sub.form_status ?? "submission"}
                </span>
                <h1 id="submission-title">{sub.form_title ?? "Untitled form"}</h1>
                <p className="submission-hero__meta">
                  <span>{sub.partner_name ?? "Unknown partner"}</span>
                  {sub.partner_email && <><span className="submission-dot" aria-hidden /><span>{sub.partner_email}</span></>}
                  <span className="submission-dot" aria-hidden />
                  <span>{formatDateTime(sub.submitted_at ?? sub.created_at)}</span>
                  <span className="submission-dot" aria-hidden />
                  <span>{answerCount} answer{answerCount === 1 ? "" : "s"} in {groups.length} section{groups.length === 1 ? "" : "s"}</span>
                </p>
              </div>

              <div className={`submission-stamp submission-stamp--${status.tone}`} aria-label={`Status: ${status.label}`}>
                <span>Status</span>
                <strong>{status.stamp}</strong>
                <em>{sub.reviewed_at ? formatDateTime(sub.reviewed_at) : "Awaiting decision"}</em>
              </div>
            </section>

            <div className="submission-grid">
              <div className="dash__card submission-sheet">
                {groups.length === 0 ? (
                  <div className="submission-sheet__empty">
                    <p>No answers were recorded for this submission.</p>
                  </div>
                ) : (
                  groups.map((group, index) => (
                    <section className="submission-section" key={group.id} aria-labelledby={`section-${group.id}`}>
                      <header className="submission-section__head">
                        <span className="submission-section__no" aria-hidden>{String(index + 1).padStart(2, "0")}</span>
                        <div>
                          <h2 id={`section-${group.id}`}>{group.title}</h2>
                          {group.description && <p className="submission-section__desc">{group.description}</p>}
                        </div>
                      </header>

                      <dl className="submission-answers">
                        {group.answers.map((answer) => (
                          <div className="submission-answer" key={answer.key}>
                            <dt>{answer.label}</dt>
                            <dd><AnswerValue value={answer.value} type={answer.type} /></dd>
                          </div>
                        ))}
                      </dl>
                    </section>
                  ))
                )}

                <footer className="submission-sheet__foot">
                  <p>
                    Stored exactly as submitted. The decision below changes only the review status — answers stay untouched.
                  </p>
                  <span className="submission-fingerprint">#{shortId(sub.id)} · {formatDateTime(sub.created_at)}</span>
                </footer>
              </div>

              <aside className="submission-aside" aria-label="Submission details">
                <section className="submission-panel">
                  <header className="submission-panel__head">
                    <span>Submission</span>
                    <span className={`pill ${status.pill}`}>{status.label}</span>
                  </header>
                  <dl className="submission-facts">
                    <div className="submission-fact">
                      <dt>Form</dt>
                      <dd>{sub.form_title ?? sub.form_id}</dd>
                    </div>
                    <div className="submission-fact">
                      <dt>Partner</dt>
                      <dd>{sub.partner_name ?? "—"}{sub.partner_email ? <span className="submission-fact__sub">{sub.partner_email}</span> : null}</dd>
                    </div>
                    <div className="submission-fact">
                      <dt>Submitted</dt>
                      <dd>{formatDateTime(sub.submitted_at ?? sub.created_at)}</dd>
                    </div>
                    <div className="submission-fact">
                      <dt>Reviewed</dt>
                      <dd>
                        {sub.reviewed_at ? formatDateTime(sub.reviewed_at) : "Not yet"}
                        {sub.reviewed_at && sub.reviewed_by ? <span className="submission-fact__sub">by {isPartner ? "your organization" : shortId(sub.reviewed_by)}</span> : null}
                      </dd>
                    </div>
                    {formDetail && (
                      <div className="submission-fact">
                        <dt>Resubmission</dt>
                        <dd>{formDetail.form.allow_resubmit ? "Allowed" : "Not allowed"}</dd>
                      </div>
                    )}
                    <div className="submission-fact">
                      <dt>Reference</dt>
                      <dd className="submission-fact__mono">{sub.id}</dd>
                    </div>
                  </dl>
                </section>

                {!isPartner ? (
                  <section className="submission-panel submission-aside__decision submission-aside__noprint" aria-labelledby="decision-heading">
                    <header className="submission-panel__head">
                      <span id="decision-heading">Decision</span>
                    </header>
                    <div className="submission-decision">
                      <p className="submission-decision__hint">
                        Record what happens to this submission. The partner sees the new status right away.
                      </p>
                      {DECISIONS.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          className="submission-choice"
                          aria-pressed={decision === option.value}
                          onClick={() => { setDecision(option.value); setReviewError(null); setNotice(null) }}
                        >
                          <strong>{option.title}</strong>
                          <span>{option.hint}</span>
                        </button>
                      ))}
                      <button
                        type="button"
                        className="btn btn--primary"
                        style={{ justifyContent: "center", minHeight: 42 }}
                        onClick={() => void submitReview()}
                        disabled={!decision || reviewing}
                      >
                        {reviewing ? "Recording…" : "Record decision"}
                      </button>
                      {reviewError && <p className="submission-decision__error" role="alert">{reviewError}</p>}
                      {notice && <p className="submission-notice" role="status">{notice}</p>}
                      <p className="submission-decision__note">
                        Only organization members can decide. Every decision is stamped with your name and time.
                      </p>
                    </div>
                  </section>
                ) : (
                  <section className="submission-panel">
                    <header className="submission-panel__head"><span>What happens next</span></header>
                    <div className="submission-guidance">
                      <p>{partnerGuidance}</p>
                      {sub.status === "revision_required" && (
                        <Link className="btn btn--ghost btn--sm" to={`/forms/${sub.form_id}/fill`}>
                          Open dossier to revise →
                        </Link>
                      )}
                    </div>
                  </section>
                )}

                <section className="submission-panel submission-aside__noprint">
                  <header className="submission-panel__head"><span>Actions</span></header>
                  <div className="submission-actions">
                    <Link className="btn btn--ghost btn--sm" to={`/forms/${sub.form_id}/fill`}>
                      {isPartner ? "Open dossier" : "Open form"} →
                    </Link>
                    {!isPartner && (
                      <Link className="btn btn--ghost btn--sm" to={`/forms/${sub.form_id}/submissions`}>
                        All responses for this form
                      </Link>
                    )}
                    <button className="btn btn--ghost btn--sm" type="button" onClick={() => window.print()}>
                      Print / save as PDF
                    </button>
                  </div>
                </section>
              </aside>
            </div>
          </>
        )}
      </main>
    </>
  )
}
