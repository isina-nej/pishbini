import { redirect } from "next/navigation";

export default function ProfileReferralsRedirectPage() {
  redirect("/profile?tab=referrals");
}
