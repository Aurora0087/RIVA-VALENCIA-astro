import { model } from "@medusajs/framework/utils"

import {
  REVIEW_ACTOR_TYPES,
  REVIEW_MODERATION_ACTIONS,
  REVIEW_STATUSES,
} from "../types"

const ReviewModerationAction = model.define("review_moderation_action", {
  id: model.id().primaryKey(),
  review_id: model.text(),
  action: model.enum([...REVIEW_MODERATION_ACTIONS]),
  actor_id: model.text().nullable(),
  actor_type: model.enum([...REVIEW_ACTOR_TYPES]).default("system"),
  from_status: model.enum([...REVIEW_STATUSES]).nullable(),
  to_status: model.enum([...REVIEW_STATUSES]).nullable(),
  notes: model.text().nullable(),
  metadata: model.json().nullable(),
})

export default ReviewModerationAction
