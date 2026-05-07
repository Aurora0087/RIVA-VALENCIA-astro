import { Module } from "@medusajs/framework/utils"

import NewsletterModuleService from "./service"

export const NEWSLETTER_MODULE = "rv_newsletter"

export default Module(NEWSLETTER_MODULE, {
  service: NewsletterModuleService,
})
