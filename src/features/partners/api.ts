import { apiAuth } from "../../lib/api"
import type { PartnerResponse, CreatePartnerDto, UpdatePartnerDto } from "./types"

type Success<T> = { success: boolean; data: T; message?: string }

function unwrap<T>(res: Success<T> | T): T {
  if (res && typeof res === "object" && "data" in (res as Record<string, unknown>)) {
    return (res as Success<T>).data
  }
  return res as T
}

export async function listPartners(): Promise<PartnerResponse[]> {
  const res = await apiAuth<Success<PartnerResponse[]> | PartnerResponse[]>("/api/partners", { method: "GET" })
  return unwrap(res)
}

export async function getPartner(id: string): Promise<PartnerResponse> {
  const res = await apiAuth<Success<PartnerResponse> | PartnerResponse>(`/api/partners/${id}`, { method: "GET" })
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

export async function listPartnerSubmissions(partnerId: string) {
  const res = await apiAuth<Success<unknown[]> | unknown[]>(`/api/partners/${partnerId}/submissions`, { method: "GET" })
  return unwrap(res)
}
