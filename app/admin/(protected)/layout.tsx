import { requireAdmin } from "@/lib/admin/auth";
import { AdminNav } from "@/components/admin/AdminNav";

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { email } = await requireAdmin();

  return (
    <div className="min-h-screen bg-paper">
      <AdminNav email={email} />
      <main className="max-w-[1400px] mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
