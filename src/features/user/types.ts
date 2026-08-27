export type UserProfileDto = {
  id: string
  email: string
  first_name: string
  last_name: string
  phone: string
  avatar_url: string | null
  organization_id: string | null
  role_id: string | null
  created_at: string
  updated_at: string
  access_token?: string
}

export const MOCK_USER: UserProfileDto = {
  id: "usr_placeholder",
  email: "ada@preuvio.com",
  first_name: "Ada",
  last_name: "Lovelace",
  phone: "+1 555 014 2830",
  avatar_url: null,
  organization_id: null,
  role_id: null,
  created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 90).toISOString(),
  updated_at: new Date().toISOString(),
}

export function getInitials(first: string, last: string): string {
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase()
}

export function formatMemberSince(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(new Date(iso))
  } catch {
    return iso
  }
}
