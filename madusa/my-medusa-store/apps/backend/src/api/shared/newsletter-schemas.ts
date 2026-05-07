import { z } from "zod"

export const StoreNewsletterSubscribeSchema = z.object({
  email: z.string().trim().email().max(255),
  source: z.string().trim().max(255).optional(),
  storefront_origin: z.string().trim().optional(),
  page_url: z.string().trim().optional(),
  page_title: z.string().trim().max(255).optional(),
  locale_country: z.string().trim().max(255).optional(),
  locale_language: z.string().trim().max(255).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})
