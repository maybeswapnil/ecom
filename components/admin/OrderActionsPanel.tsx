"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  markPacked,
  markShippedManual,
  markDelivered,
  cancelPendingOrder,
  addOrderNote,
  resendEmail,
} from "@/lib/admin/order-actions";

export function OrderActionsPanel({ orderId, status }: { orderId: string; status: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [awbForm, setAwbForm] = useState({ courier: "", awb: "", trackingUrl: "" });
  const [cancelReason, setCancelReason] = useState("");
  const [note, setNote] = useState("");
  const [showShipForm, setShowShipForm] = useState(false);
  const [showCancelForm, setShowCancelForm] = useState(false);

  function run(action: () => Promise<{ ok?: boolean; error?: string }>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (result.error) setError(result.error);
      else router.refresh();
    });
  }

  return (
    <div className="border border-hairline bg-surface rounded-xl p-5 flex flex-col gap-4">
      <div className="text-sm font-semibold">Actions</div>
      {error && <div className="text-[13px] text-red-700">{error}</div>}

      <div className="flex flex-wrap gap-2">
        {status === "paid" && (
          <ActionButton disabled={isPending} onClick={() => run(() => markPacked(orderId))}>
            Mark packed
          </ActionButton>
        )}
        {(status === "paid" || status === "packed") && (
          <ActionButton disabled={isPending} onClick={() => setShowShipForm((v) => !v)}>
            Mark shipped (manual AWB)
          </ActionButton>
        )}
        {status === "shipped" && (
          <ActionButton disabled={isPending} onClick={() => run(() => markDelivered(orderId))}>
            Mark delivered
          </ActionButton>
        )}
        {status === "pending" && (
          <ActionButton disabled={isPending} onClick={() => setShowCancelForm((v) => !v)}>
            Cancel order
          </ActionButton>
        )}
      </div>

      {showShipForm && (
        <div className="flex flex-col gap-2 border-t border-hairline pt-4">
          <input
            placeholder="Courier name"
            value={awbForm.courier}
            onChange={(e) => setAwbForm((f) => ({ ...f, courier: e.target.value }))}
            className="h-10 px-3 border border-border-input bg-paper rounded-md text-sm"
          />
          <input
            placeholder="AWB number"
            value={awbForm.awb}
            onChange={(e) => setAwbForm((f) => ({ ...f, awb: e.target.value }))}
            className="h-10 px-3 border border-border-input bg-paper rounded-md text-sm"
          />
          <input
            placeholder="Tracking URL (optional)"
            value={awbForm.trackingUrl}
            onChange={(e) => setAwbForm((f) => ({ ...f, trackingUrl: e.target.value }))}
            className="h-10 px-3 border border-border-input bg-paper rounded-md text-sm"
          />
          <ActionButton
            disabled={isPending || !awbForm.courier || !awbForm.awb}
            onClick={() =>
              run(() =>
                markShippedManual(orderId, awbForm.courier, awbForm.awb, awbForm.trackingUrl || undefined)
              )
            }
          >
            Confirm shipped
          </ActionButton>
        </div>
      )}

      {showCancelForm && (
        <div className="flex flex-col gap-2 border-t border-hairline pt-4">
          <input
            placeholder="Reason"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            className="h-10 px-3 border border-border-input bg-paper rounded-md text-sm"
          />
          <ActionButton
            disabled={isPending || !cancelReason}
            onClick={() => run(() => cancelPendingOrder(orderId, cancelReason))}
          >
            Confirm cancel
          </ActionButton>
        </div>
      )}

      <div className="border-t border-hairline pt-4">
        <div className="text-sm font-semibold mb-2">Resend email</div>
        <div className="flex flex-wrap gap-2">
          <ActionButton
            disabled={isPending}
            onClick={() => run(() => resendEmail(orderId, "order_confirmation"))}
          >
            Confirmation
          </ActionButton>
          <ActionButton
            disabled={isPending}
            onClick={() => run(() => resendEmail(orderId, "shipping_confirmation"))}
          >
            Shipping
          </ActionButton>
          <ActionButton
            disabled={isPending}
            onClick={() => run(() => resendEmail(orderId, "refund_confirmation"))}
          >
            Refund
          </ActionButton>
        </div>
      </div>

      <div className="border-t border-hairline pt-4">
        <div className="text-sm font-semibold mb-2">Add note</div>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          className="w-full px-3 py-2 border border-border-input bg-paper rounded-md text-sm"
        />
        <ActionButton
          disabled={isPending || !note.trim()}
          onClick={() =>
            run(async () => {
              const result = await addOrderNote(orderId, note);
              if (!result.error) setNote("");
              return result;
            })
          }
        >
          Save note
        </ActionButton>
      </div>
    </div>
  );
}

function ActionButton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="h-9 px-3.5 bg-ink text-paper rounded-md text-xs font-medium disabled:opacity-50 hover:bg-ink-soft"
    >
      {children}
    </button>
  );
}
