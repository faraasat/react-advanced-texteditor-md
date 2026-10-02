import { StrictMode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { App } from "./app";

const el = document.getElementById("root")!;
const tree = (
  <StrictMode>
    <App />
  </StrictMode>
);
// A server-rendered page (`/ssr`) has markup in #root: hydrate it. The plain page does not: render.
if (el.hasChildNodes()) hydrateRoot(el, tree);
else createRoot(el).render(tree);
(window as unknown as { __ready: boolean }).__ready = true;
