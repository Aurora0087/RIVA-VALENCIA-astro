import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { StoreNewsletterSubscribeSchema } from "../../../shared/newsletter-schemas"
import { NEWSLETTER_MODULE } from "../../../../modules/newsletter"
import type NewsletterModuleService from "../../../../modules/newsletter/service"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve(NEWSLETTER_MODULE) as NewsletterModuleService
  const payload = StoreNewsletterSubscribeSchema.parse(req.body ?? {})

  const result = await service.subscribe({
    email: payload.email,
    source: payload.source ?? null,
    storefront_origin: payload.storefront_origin ?? null,
    page_url: payload.page_url ?? null,
    page_title: payload.page_title ?? null,
    locale_country: payload.locale_country ?? null,
    locale_language: payload.locale_language ?? null,
    metadata: payload.metadata,
  })

  res.status(result.already_subscribed ? 200 : 201).json({
    subscriber: result.subscriber,
    already_subscribed: result.already_subscribed,
    reactivated: result.reactivated,
    message: result.already_subscribed
      ? "This email is already subscribed to our newsletter."
      : result.reactivated
        ? "Welcome back. Your newsletter subscription has been restored."
        : "Thank you for subscribing to our newsletter.",
  })
}
