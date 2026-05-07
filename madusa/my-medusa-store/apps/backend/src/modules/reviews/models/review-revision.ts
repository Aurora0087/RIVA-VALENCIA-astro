import { model } from "@medusajs/framework/utils"

import { REVIEW_ACTOR_TYPES } from "../types"

const ReviewRevision = model.define("review_revision", {
  id: model.id().primaryKey(),
  review_id: model.text(),
  rating: model.number(),
  title: model.text(),
  content: model.text(),
  actor_id: model.text().nullable(),
  actor_type: model.enum([...REVIEW_ACTOR_TYPES]).default("admin"),
  reason: model.text().nullable(),
  metadata: model.json().nullable(),
})

export default ReviewRevision
