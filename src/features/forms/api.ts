import { apiAuth } from "../../lib/api"
import type {
  ApiSuccess,
  ApiSuccessPaginated,
  CloneTemplateDto,
  CreateFormDto,
  CreateFormFieldDto,
  CreateSectionDto,
  CreateTemplateDto,
  CreateTemplateFieldDto,
  EnrichedSubmissionResponse,
  FormDetailResponse,
  FormFieldResponse,
  FormResponse,
  FormSubmissionResponse,
  FormTemplateResponse,
  Paginated,
  SectionResponse,
  SubmissionFilters,
  TemplateDetailResponse,
  TemplateFieldResponse,
  UpdateFormDto,
  UpdateFormFieldDto,
  UpdateSectionDto,
  UpdateTemplateDto,
  UpdateTemplateFieldDto,
} from "./types"
import { unwrap, unwrapPaginated } from "./types"

type ListRes<T> = ApiSuccess<T[]>
type ItemRes<T> = ApiSuccess<T>

// Templates
export async function listTemplates(): Promise<FormTemplateResponse[]> {
  const res = await apiAuth<ListRes<FormTemplateResponse>>("/api/templates", { method: "GET" })
  return unwrap(res)
}
export async function createTemplate(dto: CreateTemplateDto): Promise<FormTemplateResponse> {
  const res = await apiAuth<ItemRes<FormTemplateResponse>>("/api/templates", {
    method: "POST",
    body: JSON.stringify(dto),
  })
  return unwrap(res)
}
export async function getTemplate(id: string): Promise<FormTemplateResponse> {
  const res = await apiAuth<ItemRes<FormTemplateResponse>>(`/api/templates/${id}`, { method: "GET" })
  return unwrap(res)
}
export async function getTemplateDetail(id: string): Promise<TemplateDetailResponse> {
  const res = await apiAuth<ApiSuccess<TemplateDetailResponse>>(`/api/templates/${id}/detail`, { method: "GET" })
  return unwrap(res)
}
export async function updateTemplate(id: string, dto: UpdateTemplateDto): Promise<FormTemplateResponse> {
  const res = await apiAuth<ItemRes<FormTemplateResponse>>(`/api/templates/${id}`, {
    method: "PUT",
    body: JSON.stringify(dto),
  })
  return unwrap(res)
}
export async function deleteTemplate(id: string): Promise<void> {
  await apiAuth(`/api/templates/${id}`, { method: "DELETE" })
}
export async function cloneTemplate(id: string, dto: CloneTemplateDto): Promise<FormResponse> {
  const res = await apiAuth<ItemRes<FormResponse>>(`/api/templates/${id}/clone`, {
    method: "POST",
    body: JSON.stringify(dto),
  })
  return unwrap(res)
}

// Template sections/fields
export async function listTemplateSections(templateId: string): Promise<SectionResponse[]> {
  const res = await apiAuth<ListRes<SectionResponse>>(`/api/templates/${templateId}/sections`, { method: "GET" })
  return unwrap(res)
}
export async function createTemplateSection(templateId: string, dto: CreateSectionDto): Promise<SectionResponse> {
  const res = await apiAuth<ItemRes<SectionResponse>>(`/api/templates/${templateId}/sections`, {
    method: "POST",
    body: JSON.stringify(dto),
  })
  return unwrap(res)
}
export async function listTemplateFields(templateId: string): Promise<TemplateFieldResponse[]> {
  const res = await apiAuth<ListRes<TemplateFieldResponse>>(`/api/templates/${templateId}/fields`, { method: "GET" })
  return unwrap(res)
}
export async function createTemplateField(templateId: string, dto: CreateTemplateFieldDto): Promise<TemplateFieldResponse> {
  const res = await apiAuth<ItemRes<TemplateFieldResponse>>(`/api/templates/${templateId}/fields`, {
    method: "POST",
    body: JSON.stringify(dto),
  })
  return unwrap(res)
}
export async function updateTemplateField(fieldId: string, dto: UpdateTemplateFieldDto): Promise<TemplateFieldResponse> {
  const res = await apiAuth<ItemRes<TemplateFieldResponse>>(`/api/templates/fields/${fieldId}`, {
    method: "PUT",
    body: JSON.stringify(dto),
  })
  return unwrap(res)
}
export async function deleteTemplateField(fieldId: string): Promise<void> {
  await apiAuth(`/api/templates/fields/${fieldId}`, { method: "DELETE" })
}

// Forms
export async function listForms(): Promise<FormResponse[]> {
  const res = await apiAuth<ListRes<FormResponse>>("/api/forms", { method: "GET" })
  return unwrap(res)
}
export async function createForm(dto: CreateFormDto): Promise<FormResponse> {
  const res = await apiAuth<ItemRes<FormResponse>>("/api/forms", {
    method: "POST",
    body: JSON.stringify(dto),
  })
  return unwrap(res)
}
export async function getForm(id: string): Promise<FormResponse> {
  const res = await apiAuth<ItemRes<FormResponse>>(`/api/forms/${id}`, { method: "GET" })
  return unwrap(res)
}
export async function getFormDetail(id: string): Promise<FormDetailResponse> {
  const res = await apiAuth<ApiSuccess<FormDetailResponse>>(`/api/forms/${id}/detail`, { method: "GET" })
  return unwrap(res)
}
export async function updateForm(id: string, dto: UpdateFormDto): Promise<FormResponse> {
  const res = await apiAuth<ItemRes<FormResponse>>(`/api/forms/${id}`, {
    method: "PUT",
    body: JSON.stringify(dto),
  })
  return unwrap(res)
}
export async function deleteForm(id: string): Promise<void> {
  await apiAuth(`/api/forms/${id}`, { method: "DELETE" })
}

// Form sections/fields
export async function listFormSections(formId: string): Promise<SectionResponse[]> {
  const res = await apiAuth<ListRes<SectionResponse>>(`/api/forms/${formId}/sections`, { method: "GET" })
  return unwrap(res)
}
export async function createFormSection(formId: string, dto: CreateSectionDto): Promise<SectionResponse> {
  const res = await apiAuth<ItemRes<SectionResponse>>(`/api/forms/${formId}/sections`, {
    method: "POST",
    body: JSON.stringify(dto),
  })
  return unwrap(res)
}
export async function listFormFields(formId: string): Promise<FormFieldResponse[]> {
  const res = await apiAuth<ListRes<FormFieldResponse>>(`/api/forms/${formId}/fields`, { method: "GET" })
  return unwrap(res)
}
export async function createFormField(formId: string, dto: CreateFormFieldDto): Promise<FormFieldResponse> {
  const res = await apiAuth<ItemRes<FormFieldResponse>>(`/api/forms/${formId}/fields`, {
    method: "POST",
    body: JSON.stringify(dto),
  })
  return unwrap(res)
}
export async function updateFormField(_formId: string, fieldId: string, dto: UpdateFormFieldDto): Promise<FormFieldResponse> {
  const res = await apiAuth<ItemRes<FormFieldResponse>>(`/api/forms/${_formId}/fields/${fieldId}`, {
    method: "PUT",
    body: JSON.stringify(dto),
  })
  return unwrap(res)
}
export async function deleteFormField(formId: string, fieldId: string): Promise<void> {
  await apiAuth(`/api/forms/${formId}/fields/${fieldId}`, { method: "DELETE" })
}

// Shared section update
export async function updateSection(sectionId: string, dto: UpdateSectionDto): Promise<SectionResponse> {
  const res = await apiAuth<ItemRes<SectionResponse>>(`/api/sections/${sectionId}`, {
    method: "PUT",
    body: JSON.stringify(dto),
  })
  return unwrap(res)
}
export async function deleteSection(sectionId: string): Promise<void> {
  await apiAuth(`/api/sections/${sectionId}`, { method: "DELETE" })
}

// Submissions — enriched + paginated (use GET /api/submissions?...)
export async function listSubmissions(filters: SubmissionFilters = {}): Promise<Paginated<EnrichedSubmissionResponse>> {
  const params: Record<string, string | number | undefined> = {
    status: filters.status,
    form_id: filters.form_id,
    partner_id: filters.partner_id,
    q: filters.q,
    page: filters.page,
    limit: filters.limit,
    sort: filters.sort,
    order: filters.order,
    date_from: filters.date_from,
    date_to: filters.date_to,
  }
  const res = await apiAuth<ApiSuccessPaginated<EnrichedSubmissionResponse>>("/api/submissions", { method: "GET", params })
  return unwrapPaginated<EnrichedSubmissionResponse>(res as ApiSuccessPaginated<EnrichedSubmissionResponse>)
}

// legacy per-form (kept for compat, delegates to enriched)
export async function listFormSubmissions(formId: string): Promise<FormSubmissionResponse[]> {
  const res = await listSubmissions({ form_id: formId, limit: 50 })
  return res.data as FormSubmissionResponse[]
}
export async function createSubmission(formId: string, responses: Record<string, unknown>): Promise<FormSubmissionResponse> {
  const res = await apiAuth<ItemRes<FormSubmissionResponse>>(`/api/forms/${formId}/submissions`, {
    method: "POST",
    body: JSON.stringify({ responses }),
  })
  return unwrap(res)
}
export async function getSubmission(id: string): Promise<EnrichedSubmissionResponse> {
  const res = await apiAuth<ApiSuccess<EnrichedSubmissionResponse>>(`/api/submissions/${id}`, { method: "GET" })
  return unwrap(res) as EnrichedSubmissionResponse
}
export async function reviewSubmission(id: string, status: "approved" | "rejected" | "revision_required"): Promise<FormSubmissionResponse> {
  const res = await apiAuth<ItemRes<FormSubmissionResponse>>(`/api/submissions/${id}/review`, {
    method: "PUT",
    body: JSON.stringify({ status }),
  })
  return unwrap(res)
}
export async function listPartnerSubmissions(partnerId: string): Promise<FormSubmissionResponse[]> {
  const res = await apiAuth<ListRes<FormSubmissionResponse>>(`/api/partners/${partnerId}/submissions`, { method: "GET" })
  return unwrap(res)
}

// Pagination helpers for get-all lists (backward compat + paginated)
export async function listFormsPaginated(page = 1, limit = 20): Promise<Paginated<FormResponse>> {
  const res = await apiAuth<ApiSuccessPaginated<FormResponse>>("/api/forms", { method: "GET", params: { page, limit } })
  return unwrapPaginated<FormResponse>(res as ApiSuccessPaginated<FormResponse>)
}
export async function listTemplatesPaginated(page = 1, limit = 20): Promise<Paginated<FormTemplateResponse>> {
  const res = await apiAuth<ApiSuccessPaginated<FormTemplateResponse>>("/api/templates", { method: "GET", params: { page, limit } })
  return unwrapPaginated<FormTemplateResponse>(res as ApiSuccessPaginated<FormTemplateResponse>)
}
