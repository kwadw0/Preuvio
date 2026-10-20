export type PartnerStatus = string // API: no enum, but examples: pending/submitted/approved/expired etc — allow any

export type PartnerResponse = {
  id: string
  name: string
  email: string | null
  phone: string | null
  organization_id: string
  status: PartnerStatus | null
  created_at: string
  updated_at: string
}

export type CreatePartnerDto = {
  name: string
  email?: string
  phone?: string
}

export type UpdatePartnerDto = Partial<CreatePartnerDto> & { id?: string; status?: "pending" | "active" | "inactive" | "suspended" }

export type InvitationResponse = {
  id: string
  partner_id: string
  email: string
  role_id: string
  status: string
  created_at: string
  expires_at: string
}

export type InvitePartnerUserDto = {
  email: string
  role_id: string
}

export const mockPartners: PartnerResponse[] = [
  { id: "1", name: "Avenor Logistics", email: "ops@avenor-log.com", phone: "+1 415 555 0101", organization_id: "org_1", status: "active", created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), updated_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() },
  { id: "2", name: "Northstar Supply", email: "compliance@northstar.supply", phone: "+1 415 555 0102", organization_id: "org_1", status: "submitted", created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), updated_at: new Date().toISOString() },
  { id: "3", name: "Quantum Coop", email: "legal@quantum.coop", phone: "+1 415 555 0103", organization_id: "org_1", status: "pending", created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), updated_at: new Date().toISOString() },
  { id: "4", name: "Floren & Co", email: "risk@floren.co", phone: "+1 415 555 0104", organization_id: "org_1", status: "expired", created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString() },
  { id: "5", name: "Sable Systems", email: "sec@sable.systems", phone: "+1 415 555 0105", organization_id: "org_1", status: "pending", created_at: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(), updated_at: new Date().toISOString() },
  { id: "6", name: "Veridian Ltd", email: "vendor@veridian.ltd", phone: "+1 415 555 0106", organization_id: "org_1", status: "active", created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), updated_at: new Date().toISOString() },
  { id: "7", name: "Cedar Atlas", email: "procure@cedaratlas.io", phone: "+1 415 555 0107", organization_id: "org_1", status: "pending", created_at: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(), updated_at: new Date().toISOString() },
  { id: "8", name: "Mirefield Group", email: "comply@mirefield.group", phone: "+1 415 555 0108", organization_id: "org_1", status: "submitted", created_at: new Date(Date.now() - 1000 * 60 * 60 * 10).toISOString(), updated_at: new Date().toISOString() },
  { id: "9", name: "Aurelia Partners", email: "trust@aurelia.partners", phone: "+1 415 555 0109", organization_id: "org_1", status: "active", created_at: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(), updated_at: new Date().toISOString() },
  { id: "10", name: "Halcyon Works", email: "legal@halcyon.works", phone: "+1 415 555 0110", organization_id: "org_1", status: "pending", created_at: new Date(Date.now() - 1000 * 60 * 60 * 15).toISOString(), updated_at: new Date().toISOString() },
  { id: "11", name: "Obsidian Collective", email: "ops@obsidian.co", phone: "+1 415 555 0111", organization_id: "org_1", status: "expired", created_at: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString(), updated_at: new Date().toISOString() },
  { id: "12", name: "Vela Logistics", email: "comply@vela.log", phone: "+1 415 555 0112", organization_id: "org_1", status: "submitted", created_at: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(), updated_at: new Date().toISOString() },
]

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(iso))
  } catch { return iso }
}

export function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days === 1) return "1d ago"
  if (days < 30) return `${days}d ago`
  return formatDate(iso)
}

// Enrich with mock docs for richer directory view (since API is minimal)
export function enrichPartner(p: PartnerResponse) {
  const docsMap: Record<string, string> = {
    "1": "SOC 2 • Insurance",
    "2": "NDA • ISO 27001",
    "3": "W-9 • COI",
    "4": "MSA • DPA",
    "5": "SOC 2 • DPA",
    "6": "COI • W-9",
    "7": "SOC 2 • MSA",
    "8": "DPA • ISO 27001",
    "9": "Insurance • COI",
    "10": "W-9 • NDA",
    "11": "MSA • Policy",
    "12": "SOC 2 • Policy",
  }
  const idNum = parseInt(p.id.replace(/\D/g, "") || "0", 10)
  const docs = docsMap[p.id] ?? (idNum % 2 === 0 ? "SOC 2 • COI" : "W-9 • DPA")
  const verification = p.status === "active" || (p as { status?: string }).status === "approved" ? 92 + (idNum % 7) : p.status === "submitted" ? 68 + (idNum % 12) : 34 + (idNum % 20)
  return { ...p, docs, verification, initials: getInitials(p.name) }
}

export type EnrichedPartner = ReturnType<typeof enrichPartner>
