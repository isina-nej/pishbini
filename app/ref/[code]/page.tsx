import { redirect } from "next/navigation";
import { normalizeReferralCode } from "@/lib/referral";

type Props = { params: Promise<{ code: string }> };

/** Fallback if middleware did not run — primary capture is in middleware.ts */
export default async function RefPage({ params }: Props) {
  const { code } = await params;
  const normalized = normalizeReferralCode(code);
  if (normalized) {
    redirect(`/?ref=${normalized}`);
  }
  redirect("/");
}
