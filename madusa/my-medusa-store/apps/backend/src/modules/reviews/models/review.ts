import { model } from "@medusajs/framework/utils"

import {
  REVIEW_SOURCES,
  REVIEW_STATUSES,
  REVIEW_VERIFICATION_STATUSES,
} from "../types"

const Review = model.define("review", {
  id: model.id().primaryKey(),
  shopify_product_id: model.text(),
  shopify_product_handle: model.text().nullable(),
  storefront_origin: model.text().nullable(),
  customer_name: model.text(),
  customer_email: model.text().nullable(),
  rating: model.number(),
  title: model.text(),
  content: model.text(),
  status: model.enum([...REVIEW_STATUSES]).default("pending"),
  verification_status: model
    .enum([...REVIEW_VERIFICATION_STATUSES])
    .default("unverified"),
  source: model.enum([...REVIEW_SOURCES]).default("storefront"),
  published_at: model.dateTime().nullable(),
  approved_at: model.dateTime().nullable(),
  approved_by: model.text().nullable(),
  rejected_at: model.dateTime().nullable(),
  rejected_by: model.text().nullable(),
  hidden_at: model.dateTime().nullable(),
  hidden_by: model.text().nullable(),
  archived_at: model.dateTime().nullable(),
  metadata: model.json().nullable(),
})

export default Review
