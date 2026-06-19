import { z } from "zod";

export const nameSchema = z
  .string()
  .trim()
  .min(2, "حداقل ۲ کاراکتر")
  .max(50, "حداکثر ۵۰ کاراکتر");

export const phoneInputSchema = z.string().trim().min(1, "شماره موبایل الزامی است");

export const matchStatusSchema = z.enum([
  "SCHEDULED",
  "ACTIVE",
  "LOCKED",
  "FINISHED",
  "CANCELLED",
]);

export const predictionModeSchema = z.enum(["REGULAR_TIME_90", "FINAL_QUALIFIER"]);

export const predictionChoiceSchema = z.enum(["HOME_WIN", "DRAW", "AWAY_WIN"]);

export const predictionItemSchema = z.object({
  matchId: z.string().min(1),
  prediction: predictionChoiceSchema,
});

export const submitSchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema,
  phone: phoneInputSchema,
  referralCode: z.string().nullable().optional(),
  predictions: z.array(predictionItemSchema).min(1, "حداقل یک پیش‌بینی لازم است"),
});

export const adminLoginSchema = z.object({
  password: z.string().min(1),
});

export const teamSchema = z.object({
  nameFa: z.string().min(1),
  nameEn: z.string().min(1),
  code: z.string().min(2).max(5).toUpperCase(),
  flagUrl: z.string().url(),
  isActive: z.boolean().optional().default(true),
});

export const matchSchema = z.object({
  homeTeamId: z.string().min(1),
  awayTeamId: z.string().min(1),
  startTime: z.string().datetime(),
  status: matchStatusSchema.optional(),
  predictionMode: predictionModeSchema.optional(),
});

export const settleSchema = z.object({
  correctPrediction: predictionChoiceSchema,
});

export const pointRuleUpdateSchema = z.object({
  label: z.string().min(1).optional(),
  points: z.number().int().optional(),
  active: z.boolean().optional(),
  description: z.string().nullable().optional(),
});

export const campaignFreezeSchema = z.object({
  frozen: z.boolean(),
});

export const markWinnerSchema = z.object({
  userId: z.string().min(1),
});

export type SubmitInput = z.infer<typeof submitSchema>;
export type TeamInput = z.infer<typeof teamSchema>;
export type MatchInput = z.infer<typeof matchSchema>;
