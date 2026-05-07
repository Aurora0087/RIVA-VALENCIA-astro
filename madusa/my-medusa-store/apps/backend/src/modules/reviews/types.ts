export const REVIEW_STATUSES = [
  "draft",
  "pending",
  "approved",
  "rejected",
  "hidden",
  "archived",
] as const

export const REVIEW_VERIFICATION_STATUSES = [
  "unverified",
  "verified_purchase",
  "manually_verified",
] as const

export const REVIEW_SOURCES = ["storefront", "admin", "import"] as const

export const REVIEW_ACTOR_TYPES = ["customer", "admin", "system"] as const

export const REVIEW_MODERATION_ACTIONS = [
  "submitted",
  "approved",
  "rejected",
  "hidden",
  "restored",
  "archived",
  "edited",
] as const

export const REVIEW_ADMIN_MODERATION_ACTIONS = [
  "approved",
  "rejected",
  "hidden",
  "restored",
  "archived",
] as const

export type ReviewStatus = (typeof REVIEW_STATUSES)[number]
export type ReviewVerificationStatus =
  (typeof REVIEW_VERIFICATION_STATUSES)[number]
export type ReviewSource = (typeof REVIEW_SOURCES)[number]
export type ReviewActorType = (typeof REVIEW_ACTOR_TYPES)[number]
export type ReviewModerationAction =
  (typeof REVIEW_MODERATION_ACTIONS)[number]
export type ReviewAdminModerationAction =
  (typeof REVIEW_ADMIN_MODERATION_ACTIONS)[number]
