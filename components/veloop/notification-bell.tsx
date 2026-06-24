"use client";

import * as React from "react";
import { Bell, BellRing } from "lucide-react";
import { ConfirmationSheet } from "./confirmation-sheet";
import { EmptyState } from "./empty-state";
import { formatRelative } from "@/lib/utils";
import { markNotificationsReadAction } from "@/lib/actions/account";
import type { Notification } from "@/lib/types";

export function NotificationBell({ notifications }: { notifications: Notification[] }) {
  const [open, setOpen] = React.useState(false);
  const unread = notifications.filter((n) => !n.read_at).length;

  async function handleOpen() {
    setOpen(true);
    if (unread > 0) await markNotificationsReadAction();
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className="relative rounded-full p-2 text-foreground hover:bg-subtle"
        aria-label="Notifications"
      >
        {unread > 0 ? <BellRing className="size-5" /> : <Bell className="size-5" />}
        {unread > 0 && (
          <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">
            {unread}
          </span>
        )}
      </button>

      <ConfirmationSheet open={open} onOpenChange={setOpen} title="Notifications" hideActions>
        {notifications.length === 0 ? (
          <EmptyState icon={Bell} title="Aucune notification" description="Vos notifications apparaîtront ici." />
        ) : (
          <ul className="-mx-1 max-h-[60vh] space-y-1 overflow-auto">
            {notifications.map((n) => (
              <li key={n.id} className="rounded-xl border border-border p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-foreground">{n.title}</p>
                  <span className="shrink-0 text-xs text-muted-foreground">{formatRelative(n.created_at)}</span>
                </div>
                <p className="mt-0.5 text-sm text-muted-foreground">{n.body}</p>
              </li>
            ))}
          </ul>
        )}
      </ConfirmationSheet>
    </>
  );
}
