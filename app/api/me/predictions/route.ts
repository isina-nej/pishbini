import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getUserOpenPredictions,
  updateUserPrediction,
} from "@/lib/prediction-update-service";
import {
  meUnauthorizedResponse,
  resolveUserIdFromCookies,
  resolveUserIdOrThrowInRouteHandler,
  MeUserError,
} from "@/lib/me-user";
import { predictionChoiceSchema } from "@/lib/validation";

const patchSchema = z.object({
  matchId: z.string().min(1),
  prediction: predictionChoiceSchema,
});

export async function GET() {
  try {
    const userId = await resolveUserIdFromCookies();
    if (!userId) {
      return NextResponse.json({ predictions: [] });
    }

    const predictions = await getUserOpenPredictions(userId);
    return NextResponse.json({ predictions });
  } catch {
    return NextResponse.json({ error: "خطا در دریافت پیش‌بینی‌ها" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const userId = await resolveUserIdOrThrowInRouteHandler();
    const body = await request.json();
    const parsed = patchSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "داده نامعتبر" },
        { status: 400 }
      );
    }

    const result = await updateUserPrediction(
      userId,
      parsed.data.matchId,
      parsed.data.prediction
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof MeUserError) return meUnauthorizedResponse();
    return NextResponse.json({ error: "خطا در ویرایش پیش‌بینی" }, { status: 500 });
  }
}
