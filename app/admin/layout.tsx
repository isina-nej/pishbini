import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/auth-admin";

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-dvh bg-[#10111f]">{children}</div>;
}
