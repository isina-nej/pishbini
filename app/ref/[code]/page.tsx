import { normalizeReferralCode } from "@/lib/referral";
import { RefLanding } from "@/components/public/RefLanding";

type Props = { params: Promise<{ code: string }> };

export default async function RefPage({ params }: Props) {
  const { code } = await params;
  return <RefLanding code={code} />;
}
