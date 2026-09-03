import type { RendererField } from "../types"
import { getOptions } from "../types"

type Props = {
  field: RendererField
  value: unknown
  error?: string
  onChange: (v: unknown) => void
  onBlur?: () => void
  disabled?: boolean
}

function toOpts(field: RendererField): string[] {
  const o = getOptions(field)
  if (!o) return []
  if (Array.isArray(o)) return o.map((x) => (typeof x === "string" ? x : (x as { label?: string; value?: string }).label ?? (x as { value?: string }).value ?? String(x)))
  if (typeof o === "object") return Object.values(o as Record<string, string>).map(String)
  return []
}

export function FieldWidget({ field, value, error, onChange, onBlur, disabled }: Props) {
  const opts = toOpts(field)
  const common = {
    id: `field-${field.key}`,
    disabled,
    "aria-invalid": !!error,
    "aria-describedby": error ? `err-${field.key}` : field.description ? `hint-${field.key}` : undefined,
    onBlur,
  } as const

  const control = (() => {
    switch (field.field_type) {
      case "textarea":
      case "richtext":
        return (
          <textarea
            {...common}
            value={(value as string) ?? ""}
            placeholder={field.placeholder ?? ""}
            onChange={(e) => onChange(e.target.value)}
            rows={4}
          />
        )
      case "number":
        return (
          <input
            {...common}
            type="number"
            value={(value as string | number) ?? ""}
            placeholder={field.placeholder ?? ""}
            onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
          />
        )
      case "email":
        return (
          <input
            {...common}
            type="email"
            inputMode="email"
            value={(value as string) ?? ""}
            placeholder={field.placeholder ?? "name@company.com"}
            onChange={(e) => onChange(e.target.value)}
          />
        )
      case "phone":
        return (
          <input
            {...common}
            type="tel"
            inputMode="tel"
            value={(value as string) ?? ""}
            placeholder={field.placeholder ?? "+1 555…"}
            onChange={(e) => onChange(e.target.value)}
          />
        )
      case "date":
        return (
          <input
            {...common}
            type="date"
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
          />
        )
      case "select":
        return (
          <select {...common} value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)}>
            <option value="">{field.placeholder ?? "Select…"}</option>
            {opts.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        )
      case "radio":
        return (
          <div className="fr__radio-group" role="radiogroup" aria-labelledby={`label-${field.key}`}>
            {opts.map((o) => (
              <label key={o} className="fr__check-option">
                <input type="radio" name={field.key} value={o} checked={String(value) === o} onChange={() => onChange(o)} disabled={disabled} />
                <span>{o}</span>
              </label>
            ))}
          </div>
        )
      case "multiselect": {
        const arr = Array.isArray(value) ? (value as string[]) : []
        return (
          <div className="fr__check-group">
            {opts.map((o) => (
              <label key={o} className="fr__check-option">
                <input
                  type="checkbox"
                  checked={arr.includes(o)}
                  onChange={(e) => {
                    if (e.target.checked) onChange([...arr, o])
                    else onChange(arr.filter((x) => x !== o))
                  }}
                  disabled={disabled}
                />
                <span>{o}</span>
              </label>
            ))}
          </div>
        )
      }
      case "checkbox": {
        if (opts.length > 1) {
          const arr = Array.isArray(value) ? (value as string[]) : []
          return (
            <div className="fr__check-group">
              {opts.map((o) => (
                <label key={o} className="fr__check-option">
                  <input
                    type="checkbox"
                    checked={arr.includes(o)}
                    onChange={(e) => {
                      if (e.target.checked) onChange([...arr, o])
                      else onChange(arr.filter((x) => x !== o))
                    }}
                    disabled={disabled}
                  />
                  <span>{o}</span>
                </label>
              ))}
            </div>
          )
        }
        return (
          <label className="fr__check-option">
            <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} disabled={disabled} />
            <span>{field.placeholder ?? "Yes"}</span>
          </label>
        )
      }
      case "file":
        return <FileField field={field} value={value} onChange={onChange} disabled={disabled} />
      default:
        return (
          <input
            {...common}
            type="text"
            value={(value as string) ?? ""}
            placeholder={field.placeholder ?? ""}
            onChange={(e) => onChange(e.target.value)}
          />
        )
    }
  })()

  return (
    <div className="fr__field fr__field--visible">
      <label id={`label-${field.key}`} className="fr__label" htmlFor={`field-${field.key}`}>
        {field.label}
        {field.is_required ? <i>*</i> : null}
        <span style={{ marginLeft: 4 }}>{field.field_type}</span>
      </label>
      <div className="fr__control">{control}</div>
      {field.description ? (
        <span id={`hint-${field.key}`} className="fr__hint">
          {field.description}
        </span>
      ) : null}
      {error ? (
        <span id={`err-${field.key}`} className="fr__error" role="alert">
          {error}
        </span>
      ) : null}
    </div>
  )
}

function FileField({ field, value, onChange, disabled }: { field: RendererField; value: unknown; onChange: (v: unknown) => void; disabled?: boolean }) {
  // value is string filename or File name; support multiple via array
  const files = (() => {
    if (!value) return [] as { name: string; progress: number; status: "success" | "uploading" | "error" }[]
    if (Array.isArray(value)) return value as { name: string; progress: number; status: string }[] as never
    if (typeof value === "string") return [{ name: value as string, progress: 100, status: "success" as const }]
    return []
  })()

  function handleFiles(list: FileList | null) {
    if (!list) return
    const names = Array.from(list).map((f) => ({ name: f.name, progress: 0, status: "uploading" as const }))
    // simulate progress then success
    onChange([...(files as unknown[]), ...names])
    // fake progress; real upload would post to presigned url
    names.forEach((_, idx) => {
      let p = 0
      const id = setInterval(() => {
        p += 25
        if (p >= 100) {
          clearInterval(id)
          // mark success
          const cur = (Array.isArray(value) ? (value as { name: string; progress: number; status: string }[]) : [{ name: String(value), progress: 100, status: "success" }]) as { name: string; progress: number; status: string }[]
          // simplified: set all uploading to success
          const next = cur.map((x) => (x.status === "uploading" ? { ...x, progress: 100, status: "success" } : x))
          onChange([...next.slice(0, cur.length - names.length), ...names.map((n) => ({ ...n, progress: 100, status: "success" as const }))].flat() as unknown)
        } else {
          // update interim progress for this file
          onChange((prev: unknown) => {
            // if onChange doesn't support function, just ignore intermediate — handled via timeout above
            void prev
            return prev
          })
          void idx
        }
      }, 120)
    })
    // immediate success fallback for file input demo (avoid File object serialization issues)
    setTimeout(() => {
      const finalNames = Array.from(list).map((f) => ({ name: f.name, progress: 100, status: "success" as const }))
      // merge or replace
      if (field.field_type === "file") {
        // keep existing + new as array of objects -> renderer stores as array of names for submission map compatibility
        // submission expects key->value freeform; store comma-separated names for simplicity
        onChange(finalNames.map((x) => x.name).join(", "))
      }
    }, 600)
  }

  return (
    <div className="fr__file">
      <input id={`field-${field.key}`} type="file" onChange={(e) => handleFiles(e.target.files)} disabled={disabled} multiple={false} />
      <label htmlFor={`field-${field.key}`} className="btn btn--ghost fr__file-btn" style={{ borderStyle: "dashed", cursor: disabled ? "not-allowed" : "pointer" }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <path d="M14 2v6h6" />
        </svg>
        {disabled ? "Upload disabled" : "Choose file"}
      </label>
      {field.placeholder ? <span className="fr__hint">{field.placeholder}</span> : null}
      {files.length > 0 && (
        <div className="fr__file-list">
          {files.map((f, i) => (
            <div key={`${f.name}-${i}`} className="fr__file-item">
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 28, height: 28, borderRadius: 8, background: "var(--ivory)", border: "1px solid var(--warm-gray)", display: "grid", placeItems: "center", fontFamily: "var(--mono)", fontSize: 10 }}>FILE</span>
                {f.name}
              </span>
              <span className={`pill ${f.status === "success" ? "pill--approved" : f.status === "error" ? "pill--expired" : "pill--pending"}`} style={{ fontSize: 11 }}>
                {f.status}
              </span>
              {f.progress < 100 && (
                <div className="fr__file-progress" style={{ flexBasis: "100%" }}>
                  <i style={{ width: `${f.progress}%` }} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
