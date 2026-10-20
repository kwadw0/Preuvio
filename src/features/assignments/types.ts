export type AssignmentStatus = "assigned" | "submitted" | "overdue" | "revoked"

export type AssignmentResponse = {
  id: string
  form_id: string
  partner_id: string
  form_title: string | null
  form_status: string | null
  partner_name: string | null
  partner_email: string | null
  status: AssignmentStatus | string
  due_at: string | null
  submitted_at: string | null
  submissions_count: number
  created_at: string
  updated_at: string
}

export type AssignFormDto = {
  partner_ids: string[]
  due_at?: string
}

export type SkippedAssignment = {
  partner_id: string
  reason: string
}

export type AssignResultResponse = {
  assigned: AssignmentResponse[]
  skipped: SkippedAssignment[]
}

export type AssignmentFilters = {
  status?: AssignmentStatus | string
  page?: number
  limit?: number
}

export type PaginationMeta = { page: number; limit: number; total: number; total_pages: number }
export type Paginated<T> = { data: T[]; meta: PaginationMeta }
