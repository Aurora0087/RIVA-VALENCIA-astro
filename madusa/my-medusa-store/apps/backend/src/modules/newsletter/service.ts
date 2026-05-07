import { MedusaService } from "@medusajs/framework/utils"

import NewsletterSubscriber from "./models/newsletter-subscriber"

type Metadata = Record<string, unknown> | null | undefined

type SubscribeInput = {
  email: string
  source?: string | null
  storefront_origin?: string | null
  page_url?: string | null
  page_title?: string | null
  locale_country?: string | null
  locale_language?: string | null
  metadata?: Metadata
}

class NewsletterModuleService extends MedusaService({
  NewsletterSubscriber,
}) {
  private unwrapOne<T>(value: T | T[]): T {
    return Array.isArray(value) ? value[0] : value
  }

  private normalizeEmail(email: string) {
    return email.trim().toLowerCase()
  }

  async subscribe(input: SubscribeInput) {
    const email = this.normalizeEmail(input.email)
    const now = new Date()

    const existing = await this.listNewsletterSubscribers(
      { email } as any,
      {
        order: { created_at: "DESC" },
        take: 1,
      } as any
    )

    if (existing.length > 0) {
      const current = existing[0]
      const updated = this.unwrapOne(
        await this.updateNewsletterSubscribers({
          id: current.id,
          email,
          status: "subscribed",
          source: input.source ?? current.source ?? "storefront",
          storefront_origin:
            input.storefront_origin ?? current.storefront_origin ?? null,
          page_url: input.page_url ?? current.page_url ?? null,
          page_title: input.page_title ?? current.page_title ?? null,
          locale_country:
            input.locale_country ?? current.locale_country ?? null,
          locale_language:
            input.locale_language ?? current.locale_language ?? null,
          last_subscribed_at: now,
          unsubscribed_at: null,
          metadata: input.metadata ?? current.metadata ?? null,
        } as any)
      )

      return {
        subscriber: updated,
        already_subscribed: current.status === "subscribed",
        reactivated: current.status !== "subscribed",
      }
    }

    const subscriber = this.unwrapOne(
      await this.createNewsletterSubscribers({
        email,
        status: "subscribed",
        source: input.source ?? "storefront",
        storefront_origin: input.storefront_origin ?? null,
        page_url: input.page_url ?? null,
        page_title: input.page_title ?? null,
        locale_country: input.locale_country ?? null,
        locale_language: input.locale_language ?? null,
        first_subscribed_at: now,
        last_subscribed_at: now,
        unsubscribed_at: null,
        metadata: input.metadata ?? null,
      } as any)
    )

    return {
      subscriber,
      already_subscribed: false,
      reactivated: false,
    }
  }
}

export default NewsletterModuleService
