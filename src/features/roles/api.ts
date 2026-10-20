import { apiAuth } from "../../lib/api"
import type { CreateRoleDto, RoleResponseDto, UpdateRoleDto } from "./types"

type Success<T> = {
  success: boolean
  data: T
  message?: string
  meta?: { page: number; limit: number; total: number; total_pages: number }
}

function unwrap<T>(res: Success<T> | T): T {
  if (res && typeof res === "object" && "data" in (res as Record<string, unknown>)) {
    return (res as Success<T>).data
  }
  return res as T
}

export async function listRoles(page = 1, limit = 50): Promise<{ data: RoleResponseDto[]; meta?: Success<RoleResponseDto[]>["meta"] }> {
  const res = await apiAuth<Success<RoleResponseDto[]>>("/api/roles", { method: "GET", params: { page, limit } })
  const out = res as Success<RoleResponseDto[]>
  const data = unwrap(out)
  return { data: Array.isArray(data) ? data : [], meta: out.meta }
}

export async function getRole(id: string): Promise<RoleResponseDto> {
  const res = await apiAuth<Success<RoleResponseDto> | RoleResponseDto>(`/api/roles/${id}`, { method: "GET" })
  return unwrap(res)
}

export async function createRole(dto: CreateRoleDto): Promise<RoleResponseDto> {
  const res = await apiAuth<Success<RoleResponseDto> | RoleResponseDto>("/api/roles", {
    method: "POST",
    body: JSON.stringify(dto),
  })
  return unwrap(res)
}

export async function updateRole(id: string, dto: UpdateRoleDto): Promise<RoleResponseDto> {
  const res = await apiAuth<Success<RoleResponseDto> | RoleResponseDto>(`/api/roles/${id}`, {
    method: "PUT",
    body: JSON.stringify(dto),
  })
  return unwrap(res)
}

export async function deleteRole(id: string): Promise<void> {
  await apiAuth(`/api/roles/${id}`, { method: "DELETE" })
}

/** Roles that must never be handed to an external partner user. */
export const PRIVILEGED_ROLE_NAMES = ["owner", "admin"] as const

export function assignableRoles(roles: RoleResponseDto[]): RoleResponseDto[] {
  return roles.filter((r) => !(PRIVILEGED_ROLE_NAMES as readonly string[]).includes(r.name.toLowerCase()))
}
