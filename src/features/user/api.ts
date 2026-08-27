import { apiAuth } from "../../lib/api"
import type { UserProfileDto } from "./types"

const USER_ME_PATH = "/api/users/me"

type UserMeResponse = { data: UserProfileDto; success: boolean; message?: string } | UserProfileDto

export function fetchMyProfile() {
  return apiAuth<UserMeResponse>(USER_ME_PATH, { method: "GET" })
}

export function extractUser(res: UserMeResponse): UserProfileDto | null {
  if (!res) return null
  if (typeof res === "object" && "data" in res && res.data && typeof res.data === "object" && "email" in res.data) {
    return (res as { data: UserProfileDto }).data
  }
  if (typeof res === "object" && "email" in res) return res as UserProfileDto
  return null
}
