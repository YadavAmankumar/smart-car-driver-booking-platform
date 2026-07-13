import type { ReactNode } from "react";
import AdminNavbar from "@/components/admin/AdminNavbar";
import AdminSidebar from "@/components/admin/AdminSidebar";

export default function AdminLayout({ children }: { children: ReactNode }) {
  // Server components can't access localStorage. Role protection is handled inside /admin/* pages.
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <AdminNavbar />
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-[260px_1fr] md:gap-8">
          <AdminSidebar />
          <section className="min-w-0">{children}</section>
        </div>
      </div>
    </div>
  );
}


