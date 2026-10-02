// A tiny static server plus the three endpoints the example needs. No dependencies.
//   GET  /            the client-rendered page
//   GET  /ssr         the same App rendered on the server, then hydrated by client.js
//   PUT  /upload/:n   stores the body in memory, answers 201 with Location: /uploads/:n
//   GET  /uploads/:n  the stored bytes
import { createServer } from "node:http";
import { readFileSync, existsSync } from "node:fs";
import { dirname, extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const here = dirname(fileURLToPath(import.meta.url));
const dist = join(here, "dist");
const require = createRequire(join(here, "..", "package.json"));
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".png": "image/png" };
const uploads = new Map();
// A 1x1 transparent PNG, so an uploaded "image" decodes.
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", "base64");

createServer((req, res) => {
  const url = new URL(req.url ?? "/", "http://localhost");
  const path = decodeURIComponent(url.pathname);
  if (path.startsWith("/upload/") && (req.method === "PUT" || req.method === "POST")) {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      const name = path.slice("/upload/".length);
      uploads.set(name, Buffer.concat(chunks));
      res.writeHead(201, { Location: "/uploads/" + encodeURIComponent(name) });
      res.end();
    });
    return;
  }
  if (path.startsWith("/uploads/")) {
    res.writeHead(200, { "Content-Type": "image/png" });
    res.end(uploads.get(path.slice("/uploads/".length)) ?? PNG);
    return;
  }
  if (path === "/ssr") {
    const { render } = require(join(dist, "server.cjs"));
    const page = readFileSync(join(dist, "index.html"), "utf8").replace('<div id="root"></div>', `<div id="root">${render()}</div>`);
    res.writeHead(200, { "Content-Type": TYPES[".html"] });
    res.end(page);
    return;
  }
  const file = path === "/" ? "index.html" : normalize(path).replace(/^([/\\])+/, "");
  const full = join(dist, file);
  if (!full.startsWith(dist) || !existsSync(full)) {
    res.writeHead(404);
    res.end("not found");
    return;
  }
  res.writeHead(200, { "Content-Type": TYPES[extname(full)] ?? "application/octet-stream" });
  res.end(readFileSync(full));
}).listen(4327, "127.0.0.1", () => console.log("example on http://127.0.0.1:4327"));
