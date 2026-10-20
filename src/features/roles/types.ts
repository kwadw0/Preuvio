export type RoleResponseDto = {
  id: string
  name: string
  description: string
  created_at: string
  updated_at: string
}

export type CreateRoleDto = {
  name: string
  description?: string
}

export type UpdateRoleDto = Partial<CreateRoleDto>
