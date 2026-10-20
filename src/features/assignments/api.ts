import { apiAuth } from "../../lib/api"
import type { AssignFormDto, AssignResultResponse, AssignmentFilters, AssignmentResponse, Paginated } from "./types"

type Success<T> = { success: boolean; message?: string; data: T; meta?: { page: number; limit: number; total: number; total_pages: number } }

function unwrap<T>(res: Success<T> | T): T {
  if (res && typeof res === "object" && "data" in (res as Record<string, unknown>)) {
    return (res as Success<T>).data
  }
  return res as T
}

function unwrapPaginated<T>(res: Success<T[]> & { meta?: Paginated<T>["meta"] }): Paginated<T> {
  const data = unwrap<T[]>(res as Success<T[]>)
  const meta = (res as { meta?: Paginated<T>["meta"] }).meta ?? { page: 1, limit: data.length || 20, total: data.length, total_pages: 1 }
  return { data, meta }
}

export async function assignForm(formId: string, dto: AssignFormDto): Promise<AssignResultResponse> {
  const res = await apiAuth<Success<AssignResultResponse>>(`/api/forms/${formId}/assign`, {
    method: "POST",
    body: JSON.stringify(dto),
  })
  return unwrap(res)
}

export async function listFormAssignments(formId: string, filters: AssignmentFilters = {}): Promise<Paginated<AssignmentResponse>> {
  const res = await apiAuth<Success<AssignmentResponse[]>>(`/api/forms/${formId}/assignments`, {
    method: "GET",
    params: { status: filters.status, page: filters.page, limit: filters.limit },
  })
  return unwrapPaginated(res)
}

export async function listPartnerAssignments(partnerId: string, filters: AssignmentFilters = {}): Promise<Paginated<AssignmentResponse>> {
  const res = await apiAuth<Success<AssignmentResponse[]>>(`/api/partners/${partnerId}/assignments`, {
    method: "GET",
    params: { status: filters.status, page: filters.page, limit: filters.limit },
  })
  return unwrapPaginated(res)
}

export async function listMyAssignments(filters: AssignmentFilters = {}): Promise<Paginated<AssignmentResponse>> {
  const res = await apiAuth<Success<AssignmentResponse[]>>("/api/assignments/me", {
    method: "GET",
    params: { status: filters.status, page: filters.page, limit: filters.limit },
  })
  return unwrapPaginated(res)
}

export async function revokeAssignment(formId: string, partnerId: string): Promise<void> {
  await apiAuth(`/api/forms/${formId}/assignments/${partnerId}`, { method: "DELETE" })
}
