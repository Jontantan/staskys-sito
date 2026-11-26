// Server di prova LOCALE: serve il sito e imita la Edge Function "catalog-search".
// Le chiavi si leggono dalle variabili d'ambiente RAWG_API_KEY / TMDB_API_KEY (mai scritte nei file).
// Uso: node _supabase/dev-server.mjs  →  http://localhost:8790
import http from "node:http"; import fs from "node:fs"; import path from "node:path";
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const T = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".png": "image/png", ".jpg": "image/jpeg", ".gif": "image/gif", ".ico": "image/x-icon", ".svg": "image/svg+xml" };
globalThis.Deno = { env: { get: (k) => process.env[k] }, serve: (h) => (globalThis.__handler = h) };
const src = fs.readFileSync(path.join(ROOT, "_supabase/functions/catalog-search/index.ts"), "utf8")
  .replace(/type Item = [^\n]*\n/, "").replace(/: Promise<Item\[\]>/g, "").replace(/\((\w+): string\)/g, "($1)")
  .replace(/: any/g, "").replace(/ as Error/g, "").replace(/\(e as Error\)/g, "e");
await import("data:text/javascript;base64," + Buffer.from(src).toString("base64"));
http.createServer(async (req, res) => {
  const u = new URL(req.url, "http://localhost");
  if (u.pathname === "/api/catalog-search") {
    const r = await globalThis.__handler(new Request("http://x/" + u.search));
    res.writeHead(r.status, Object.fromEntries(r.headers)); return res.end(await r.text());
  }
  let p = path.join(ROOT, decodeURIComponent(u.pathname === "/" ? "/index.html" : u.pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end("404"); }
  res.writeHead(200, { "Content-Type": T[path.extname(p)] || "application/octet-stream" }); fs.createReadStream(p).pipe(res);
}).listen(+(process.env.PORT || 8790), () => console.log("http://localhost:" + (process.env.PORT || 8790)));
