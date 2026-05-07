import { Module } from "@medusajs/framework/utils"

import LiveChatModuleService from "./service"

export const LIVE_CHAT_MODULE = "rv_live_chat"

export default Module(LIVE_CHAT_MODULE, {
  service: LiveChatModuleService,
})
