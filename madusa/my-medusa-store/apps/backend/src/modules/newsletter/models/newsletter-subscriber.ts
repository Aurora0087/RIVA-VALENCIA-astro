import { model } from "@medusajs/framework/utils"

import { NEWSLETTER_SUBSCRIBER_STATUSES } from "../types"

const NewsletterSubscriber = model.define("newsletter_subscriber", {
  id: model.id().primaryKey(),
  email: model.text(),
  status: model
    .enum([...NEWSLETTER_SUBSCRIBER_STATUSES])
    .default("subscribed"),
  source: model.text().nullable(),
  storefront_origin: model.text().nullable(),
  page_url: model.text().nullable(),
  page_title: model.text().nullable(),
  locale_country: model.text().nullable(),
  locale_language: model.text().nullable(),
  first_subscribed_at: model.dateTime(),
  last_subscribed_at: model.dateTime(),
  unsubscribed_at: model.dateTime().nullable(),
  metadata: model.json().nullable(),
})

export default NewsletterSubscriber
