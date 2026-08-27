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
