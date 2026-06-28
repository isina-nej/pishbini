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

export const otpSendSchema = z.object({
  phone: phoneInputSchema,
  firstName: nameSchema.optional(),
  lastName: nameSchema.optional(),
});

export const submitSchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema,
  phone: phoneInputSchema,
  code: z.string().regex(/^\d{4}$/, "کد تأیید باید ۴ رقم باشد"),
  referralCode: z.string().nullable().optional(),
  predictions: z.array(predictionItemSchema).min(1, "حداقل یک پیش‌بینی لازم است"),
});

export const authPhoneCheckSchema = z.object({
  phone: phoneInputSchema,
});

export const authRegisterSchema = z.object({
  phone: phoneInputSchema,
  code: z.string().regex(/^\d{4}$/, "کد تأیید باید ۴ رقم باشد"),
  firstName: nameSchema,
  lastName: nameSchema,
  referralCode: z.string().nullable().optional(),
});

export const authLoginSchema = z.object({
  phone: phoneInputSchema,
  code: z.string().regex(/^\d{4}$/, "کد تأیید باید ۴ رقم باشد"),
  firstName: nameSchema.optional(),
  lastName: nameSchema.optional(),
});

export const adminLoginSchema = z.object({
  password: z.string().min(1),
});

export const teamSchema = z.object({
  nameFa: z.string().min(1),
  nameEn: z.string().min(1),
  code: z.string().min(2).max(5).toUpperCase(),
  flagUrl: z.union([z.string().url(), z.string().regex(/^\//)]),
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

const optionalScoreSchema = z
  .union([z.number().int().min(0), z.null()])
  .optional();

export const matchResultSchema = z.object({
  correctPrediction: predictionChoiceSchema,
  homeScore: optionalScoreSchema,
  awayScore: optionalScoreSchema,
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

export const adminUserUpdateSchema = z.object({
  firstName: nameSchema.optional(),
  lastName: nameSchema.optional(),
  phone: phoneInputSchema.optional(),
  hidden: z.boolean().optional(),
});

export const pageAccessItemSchema = z.object({
  enabled: z.boolean(),
  hidden: z.boolean().optional().default(false),
  message: z.string().trim().max(500),
});

export const pageAccessSchema = z.object({
  predictions: pageAccessItemSchema,
  bracket: pageAccessItemSchema,
  leaderboard: pageAccessItemSchema,
  prizes: pageAccessItemSchema,
  profile: pageAccessItemSchema,
});

const campaignInfoSectionIconSchema = z.enum([
  "trophy",
  "target",
  "users",
  "star",
  "gift",
  "zap",
  "medal",
  "calendar",
]);

export const campaignInfoSectionSchema = z.object({
  id: z.string().min(1),
  icon: campaignInfoSectionIconSchema,
  title: z.string().trim().min(1).max(120),
  body: z.string().trim().min(1).max(1000),
});

export const campaignInfoSchema = z.object({
  published: z.boolean(),
  heroTitle: z.string().trim().min(1).max(120),
  heroSubtitle: z.string().trim().min(1).max(500),
  prizeTitle: z.string().trim().min(1).max(120),
  prizeDescription: z.string().trim().min(1).max(1000),
  prizeItems: z.array(z.string().trim().min(1).max(200)).min(1).max(10),
  scoringTitle: z.string().trim().min(1).max(120),
  scoringIntro: z.string().trim().min(1).max(500),
  sections: z.array(campaignInfoSectionSchema).min(1).max(12),
  footnote: z.string().trim().max(1000),
});

export const bracketSubmitSchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema,
  phone: phoneInputSchema,
  referralCode: z.string().nullable().optional(),
  picks: z.record(z.string(), z.string()).refine((p) => Object.keys(p).length > 0, {
    message: "پیش‌بینی‌ها الزامی است",
  }),
  championTeamId: z.string().min(1),
});

export const bracketSettingsSchema = z.object({
  enabled: z.boolean().optional(),
  published: z.boolean().optional(),
  submissionOpen: z.boolean().optional(),
});

export const pushSubscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

export const pushUnsubscribeSchema = z.object({
  endpoint: z.string().url(),
});

export const pushPreferencesSchema = z.object({
  enabled: z.boolean(),
});

export type SubmitInput = z.infer<typeof submitSchema>;
export type BracketSubmitInput = z.infer<typeof bracketSubmitSchema>;
export type TeamInput = z.infer<typeof teamSchema>;
export type MatchInput = z.infer<typeof matchSchema>;
