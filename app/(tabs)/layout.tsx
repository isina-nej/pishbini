import { TabsLayoutClient } from "@/components/public/TabsLayoutClient";

export default function TabsLayout({ children }: { children: React.ReactNode }) {
  return <TabsLayoutClient>{children}</TabsLayoutClient>;
}
