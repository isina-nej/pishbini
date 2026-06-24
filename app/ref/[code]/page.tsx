import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { normalizeReferralCode } from "@/lib/referral";
import { isSocialCrawler } from "@/lib/social-crawlers";
import { RefLanding } from "@/components/public/RefLanding";

type Props = { params: Promise<{ code: string }> };

/** Humans are redirected in middleware; crawlers get OG metadata from layout + this page. */
export default async function RefPage({ params }: Props) {
  const { code } = await params;
  const normalized = normalizeReferralCode(code);
  const userAgent = (await headers()).get("user-agent");

  if (!isSocialCrawler(userAgent)) {
    if (normalized) {
      redirect(`/?ref=${normalized}`);
    }
    redirect("/");
  }

  return <RefLanding code={normalized ?? code} />;
}
