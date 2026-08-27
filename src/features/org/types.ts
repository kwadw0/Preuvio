export const INDUSTRIES = [
  "fashion_and_apparel",
  "food_and_beverage",
  "beauty_and_cosmetics",
  "health_and_wellness",
  "retail_and_ecommerce",
  "professional_services",
  "education_and_tutoring",
  "real_estate",
  "logistics_and_delivery",
  "events_and_entertainment",
  "tech_and_software",
  "finance_and_fintech",
  "agriculture",
  "travel_and_tourism",
  "manufacturing",
  "cybersecurity",
  "cloud_services",
  "legal",
  "consulting",
  "other",
] as const

export const TEAM_SIZES = ["1", "2-5", "6-10", "11-50", "51+"] as const

export const CUSTOMER_TYPES = ["b2b", "b2c", "both"] as const

export const OWNER_ROLES = [
  "business_owner",
  "sales_manager",
  "customer_support_manager",
  "marketing_manager",
  "operations_manager",
  "freelancer_or_consultant",
  "developer_or_technical",
  "other",
] as const

export type Industry = typeof INDUSTRIES[number]
export type TeamSize = typeof TEAM_SIZES[number]
export type CustomerType = typeof CUSTOMER_TYPES[number]
export type OwnerRole = typeof OWNER_ROLES[number]

export type OrgCreateDto = {
  name: string
  description?: string
  website_url?: string
  industry: Industry
  team_size: TeamSize
  primary_customer_type: CustomerType
  owner_role: OwnerRole
}

export type OrganizationResponseDto = {
  id: string
  name: string
  description: string | null
  website_url: string | null
  industry: Industry
  team_size: TeamSize
  primary_customer_type: CustomerType
  owner_role: OwnerRole
  is_active: boolean
  created_at: string
  updated_at: string
}

export function humanizeEnum(value: string): string {
  return value
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")
    .replace(" And ", " & ")
}
