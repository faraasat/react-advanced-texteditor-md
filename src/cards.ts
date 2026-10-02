import type { Plugin } from "advanced-texteditor-md";
import type { ChipCardsProp } from "./types";

/**
 * The editor's chip cards. The core's `chips` subpath is fetched when the editor is created, so a
 * page without `cards` never downloads it. Hooks are forwarded to the core's plugin once it has
 * arrived; `getCard` is read through `get()` every time, so a new function identity never
 * recreates the editor.
 */
export function cardsPlugin(get: () => ChipCardsProp | undefined): Plugin {
  let inner: Plugin | undefined;
  let stop: unknown;
  let dead = false;
  return {
    name: "react-chip-cards",
    setup(ed) {
      dead = false;
      import("advanced-texteditor-md/chips").then((m) => {
        const c = get();
        if (dead || !c) return;
        inner = m.createChipCardsPlugin({ ...c, getCard: (k, x) => get()?.getCard(k, x) });
        stop = inner.setup?.(ed);
      });
      return () => {
        dead = true;
        (stop as (() => void) | undefined)?.();
        stop = inner = undefined;
      };
    },
    keydown: (e, ed) => !!inner?.keydown?.(e, ed),
    postRender: (r, c) => inner?.postRender?.(r, c),
  };
}
