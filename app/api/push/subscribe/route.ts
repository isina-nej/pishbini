import { NextResponse } from "next/server";
import {
  meUnauthorizedResponse,
  resolveUserIdInRouteHandler,
  MeUserError,
} from "@/lib/me-user";
import { removePushSubscription, savePushSubscription } from "@/lib/push-service";
import { pushSubscribeSchema, pushUnsubscribeSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const userId = await resolveUserIdInRouteHandler();
    if (!userId) {
      return NextResponse.json({ error: "ورود لازم است" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = pushSubscribeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "اشتراک نامعتبر است" }, { status: 400 });
    }

    const userAgent = request.headers.get("user-agent") ?? undefined;

    await savePushSubscription(userId, {
      endpoint: parsed.data.endpoint,
      p256dh: parsed.data.keys.p256dh,
      auth: parsed.data.keys.auth,
      userAgent,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof MeUserError) return meUnauthorizedResponse();
    console.error("[push/subscribe]", err);
    return NextResponse.json({ error: "خطا در ثبت اشتراک" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const userId = await resolveUserIdInRouteHandler();
    if (!userId) {
      return NextResponse.json({ error: "ورود لازم است" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = pushUnsubscribeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "درخواست نامعتبر است" }, { status: 400 });
    }

    await removePushSubscription(parsed.data.endpoint);
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof MeUserError) return meUnauthorizedResponse();
    console.error("[push/unsubscribe]", err);
    return NextResponse.json({ error: "خطا در حذف اشتراک" }, { status: 500 });
  }
}
