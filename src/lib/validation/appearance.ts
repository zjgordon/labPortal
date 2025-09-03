import { z } from 'zod'

export const appearanceUpdate = z.object({
  instanceName: z.string().trim().min(1).max(60),
  headerText: z.string().trim().max(140).optional().nullable(),
  theme: z.enum(["system", "light", "dark"]).optional(), // placeholder, keep but not used
})

export type AppearanceUpdate = z.infer<typeof appearanceUpdate>
