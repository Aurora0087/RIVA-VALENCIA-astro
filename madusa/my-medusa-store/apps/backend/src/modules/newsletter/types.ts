export const NEWSLETTER_SUBSCRIBER_STATUSES = [
  "subscribed",
  "unsubscribed",
] as const

export type NewsletterSubscriberStatus =
  (typeof NEWSLETTER_SUBSCRIBER_STATUSES)[number]
