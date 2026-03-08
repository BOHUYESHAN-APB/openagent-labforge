import { z } from "zod"

export const I18nConfigSchema = z.object({
  /**
   * UI language for agent display names.
   * - auto: infer from OS/JS locale
   * - en: English
   * - zh-CN: Simplified Chinese
   */
  language: z.enum(["auto", "en", "zh-CN"]).optional(),
})

export type I18nConfig = z.infer<typeof I18nConfigSchema>
