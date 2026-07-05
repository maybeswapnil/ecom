"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/products", label: "Products" },
];

export function AdminNav({ email }: { email: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 bg-paper border-b border-hairline">
      <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between gap-5">
        <div className="flex items-center gap-8">
          <span className="font-display text-xl font-medium">Print Company · Admin</span>
          <nav className="flex items-center gap-1">
            {LINKS.map((link) => {
              const active =
                link.href === "/admin" ? pathname === "/admin" : pathname?.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    active ? "bg-ink text-paper" : "text-muted hover:text-ink"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-faint">{email}</span>
          <button
            onClick={handleLogout}
            className="text-xs text-muted hover:text-ink bg-transparent border-none cursor-pointer"
          >
            Log out
          </button>
        </div>
      </div>
    </header>
  );
}
