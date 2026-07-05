import { createAdminClient } from "@/lib/supabase/admin";
import { MessageReadToggle } from "@/components/admin/MessageReadToggle";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

export default async function AdminMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page } = await searchParams;
  const pageNum = Math.max(1, parseInt(page ?? "1", 10) || 1);
  const supabase = createAdminClient();

  const { data: messages, count } = await supabase
    .from("contact_messages")
    .select("id, name, email, message, is_read, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((pageNum - 1) * PAGE_SIZE, pageNum * PAGE_SIZE - 1);

  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-3xl font-medium">Messages</h1>
      </div>

      <div className="flex flex-col gap-3">
        {(messages ?? []).map((m) => (
          <div
            key={m.id}
            className={`border rounded-xl p-5 bg-surface ${
              m.is_read ? "border-hairline" : "border-ink"
            }`}
          >
            <div className="flex items-start justify-between gap-4 mb-2.5">
              <div>
                <div className="font-medium text-sm">{m.name}</div>
                <div className="text-xs text-muted">{m.email}</div>
              </div>
              <div className="flex items-center gap-3 flex-none">
                <span className="text-xs text-faint whitespace-nowrap">
                  {new Date(m.created_at).toLocaleString("en-IN")}
                </span>
                <MessageReadToggle id={m.id} isRead={m.is_read} />
              </div>
            </div>
            <p className="text-sm text-ink whitespace-pre-line m-0">{m.message}</p>
          </div>
        ))}
        {(messages ?? []).length === 0 && (
          <div className="px-4 py-10 text-center text-muted border border-hairline rounded-xl bg-surface">
            No messages yet.
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6 text-sm">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <a
              key={p}
              href={`/admin/messages?page=${p}`}
              className={`w-8 h-8 flex items-center justify-center rounded-md ${
                p === pageNum ? "bg-ink text-paper" : "text-muted hover:bg-surface-sunken"
              }`}
            >
              {p}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
