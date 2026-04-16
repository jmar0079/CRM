import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { AppTour } from "@/components/ui/app-tour";
import { ChatWidget } from "@/components/ui/chat-widget";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar
        orgName={session.user.orgName}
        userName={session.user.name ?? "User"}
        userAvatar={session.user.image}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
      <AppTour orgId={session.user.orgId} />
      <ChatWidget />
    </div>
  );
}
