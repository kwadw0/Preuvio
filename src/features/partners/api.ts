import { apiAuth } from "../../lib/api"
import type { PartnerResponse, CreatePartnerDto, UpdatePartnerDto, InvitationResponse, InvitePartnerUserDto } from "./types"

type Success<T> = { success: boolean; data: T; message?: string; meta?: { page: number; limit: number; total: number; total_pages: number } }

function unwrap<T>(res: Success<T> | T): T {
  if (res && typeof res === "object" && "data" in (res as Record<string, unknown>)) {
    return (res as Success<T>).data
  }
  return res as T
}

export async function listPartnersPaginated(page = 1, limit = 20): Promise<{ data: PartnerResponse[]; meta?: Success<PartnerResponse[]>["meta"] }> {
  const res = await apiAuth<Success<PartnerResponse[]>>("/api/partners", { method: "GET", params: { page, limit } })
  // upcast to capture meta, still unwrap data for compat
  const out = res as Success<PartnerResponse[]>
  return { data: unwrap(out), meta: out.meta }
}

export async function listPartners(): Promise<PartnerResponse[]> {
  const res = await apiAuth<Success<PartnerResponse[]> | PartnerResponse[]>("/api/partners", { method: "GET" })
  const data = unwrap(res)
  // if server returned paginated envelope, data is already unwrapped; fallback handles plain array
  if (Array.isArray(data)) return data as PartnerResponse[]
  return data as unknown as PartnerResponse[]
}

export async function getPartner(id: string): Promise<PartnerResponse> {
  const res = await apiAuth<Success<PartnerResponse> | PartnerResponse>(`/api/partners/${id}`, { method: "GET" })
  return unwrap(res)
}

/**
 * Returns the partner profile linked to the signed-in user.
 * 200 => the user is a partner user; 403 => org member (no partner_id).
 */
export async function getMyPartner(): Promise<PartnerResponse> {
  const res = await apiAuth<Success<PartnerResponse> | PartnerResponse>("/api/partners/me", { method: "GET" })
  return unwrap(res)
}

export async function createPartner(dto: CreatePartnerDto): Promise<PartnerResponse> {
  const res = await apiAuth<Success<PartnerResponse> | PartnerResponse>("/api/partners", {
    method: "POST",
    body: JSON.stringify(dto),
  })
  return unwrap(res)
}

export async function updatePartner(id: string, dto: UpdatePartnerDto): Promise<PartnerResponse> {
  const res = await apiAuth<Success<PartnerResponse> | PartnerResponse>(`/api/partners/${id}`, {
    method: "PUT",
    body: JSON.stringify(dto),
  })
  return unwrap(res)
}

export async function deletePartner(id: string): Promise<void> {
  await apiAuth(`/api/partners/${id}`, { method: "DELETE" })
}

export async function invitePartnerUser(partnerId: string, dto: InvitePartnerUserDto): Promise<InvitationResponse> {
  const res = await apiAuth<Success<InvitationResponse>>(`/api/partners/${partnerId}/invite`, {
    method: "POST",
    body: JSON.stringify(dto),
  })
  return unwrap(res)
}

export async function listPartnerInvitations(partnerId: string): Promise<InvitationResponse[]> {
  const res = await apiAuth<Success<InvitationResponse[]>>(`/api/partners/${partnerId}/invite`, { method: "GET" })
  return unwrap(res)
}

export async function listPartnerSubmissions(partnerId: string) {
  const res = await apiAuth<Success<unknown[]> | unknown[]>(`/api/partners/${partnerId}/submissions`, { method: "GET" })
  return unwrap(res)
}
