import { useMemo, useState } from "react"
import "./FormRenderer.css"
import type { RendererField, RendererSchema } from "../types"
import { FieldWidget } from "./FieldWidget"
import { evalVisibility } from "../validation"

type Props = {
  schema: RendererSchema
  values: Record<string, unknown>
  onChange: (next: Record<string, unknown>) => void
  errors?: Record<string, string>
  onBlurField?: (key: string) => void
  mode?: "preview" | "fill" | "readonly"
  stepMode?: "single" | "stepper"
  titleOverride?: string
}

export function FormRenderer({ schema, values, onChange, errors = {}, onBlurField, mode = "fill", stepMode = "single" }: Props) {
  const [activeStep, setActiveStep] = useState(0)

  const allFields = useMemo(() => schema.sections.flatMap((s) => s.fields), [schema])
  void allFields

  const visibleSections = useMemo(() => {
    return schema.sections.map((sec) => {
      const visibleFields = sec.fields.filter((f) => evalVisibility(f as RendererField, values))
      return { ...sec, visibleFields }
    })
  }, [schema, values])

  const progress = useMemo(() => {
    const total = schema.sections.reduce((acc, s) => acc + s.fields.filter((f) => evalVisibility(f as RendererField, values)).length, 0)
    const filled = schema.sections.reduce(
      (acc, s) =>
        acc +
        s.fields.filter((f) => {
          if (!evalVisibility(f as RendererField, values)) return false
          const v = values[f.key]
          if (v === undefined || v === null || v === "") return false
          if (Array.isArray(v) && v.length === 0) return false
          return true
        }).length,
      0
    )
    return total === 0 ? 0 : Math.round((filled / total) * 100)
  }, [schema, values])

  const isSingle = stepMode === "single"
  const currentSec = visibleSections[activeStep]

  function setValue(key: string, v: unknown) {
    onChange({ ...values, [key]: v })
  }

  return (
    <div className="fr">
      <div className="fr__header">
        <div className="fr__kicker">
          <i />
          {mode === "preview" ? "Preview • live render" : mode === "readonly" ? "Read-only • dossier" : "Respondent • fill dossier"}
          <span style={{ marginLeft: "auto", fontFamily: "var(--mono)", fontSize: 11, color: "var(--slate)" }}>{progress}% complete</span>
        </div>
        <h2>{schema.title}</h2>
        {schema.description ? <p>{schema.description}</p> : null}
        <div className="fr__progress" aria-hidden>
          <div className="fr__progress-bar">
            <i style={{ width: `${progress}%` }} />
          </div>
          <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--slate-2)", minWidth: 36, textAlign: "right" }}>{progress}%</span>
        </div>
        {!isSingle && (
          <div style={{ display: "flex", gap: 6, marginTop: 12, flexWrap: "wrap" }}>
            {visibleSections.map((sec, idx) => (
              <button
                key={sec.section.id}
                type="button"
                className={`pill ${idx === activeStep ? "pill--approved" : "pill--pending"}`}
                style={{ cursor: "pointer", border: "1px solid var(--warm-gray)" }}
                onClick={() => setActiveStep(idx)}
              >
                {idx + 1}. {sec.section.title}
              </button>
            ))}
          </div>
        )}
      </div>

      {visibleSections.length === 0 ? (
        <div className="fr__section" style={{ padding: 24, textAlign: "center" }}>
          <p style={{ fontFamily: "var(--mono)", fontSize: 13, color: "var(--slate)", margin: 0 }}>No sections yet — add your first section in the builder.</p>
        </div>
      ) : isSingle ? (
        <div className="fr__sections">
          {visibleSections.map((sec) => (
            <section key={sec.section.id} className="fr__section fr__section--paper">
              <div className="fr__section-head">
                <div>
                  <h3 className="fr__section-title">
                    {sec.section.title}
                    <em>
                      {sec.visibleFields.length} fields • sort {sec.section.sort_order}
                    </em>
                  </h3>
                  {sec.section.description ? <div className="fr__section-desc">{sec.section.description}</div> : null}
                </div>
              </div>
              <div className="fr__section-body">
                {sec.visibleFields.length === 0 ? (
                  <span className="fr__hint">No fields in this section.</span>
                ) : (
                  sec.visibleFields.map((f) => {
                    const visible = evalVisibility(f as RendererField, values)
                    return (
                      <div
                        key={f.id}
                        className={visible ? "fr__field fr__field--visible" : "fr__field fr__field--hidden"}
                        style={visible ? undefined : { display: "none" }}
                      >
                        <FieldWidget
                          field={f as RendererField}
                          value={values[f.key]}
                          error={errors[f.key]}
                          onChange={(v) => setValue(f.key, v)}
                          onBlur={() => onBlurField?.(f.key)}
                          disabled={mode === "readonly"}
                        />
                      </div>
                    )
                  })
                )}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="fr__sections">
          {currentSec ? (
            <section className="fr__section fr__section--paper">
              <div className="fr__section-head">
                <div>
                  <h3 className="fr__section-title">
                    Step {activeStep + 1} • {currentSec.section.title}
                    <em>
                      {currentSec.visibleFields.length} fields
                    </em>
                  </h3>
                  {currentSec.section.description ? <div className="fr__section-desc">{currentSec.section.description}</div> : null}
                </div>
                <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--slate-2)" }}>
                  {activeStep + 1} / {visibleSections.length}
                </span>
              </div>
              <div className="fr__section-body">
                {currentSec.visibleFields.map((f) => (
                  <FieldWidget
                    key={f.id}
                    field={f as RendererField}
                    value={values[f.key]}
                    error={errors[f.key]}
                    onChange={(v) => setValue(f.key, v)}
                    onBlur={() => onBlurField?.(f.key)}
                    disabled={mode === "readonly"}
                  />
                ))}
              </div>
              <div className="fr__stepper-nav" style={{ padding: 14, borderTop: "1px solid var(--warm-gray)", background: "var(--ivory)" }}>
                <button type="button" className="btn btn--ghost" disabled={activeStep === 0} onClick={() => setActiveStep((s) => Math.max(0, s - 1))} style={{ minHeight: 44 }}>
                  ← Previous
                </button>
                <button
                  type="button"
                  className="btn btn--primary"
                  disabled={activeStep === visibleSections.length - 1}
                  onClick={() => setActiveStep((s) => Math.min(visibleSections.length - 1, s + 1))}
                  style={{ minHeight: 44 }}
                >
                  Next →
                </button>
              </div>
            </section>
          ) : null}
        </div>
      )}
    </div>
  )
}
