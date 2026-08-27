import { CUSTOMER_TYPES, INDUSTRIES, OWNER_ROLES, TEAM_SIZES } from "./types"
import type { OrgCreateDto } from "./types"

export type OrgErrors = Partial<Record<keyof OrgCreateDto, string>> & { form?: string }

function isValidUrl(value: string): boolean {
  try {
    const u = new URL(value)
    return u.protocol === "http:" || u.protocol === "https:"
  } catch {
    return false
  }
}

export function validateOrgStep1(data: Partial<OrgCreateDto>): OrgErrors {
  const errors: OrgErrors = {}
  if (!data.name || !data.name.trim()) errors.name = "Organization name is required."
  else if (data.name.trim().length < 2) errors.name = "Name must be at least 2 characters."
  else if (data.name.trim().length > 60) errors.name = "Name must be 60 characters or fewer."

  if (!data.industry) errors.industry = "Industry is required."
  else if (!(INDUSTRIES as readonly string[]).includes(data.industry)) errors.industry = "Select a valid industry."

  if (!data.owner_role) errors.owner_role = "Owner role is required."
  else if (!(OWNER_ROLES as readonly string[]).includes(data.owner_role)) errors.owner_role = "Select a valid role."

  return errors
}

export function validateOrgStep2(data: Partial<OrgCreateDto>): OrgErrors {
  const errors: OrgErrors = {}
  if (!data.team_size) errors.team_size = "Team size is required."
  else if (!(TEAM_SIZES as readonly string[]).includes(data.team_size)) errors.team_size = "Select a valid team size."

  if (!data.primary_customer_type) errors.primary_customer_type = "Customer type is required."
  else if (!(CUSTOMER_TYPES as readonly string[]).includes(data.primary_customer_type)) {
    errors.primary_customer_type = "Select a valid customer type."
  }

  if (data.website_url && data.website_url.trim() !== "" && !isValidUrl(data.website_url.trim())) {
    errors.website_url = "Enter a valid URL (https://…)."
  }

  if (data.description && data.description.length > 280) {
    errors.description = "Description must be 280 characters or fewer."
  }

  return errors
}

export function validateOrgAll(data: Partial<OrgCreateDto>): OrgErrors {
  return { ...validateOrgStep1(data), ...validateOrgStep2(data) }
}
