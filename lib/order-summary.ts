export function summarizeItems(items: { title_snapshot: string }[]): string {
  if (items.length === 0) return "Your order";
  if (items.length === 1) return items[0].title_snapshot;
  return `${items[0].title_snapshot} & ${items.length - 1} more print${items.length > 2 ? "s" : ""}`;
}
