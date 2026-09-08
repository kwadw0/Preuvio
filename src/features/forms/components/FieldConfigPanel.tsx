import { useEffect, useState } from "react"
import "./FieldConfigPanel.css"
import type { FieldType, RendererField } from "../types"

type Draft = {
  label: string
  field_type: FieldType
  is_required: boolean
  sort_order: number
  placeholder: string
  description: string
  optionsText: string // comma separated for select/multiselect
  validationText: string // JSON
  visibleKey: string
  visibleOp: string
  visibleValue: string
}

const FIELD_TYPES: { value: FieldType; label: string; icon: string }[] = [
  { value: "text", label: "Text", icon: "T" },
  { value: "number", label: "Number", icon: "#" },
  { value: "email", label: "Email", icon: "@" },
  { value: "phone", label: "Phone", icon: "☎" },
  { value: "date", label: "Date", icon: "📅" },
  { value: "textarea", label: "Textarea", icon: "≡" },
  { value: "select", label: "Select", icon: "▾" },
  { value: "multiselect", label: "Multi", icon: "▾▾" },
  { value: "checkbox", label: "Checkbox", icon: "☑" },
  { value: "radio", label: "Radio", icon: "○" },
  { value: "file", label: "File", icon: "📎" },
  { value: "richtext", label: "Rich", icon: "¶" },
]

type Props = {
  field?: RendererField | null
  allKeys: string[]
  defaultSortOrder: number
  onSave: (dto: { draft: Draft; payload: Record<string, unknown> }) => void
  onCancel: () => void
}

function draftFromField(field: RendererField | null | undefined, defaultSort: number): Draft {
  if (!field) {
    return {
      label: "",
      field_type: "text",
      is_required: false,
      sort_order: defaultSort,
      placeholder: "",
      description: "",
      optionsText: "",
      validationText: "",
      visibleKey: "",
      visibleOp: "eq",
      visibleValue: "",
    }
  }
  const v = (field.validation ?? {}) as Record<string, unknown>
  const cond = (v.visibleIf ?? null) as { key: string; op: string; value?: unknown } | null
  const opts = (() => {
    const o = (field as { options?: unknown }).options
    if (Array.isArray(o)) return o.map((x) => (typeof x === "string" ? x : (x as { label?: string }).label ?? String(x))).join(", ")
    if (o && typeof o === "object") return Object.values(o as Record<string, string>).join(", ")
    return ""
  })()
  const validationWithoutCond = (() => {
    const copy = { ...v }
    delete (copy as Record<string, unknown>).visibleIf
    return Object.keys(copy).length ? JSON.stringify(copy, null, 2) : ""
  })()
  return {
    label: field.label,
    field_type: field.field_type,
    is_required: field.is_required,
    sort_order: field.sort_order,
    placeholder: field.placeholder ?? "",
    description: field.description ?? "",
    optionsText: opts,
    validationText: validationWithoutCond,
    visibleKey: cond?.key ?? "",
    visibleOp: cond?.op ?? "eq",
    visibleValue: cond?.value !== undefined ? String(cond.value) : "",
  }
}

export function FieldConfigPanel({ field, allKeys, defaultSortOrder, onSave, onCancel }: Props) {
  const [draft, setDraft] = useState<Draft>(() => draftFromField(field, defaultSortOrder))

  useEffect(() => {
    setDraft(draftFromField(field, defaultSortOrder))
  }, [field, defaultSortOrder])

  function update<K extends keyof Draft>(key: K, val: Draft[K]) {
    setDraft((d) => ({ ...d, [key]: val }))
  }

  function handleSave() {
    let validation: Record<string, unknown> = {}
    if (draft.validationText.trim()) {
      try {
        const parsed = JSON.parse(draft.validationText)
        if (parsed && typeof parsed === "object") validation = parsed as Record<string, unknown>
      } catch {
        alert("Validation must be valid JSON")
        return
      }
    }
    if (draft.visibleKey) {
      validation.visibleIf = { key: draft.visibleKey, op: draft.visibleOp, value: draft.visibleValue }
    }
    let options: unknown = undefined
    if (["select", "multiselect", "radio", "checkbox"].includes(draft.field_type) && draft.optionsText.trim()) {
      const arr = draft.optionsText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
      options = arr
    }
    if (!draft.label.trim()) {
      alert("Label is required")
      return
    }
    const payload: Record<string, unknown> = {
      label: draft.label.trim(),
      field_type: draft.field_type,
      is_required: draft.is_required,
      sort_order: Number(draft.sort_order) || 0,
      placeholder: draft.placeholder || undefined,
      description: draft.description || undefined,
      options,
      validation: Object.keys(validation).length ? validation : undefined,
    }
    onSave({ draft, payload })
  }

  return (
    <div className="fcp" role="dialog" aria-label="Field configuration">
      <div className="fcp__head">
        <h3>{field ? "Edit field" : "Add field"}</h3>
        <button type="button" className="dash__icon-btn" aria-label="Close" onClick={onCancel}>
          ✕
        </button>
      </div>

      <div className="fcp__body">
        <div>
          <label className="field" style={{ display: "grid", gap: 6 }}>
            <span style={{ fontFamily: "var(--mono)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em", color: "var(--graphite)" }}>Field type</span>
            <div className="type-picker">
              {FIELD_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  className={draft.field_type === t.value ? "is-active" : ""}
                  onClick={() => update("field_type", t.value)}
                  aria-pressed={draft.field_type === t.value}
                >
                  <span style={{ width: 28, height: 28, borderRadius: 8, background: "var(--ivory)", border: "1px solid var(--warm-gray)", display: "grid", placeItems: "center", fontSize: 12 }}>{t.icon}</span>
                  {t.label}
                </button>
              ))}
            </div>
          </label>
        </div>

        <label className="field">
          <span style={{ fontFamily: "var(--mono)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em", color: "var(--graphite)" }}>Label</span>
          <input value={draft.label} onChange={(e) => update("label", e.target.value)} placeholder="e.g. Company name" style={{ minHeight: 44 }} />
        </label>

        <label className="field">
          <span style={{ fontFamily: "var(--mono)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em", color: "var(--graphite)" }}>Sort order</span>
          <input type="number" value={draft.sort_order} onChange={(e) => update("sort_order", Number(e.target.value))} style={{ minHeight: 44 }} />
        </label>
        {field?.key && (
          <div className="mono-muted" style={{ fontSize: 11, background: "var(--ivory)", border: "1px solid var(--warm-gray)", padding: "8px 10px", borderRadius: 8 }}>
            Key: <code>{field.key}</code> — auto-generated by server, read-only
          </div>
        )}

        <label className="field">
          <span style={{ fontFamily: "var(--mono)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em", color: "var(--graphite)" }}>Placeholder</span>
          <input value={draft.placeholder} onChange={(e) => update("placeholder", e.target.value)} placeholder="Optional placeholder" style={{ minHeight: 44 }} />
        </label>

        <label className="field">
          <span style={{ fontFamily: "var(--mono)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em", color: "var(--graphite)" }}>Description (helper)</span>
          <input value={draft.description} onChange={(e) => update("description", e.target.value)} placeholder="Helper text under field" style={{ minHeight: 44 }} />
        </label>

        <label className="field" style={{ display: "flex", alignItems: "center", gap: 10, flexDirection: "row" }}>
          <input type="checkbox" checked={draft.is_required} onChange={(e) => update("is_required", e.target.checked)} style={{ width: 18, height: 18, accentColor: "var(--verdant)" }} />
          <span style={{ fontFamily: "var(--mono)", fontSize: 12, fontWeight: 600, color: "var(--graphite)" }}>Required</span>
        </label>

        {(["select", "multiselect", "radio", "checkbox"].includes(draft.field_type) || draft.optionsText) && (
          <label className="field">
            <span style={{ fontFamily: "var(--mono)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em", color: "var(--graphite)" }}>Options (comma-separated)</span>
            <input value={draft.optionsText} onChange={(e) => update("optionsText", e.target.value)} placeholder="e.g. Option A, Option B, Option C" style={{ minHeight: 44 }} />
          </label>
        )}

        <label className="field">
          <span style={{ fontFamily: "var(--mono)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em", color: "var(--graphite)" }}>
            Validation JSON (optional) — e.g. {`{"minLength":2,"pattern":"^.+$"}`}
          </span>
          <textarea value={draft.validationText} onChange={(e) => update("validationText", e.target.value)} placeholder={`{"minLength":2,"maxLength":100}`} rows={3} style={{ fontFamily: "var(--mono)", fontSize: 12 }} />
        </label>

        <div style={{ borderTop: "1px solid var(--warm-gray)", paddingTop: 12, display: "grid", gap: 8 }}>
          <span style={{ fontFamily: "var(--mono)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em", color: "var(--graphite)" }}>Conditional visibility (optional)</span>
          <div className="fcp__grid2" style={{ gridTemplateColumns: "1.2fr 0.8fr 1fr" }}>
            <select value={draft.visibleKey} onChange={(e) => update("visibleKey", e.target.value)} style={{ minHeight: 44 }}>
              <option value="">Always visible</option>
              {allKeys
                .filter((k) => k !== field?.key)
                .map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
            </select>
            <select value={draft.visibleOp} onChange={(e) => update("visibleOp", e.target.value)} style={{ minHeight: 44 }}>
              <option value="eq">equals</option>
              <option value="neq">not equals</option>
              <option value="contains">contains</option>
              <option value="empty">is empty</option>
              <option value="not_empty">not empty</option>
              <option value="gt">greater than</option>
              <option value="lt">less than</option>
            </select>
            <input value={draft.visibleValue} onChange={(e) => update("visibleValue", e.target.value)} placeholder="value" style={{ minHeight: 44 }} disabled={!draft.visibleKey || ["empty", "not_empty"].includes(draft.visibleOp)} />
          </div>
          <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--slate-2)" }}>Stored in validation.visibleIf — preview will animate in/out.</span>
        </div>
      </div>

      <div className="fcp__foot">
        <button type="button" className="btn btn--ghost" onClick={onCancel} style={{ minHeight: 44 }}>
          Cancel
        </button>
        <button type="button" className="btn btn--primary" onClick={handleSave} style={{ minHeight: 44 }}>
          {field ? "Save field" : "Add field"}
        </button>
      </div>
    </div>
  )
}
