import * as React from "react";

/** `useLayoutEffect` in the browser, `useEffect` on the server (which would warn about the former). */
export const useIsoLayoutEffect: typeof React.useLayoutEffect = typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;

type Subscribe = (onChange: () => void) => () => void;

/**
 * `useSyncExternalStore` where it exists (React 18+), and a small equivalent where it does not
 * (React 17, which the peer range allows). The name is built at run time so a bundler resolving
 * React 17 does not warn about a missing named export.
 */
const native = (React as unknown as Record<string, unknown>)["use" + "SyncExternalStore"] as
  | (<T>(subscribe: Subscribe, getSnapshot: () => T, getServerSnapshot?: () => T) => T)
  | undefined;

function shim<T>(subscribe: Subscribe, getSnapshot: () => T): T {
  const value = getSnapshot();
  const [, force] = React.useState({});
  useIsoLayoutEffect(() => {
    const check = () => force((s) => (Object.is(getSnapshot(), value) ? s : {}));
    const off = subscribe(check);
    check(); // it may have changed between render and subscribe
    return off;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subscribe, value]);
  return value;
}

export const useStore: <T>(subscribe: Subscribe, getSnapshot: () => T, getServerSnapshot?: () => T) => T = native ?? shim;
