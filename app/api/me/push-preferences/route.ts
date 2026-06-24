import { NextResponse } from "next/server";
import {
  meUnauthorizedResponse,
  resolveUserIdInRouteHandler,
  MeUserError,
} from "@/lib/me-user";
import { setUserPushOptIn } from "@/lib/push-service";
import { pushPreferencesSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  try {
    const userId = await resolveUserIdInRouteHandler();
    if (!userId) {
      return NextResponse.json({ error: "ورود لازم است" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = pushPreferencesSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "درخواست نامعتبر است" }, { status: 400 });
    }

    await setUserPushOptIn(userId, parsed.data.enabled);

    return NextResponse.json({ success: true, pushOptIn: parsed.data.enabled });
  } catch (err) {
    if (err instanceof MeUserError) return meUnauthorizedResponse();
    console.error("[me/push-preferences]", err);
    return NextResponse.json({ error: "خطا در ذخیره تنظیمات" }, { status: 500 });
  }
}
