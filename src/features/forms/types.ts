/* Forms System — types aligned with /api/docs/doc.json */

export type FormStatus = "draft" | "active" | "archived"
export type SubmissionStatus = "pending" | "approved" | "rejected" | "revision_required"
export type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "email"
  | "phone"
  | "date"
  | "checkbox"
  | "radio"
  | "select"
  | "multiselect"
  | "file"
  | "richtext"

// --- Templates ---
export type FormTemplateResponse = {
  id: string
  title: string
  description: string | null
  category: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export type SectionResponse = {
  id: string
  title: string
  description: string | null
  sort_order: number
  template_id: string | null
  form_id: string | null
  created_at: string
  updated_at: string
}

export type TemplateFieldResponse = {
  id: string
  template_id: string
  section_id: string
  key: string
  label: string
  field_type: FieldType
  is_required: boolean
  sort_order: number
  placeholder: string | null
  description: string | null
  options: unknown
  validation: unknown
  created_at: string
  updated_at: string
}

export type FormFieldResponse = {
  id: string
  form_id: string
  section_id: string
  key: string
  label: string
  field_type: FieldType
  is_required: boolean
  sort_order: number
  placeholder: string | null
  description: string | null
  options: unknown
  validation: unknown
  created_at: string
  updated_at: string
}

export type TemplateSectionWithFields = {
  section: SectionResponse
  fields: TemplateFieldResponse[]
}

export type TemplateDetailResponse = {
  template: FormTemplateResponse
  sections: TemplateSectionWithFields[]
}

// --- Forms ---
export type FormResponse = {
  id: string
  title: string
  description: string | null
  organization_id: string
  status: FormStatus
  template_id: string | null
  created_at: string
  updated_at: string
}

export type FormFieldDetail = FormFieldResponse
export type SectionDetailResponse = SectionResponse

export type FormSectionWithFields = {
  section: SectionDetailResponse
  fields: FormFieldDetail[]
}

export type FormDetailResponse = {
  form: FormResponse
  sections: FormSectionWithFields[]
}

// --- Submissions ---
export type FormSubmissionResponse = {
  id: string
  form_id: string
  partner_id: string | null
  submitted_by: string | null
  responses: Record<string, unknown>
  status: SubmissionStatus
  submitted_at: string | null
  reviewed_at: string | null
  reviewed_by: string | null
  created_at: string
  updated_at: string
}

// --- Renderer normalized ---
export type RendererField = FormFieldResponse | TemplateFieldResponse
export type RendererSection = {
  section: SectionResponse
  fields: RendererField[]
}
export type RendererSchema = {
  title: string
  description?: string | null
  sections: RendererSection[]
}

// --- DTOs ---
export type CreateTemplateDto = { title: string; description?: string; category?: string }
export type UpdateTemplateDto = CreateTemplateDto & { is_active?: boolean }
export type CreateFormDto = { title: string; description?: string }
export type UpdateFormDto = { title: string; description?: string; status?: FormStatus }
export type CreateSectionDto = { title: string; description?: string; sort_order?: number }
export type UpdateSectionDto = CreateSectionDto
export type CloneTemplateDto = { title: string }
export type CreateFormFieldDto = {
  section_id: string
  key: string
  label: string
  field_type: FieldType
  is_required?: boolean
  sort_order?: number
  placeholder?: string
  description?: string
  options?: unknown
  validation?: unknown
}
export type UpdateFormFieldDto = Omit<CreateFormFieldDto, "section_id"> & { section_id?: string }
export type CreateTemplateFieldDto = CreateFormFieldDto
export type UpdateTemplateFieldDto = UpdateFormFieldDto

// --- Helpers ---
export type ApiSuccess<T> = { success: boolean; message?: string; data: T }

export function unwrap<T>(res: ApiSuccess<T> | T): T {
  if (res && typeof res === "object" && "data" in (res as Record<string, unknown>)) {
    return (res as ApiSuccess<T>).data
  }
  return res as T
}

export function sortByOrder<T extends { sort_order: number }>(arr: T[]): T[] {
  return [...arr].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
}

export function slugKey(label: string): string {
  return label
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 100) || "field"
}

// Conditional visibility stored in validation/options.freeform
export type VisibleIf = {
  visibleIf?: { key: string; op: "eq" | "neq" | "contains" | "gt" | "lt" | "empty" | "not_empty"; value?: unknown }
}

export function getValidation(f: RendererField): (Record<string, unknown> & VisibleIf) | null {
  const v = (f as { validation?: unknown }).validation
  if (v && typeof v === "object") return v as Record<string, unknown> & VisibleIf
  return null
}

export function getOptions(f: RendererField): unknown {
  return (f as { options?: unknown }).options ?? null
}

export function toRendererSchemaFromTemplate(d: TemplateDetailResponse): RendererSchema {
  const mapped: RendererSection[] = d.sections.map((s) => ({ section: s.section, fields: sortByOrder(s.fields) as RendererField[] }))
  const sorted = [...mapped].sort((a, b) => (a.section.sort_order ?? 0) - (b.section.sort_order ?? 0))
  return {
    title: d.template.title,
    description: d.template.description,
    sections: sorted.map((s) => ({ section: s.section, fields: sortByOrder(s.fields) as RendererField[] })),
  }
}

export function toRendererSchemaFromForm(d: FormDetailResponse): RendererSchema {
  const mapped: RendererSection[] = d.sections.map((s) => ({ section: s.section, fields: sortByOrder(s.fields) as RendererField[] }))
  const sorted = [...mapped].sort((a, b) => (a.section.sort_order ?? 0) - (b.section.sort_order ?? 0))
  return {
    title: d.form.title,
    description: d.form.description,
    sections: sorted.map((s) => ({ section: s.section, fields: sortByOrder(s.fields) as RendererField[] })),
  }
}
