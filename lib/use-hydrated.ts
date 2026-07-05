import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** True only after client hydration — avoids SSR/client mismatch for persisted client state. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );
}
