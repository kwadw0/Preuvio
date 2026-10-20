import { apiAuth } from "../../lib/api"
import type { OrgCreateDto, OrganizationResponseDto } from "./types"

export function createOrganization(dto: OrgCreateDto) {
  const payload: Record<string, unknown> = {
    name: dto.name.trim(),
    industry: dto.industry,
    team_size: dto.team_size,
    primary_customer_type: dto.primary_customer_type,
    owner_role: dto.owner_role,
  }
  if (dto.description !== undefined && dto.description.trim() !== "") payload.description = dto.description.trim()
  if (dto.website_url !== undefined && dto.website_url.trim() !== "") payload.website_url = dto.website_url.trim()

  return apiAuth<{ data: OrganizationResponseDto } | OrganizationResponseDto>("/api/organizations", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export function fetchMyOrganization() {
  return apiAuth<{ data: OrganizationResponseDto } | OrganizationResponseDto>("/api/organizations/me", {
    method: "GET",
  })
}

export function extractOrg(dto: { data: OrganizationResponseDto } | OrganizationResponseDto): OrganizationResponseDto {
  return (dto as { data: OrganizationResponseDto }).data ?? (dto as OrganizationResponseDto)
}

export type OrgUpdateDto = Partial<{
  name: string
  description: string
  industry: string
  team_size: string
  website_url: string
  owner_role: string
  primary_customer_type: "b2b" | "b2c" | "both"
}>

export function listOrganizations(page = 1, limit = 20) {
  return apiAuth<{ data: OrganizationResponseDto[]; meta?: { page: number; limit: number; total: number; total_pages: number } } | OrganizationResponseDto[]>("/api/organizations", {
    method: "GET",
    params: { page, limit },
  })
}

export function getOrganization(id: string) {
  return apiAuth<{ data: OrganizationResponseDto } | OrganizationResponseDto>(`/api/organizations/${id}`, {
    method: "GET",
  })
}

export function updateOrganization(id: string, dto: OrgUpdateDto) {
  const payload: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(dto)) {
    if (typeof v === "string" ? v.trim() !== "" : v !== undefined) payload[k] = typeof v === "string" ? v.trim() : v
  }
  return apiAuth<{ data: OrganizationResponseDto } | OrganizationResponseDto>(`/api/organizations/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  })
}

export function deleteOrganization(id: string) {
  return apiAuth(`/api/organizations/${id}`, { method: "DELETE" })
}
