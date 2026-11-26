// Supabase Edge Function "catalog-search" — cerca Anime (AniList), Giochi (RAWG), Film (TMDB).
// Le chiavi RAWG_API_KEY e TMDB_API_KEY stanno SOLO nei Secrets di Supabase, mai nel sito.
// Uso: GET /functions/v1/super-endpoint?type=anime|game|movie|tv&q=testo   (q vuoto = di tendenza)
//      GET ...?type=tv&id=1234   → dettagli di una serie (numero di episodi)
// UPDATE 3 (v:3 nella risposta, così il sito sa che questa versione è attiva):
//      GET  ...?type=ping   → {v:3, caps:[…]} (il sito controlla così se questa versione è già pubblicata)
//      GET  ...?type=images&id=tm123|tv123|rg123   → copertine alternative ufficiali (TMDB / RAWG)
//      POST ...  {"action":"match","items":[{"k":"movie|tv|game|any","t":"Titolo","y":2020,"imdb":"tt…","tmdb":123}]}
//            → per ogni riga il titolo trovato su TMDB/RAWG (import Letterboxd, IMDb, Trakt, MyGameList), max 60 per volta
//      GET  ...?type=trakt&user=nome     → voti e visti di un profilo Trakt PUBBLICO (serve il secret TRAKT_CLIENT_ID)
//      GET  ...?type=mal&user=nome&list=anime|manga → lista MyAnimeList pubblica (serve il secret MAL_CLIENT_ID)
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};
type Item = { id: string; type: string; title: string; year: number | null; cover: string | null; sub: string; eps?: number | null };

async function anime(q: string): Promise<Item[]> {
  const query = `query${q ? "($q:String)" : ""}{Page(perPage:20){media(${q ? "search:$q," : ""}type:ANIME,isAdult:false,sort:${q ? "SEARCH_MATCH" : "TRENDING_DESC"}){id title{romaji english} seasonYear episodes format coverImage{extraLarge large}}}}`;
  const r = await fetch("https://graphql.anilist.co", {
    method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ query, variables: q ? { q } : {} }),
  });
  const j = await r.json();
  return (j?.data?.Page?.media || []).map((m: any) => ({
    id: "al" + m.id, type: "anime", title: m.title.english || m.title.romaji, year: m.seasonYear || null,
    cover: m.coverImage?.extraLarge || m.coverImage?.large || null, sub: [m.format, m.episodes ? m.episodes + " ep" : ""].filter(Boolean).join(" · "), eps: m.episodes || null,
  }));
}
async function games(q: string): Promise<Item[]> {
  const key = Deno.env.get("RAWG_API_KEY");
  if (!key) throw new Error("RAWG_API_KEY mancante");
  const u = new URL("https://api.rawg.io/api/games");
  u.searchParams.set("key", key); u.searchParams.set("page_size", "20");
  if (q) { u.searchParams.set("search", q); u.searchParams.set("search_precise", "true"); }
  else { u.searchParams.set("ordering", "-added"); u.searchParams.set("dates", `${new Date().getFullYear() - 1}-01-01,${new Date().getFullYear()}-12-31`); }
  const j = await (await fetch(u)).json();
  return (j?.results || []).map((g: any) => ({
    id: "rg" + g.id, type: "game", title: g.name, year: g.released ? +g.released.slice(0, 4) : null,
    cover: g.background_image ? g.background_image.replace("/media/games/", "/media/crop/600/400/games/") : null,
    sub: (g.genres || []).slice(0, 2).map((x: any) => x.name).join(" · "),
  }));
}
async function movies(q: string): Promise<Item[]> {
  const key = Deno.env.get("TMDB_API_KEY");
  if (!key) throw new Error("TMDB_API_KEY mancante");
  const u = new URL(q ? "https://api.themoviedb.org/3/search/movie" : "https://api.themoviedb.org/3/trending/movie/week");
  u.searchParams.set("api_key", key); u.searchParams.set("language", "it-IT"); u.searchParams.set("include_adult", "false");
  if (q) u.searchParams.set("query", q);
  const j = await (await fetch(u)).json();
  return (j?.results || []).slice(0, 20).map((m: any) => ({
    id: "tm" + m.id, type: "movie", title: m.title, year: m.release_date ? +m.release_date.slice(0, 4) : null,
    cover: m.poster_path ? "https://image.tmdb.org/t/p/w342" + m.poster_path : null,
    sub: m.vote_average ? "TMDB " + m.vote_average.toFixed(1) : "",
  }));
}

async function series(q: string): Promise<Item[]> {
  const key = Deno.env.get("TMDB_API_KEY");
  if (!key) throw new Error("TMDB_API_KEY mancante");
  const u = new URL(q ? "https://api.themoviedb.org/3/search/tv" : "https://api.themoviedb.org/3/trending/tv/week");
  u.searchParams.set("api_key", key); u.searchParams.set("language", "it-IT"); u.searchParams.set("include_adult", "false");
  if (q) u.searchParams.set("query", q);
  const j = await (await fetch(u)).json();
  return (j?.results || []).slice(0, 20).map((m: any) => ({
    id: "tv" + m.id, type: "tv", title: m.name, year: m.first_air_date ? +m.first_air_date.slice(0, 4) : null,
    cover: m.poster_path ? "https://image.tmdb.org/t/p/w342" + m.poster_path : null,
    sub: m.vote_average ? "TMDB " + m.vote_average.toFixed(1) : "", eps: null,
  }));
}
async function seriesDetail(id: string): Promise<Item[]> {
  const key = Deno.env.get("TMDB_API_KEY");
  if (!key) throw new Error("TMDB_API_KEY mancante");
  const n = id.replace(/^tv/, "");
  if (!/^\d{1,10}$/.test(n)) throw new Error("id non valido");
  const u = new URL("https://api.themoviedb.org/3/tv/" + n);
  u.searchParams.set("api_key", key); u.searchParams.set("language", "it-IT");
  const m = await (await fetch(u)).json();
  if (!m?.id) return [];
  return [{ id: "tv" + m.id, type: "tv", title: m.name, year: m.first_air_date ? +m.first_air_date.slice(0, 4) : null,
    cover: m.poster_path ? "https://image.tmdb.org/t/p/w342" + m.poster_path : null,
    sub: [m.number_of_seasons ? m.number_of_seasons + " stagioni" : "", m.number_of_episodes ? m.number_of_episodes + " ep" : ""].filter(Boolean).join(" · "),
    eps: m.number_of_episodes || null }];
}


// ---------- UPDATE 3 ----------
const TMDB = () => { const k = Deno.env.get("TMDB_API_KEY"); if (!k) throw new Error("TMDB_API_KEY mancante"); return k; };
const RAWG = () => { const k = Deno.env.get("RAWG_API_KEY"); if (!k) throw new Error("RAWG_API_KEY mancante"); return k; };
const poster = (p: string) => (p ? "https://image.tmdb.org/t/p/w342" + p : null);
async function tmdb(path: string, params: Record<string, string> = {}) {
  const u = new URL("https://api.themoviedb.org/3" + path);
  u.searchParams.set("api_key", TMDB()); u.searchParams.set("language", "it-IT");
  for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
  const r = await fetch(u); return r.ok ? await r.json() : null;
}
const movieItem = (m: any) => ({ id: "tm" + m.id, type: "movie", title: m.title, year: m.release_date ? +m.release_date.slice(0, 4) : null, cover: poster(m.poster_path), sub: "" });
const tvItem = (m: any) => ({ id: "tv" + m.id, type: "tv", title: m.name, year: m.first_air_date ? +m.first_air_date.slice(0, 4) : null, cover: poster(m.poster_path), sub: "", eps: m.number_of_episodes || null });
async function matchOne(x: any) {
  const k = String(x.k || "movie"), t = String(x.t || "").slice(0, 200), y = +x.y || 0;
  if (x.imdb && /^tt\d{4,10}$/.test(x.imdb)) {
    const j = await tmdb("/find/" + x.imdb, { external_source: "imdb_id" });
    if (j?.movie_results?.[0] && k !== "tv") return movieItem(j.movie_results[0]);
    if (j?.tv_results?.[0]) return tvItem(j.tv_results[0]);
    if (j?.movie_results?.[0]) return movieItem(j.movie_results[0]);
  }
  if (x.tmdb && /^\d{1,10}$/.test(String(x.tmdb))) {
    const m = await tmdb((k === "tv" ? "/tv/" : "/movie/") + x.tmdb);
    if (m?.id) return k === "tv" ? tvItem(m) : movieItem(m);
  }
  if (!t) return null;
  if (k === "game") {
    const u = new URL("https://api.rawg.io/api/games");
    u.searchParams.set("key", RAWG()); u.searchParams.set("search", t); u.searchParams.set("page_size", "5");
    const j = await (await fetch(u)).json();
    const L = j?.results || []; const g = L.find((g: any) => y && g.released && +g.released.slice(0, 4) === y) || L[0];
    return g ? { id: "rg" + g.id, type: "game", title: g.name, year: g.released ? +g.released.slice(0, 4) : null,
      cover: g.background_image ? g.background_image.replace("/media/games/", "/media/crop/600/400/games/") : null, sub: "" } : null;
  }
  if (k === "tv") {
    let j = await tmdb("/search/tv", { query: t, ...(y ? { first_air_date_year: String(y) } : {}) });
    if (!j?.results?.length && y) j = await tmdb("/search/tv", { query: t });
    return j?.results?.[0] ? tvItem(j.results[0]) : null;
  }
  let j = await tmdb("/search/movie", { query: t, ...(y ? { primary_release_year: String(y) } : {}) });
  if (!j?.results?.length && y) j = await tmdb("/search/movie", { query: t, year: String(y) });
  return j?.results?.[0] ? movieItem(j.results[0]) : null;
}
async function match(items: any[]) {
  const L = (Array.isArray(items) ? items : []).slice(0, 60), out: any[] = new Array(L.length).fill(null);
  for (let i = 0; i < L.length; i += 10)
    await Promise.all(L.slice(i, i + 10).map(async (x, j) => { try { out[i + j] = await matchOne(x); } catch (_) { out[i + j] = null; } }));
  return out;
}
async function images(id: string) {
  const m = id.match(/^(tm|tv|rg)(\d{1,10})$/); if (!m) throw new Error("id non valido");
  if (m[1] === "rg") {
    const k = RAWG(), out: string[] = [];
    const g = await (await fetch(`https://api.rawg.io/api/games/${m[2]}?key=${k}`)).json();
    if (g?.background_image) out.push(g.background_image.replace("/media/games/", "/media/crop/600/400/games/"));
    if (g?.background_image_additional) out.push(g.background_image_additional.replace("/media/screenshots/", "/media/crop/600/400/screenshots/"));
    const s = await (await fetch(`https://api.rawg.io/api/games/${m[2]}/screenshots?key=${k}&page_size=20`)).json();
    (s?.results || []).forEach((x: any) => x.image && out.push(x.image.replace("/media/screenshots/", "/media/crop/600/400/screenshots/")));
    return [...new Set(out)].slice(0, 24);
  }
  const j = await tmdb((m[1] === "tv" ? "/tv/" : "/movie/") + m[2] + "/images", { include_image_language: "it,en,ja,null", language: "" });
  return (j?.posters || []).slice(0, 30).map((p: any) => "https://image.tmdb.org/t/p/w342" + p.file_path);
}
async function trakt(user: string) {
  const id = Deno.env.get("TRAKT_CLIENT_ID"); if (!id) throw new Error("TRAKT_NON_ATTIVO");
  if (!/^[\w.-]{1,40}$/.test(user)) throw new Error("Nome utente non valido");
  const H = { "Content-Type": "application/json", "trakt-api-version": "2", "trakt-api-key": id };
  const get = async (p: string) => { const r = await fetch("https://api.trakt.tv/users/" + encodeURIComponent(user) + p, { headers: H }); if (r.status === 404 || r.status === 401) throw new Error("Profilo Trakt non trovato o privato"); return r.ok ? await r.json() : []; };
  const [rm, rs, wm, ws, wl] = await Promise.all([get("/ratings/movies"), get("/ratings/shows"), get("/watched/movies"), get("/watched/shows"), get("/watchlist")]);
  const rows = new Map<string, any>();
  const add = (k: string, o: any, patch: any) => { const tm = o?.ids?.tmdb; if (!tm) return; const key = k + tm; rows.set(key, { k, tmdb: tm, t: o.title, y: o.year, ...(rows.get(key) || {}), ...patch }); };
  (wl || []).forEach((x: any) => x.movie ? add("movie", x.movie, { status: "voglio" }) : x.show && add("tv", x.show, { status: "voglio" }));
  (wm || []).forEach((x: any) => add("movie", x.movie, { status: "visto" }));
  (ws || []).forEach((x: any) => add("tv", x.show, { status: "visto" }));
  (rm || []).forEach((x: any) => add("movie", x.movie, { rating: x.rating, status: "visto" }));
  (rs || []).forEach((x: any) => add("tv", x.show, { rating: x.rating, status: "visto" }));
  return [...rows.values()].slice(0, 3000);
}
async function mal(user: string, list: string) {
  const id = Deno.env.get("MAL_CLIENT_ID"); if (!id) throw new Error("MAL_NON_ATTIVO");
  if (!/^[\w-]{2,40}$/.test(user)) throw new Error("Nome utente non valido");
  const kind = list === "manga" ? "manga" : "anime", out: any[] = [];
  let url = `https://api.myanimelist.net/v2/users/${encodeURIComponent(user)}/${kind}list?fields=list_status,num_episodes,num_chapters&limit=1000&nsfw=false`;
  for (let i = 0; i < 10 && url; i++) {
    const r = await fetch(url, { headers: { "X-MAL-CLIENT-ID": id } });
    if (r.status === 404 || r.status === 403) throw new Error("Utente non trovato o lista privata");
    const j = await r.json(); (j?.data || []).forEach((d: any) => out.push({ mal: d.node.id, t: d.node.title, st: d.list_status?.status, score: d.list_status?.score || 0,
      progress: d.list_status?.num_episodes_watched ?? d.list_status?.num_chapters_read ?? 0, total: d.node.num_episodes || d.node.num_chapters || null }));
    url = j?.paging?.next || "";
  }
  return out;
}
const J = (o: any, status = 200, cache = true) => new Response(JSON.stringify({ v: 3, ...o }), {
  status, headers: { ...CORS, "Content-Type": "application/json", ...(cache && status === 200 ? { "Cache-Control": "public, max-age=600" } : {}) } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  const url = new URL(req.url);
  if (req.method === "POST") {
    try { const b = await req.json(); if (b?.action === "match") return J({ items: await match(b.items) }, 200, false); return J({ error: "azione sconosciuta" }, 400); }
    catch (e) { return J({ items: [], error: String((e as Error).message || e) }, 502); }
  }
  const type = url.searchParams.get("type") || "anime";
  const q = (url.searchParams.get("q") || "").trim().slice(0, 80);
  try {
    const id = url.searchParams.get("id") || "";
    if (type === "ping") return J({ items: [], caps: ["match", "images", "trakt", "mal"], trakt: !!Deno.env.get("TRAKT_CLIENT_ID"), mal: !!Deno.env.get("MAL_CLIENT_ID") }, 200, false);
    if (type === "images") return J({ items: await images(id) });
    if (type === "trakt") return J({ items: await trakt((url.searchParams.get("user") || "").trim()) }, 200, false);
    if (type === "mal") return J({ items: await mal((url.searchParams.get("user") || "").trim(), url.searchParams.get("list") || "anime") }, 200, false);
    const items = type === "tv" && id ? await seriesDetail(id) : type === "game" ? await games(q) : type === "movie" ? await movies(q) : type === "tv" ? await series(q) : await anime(q);
    return new Response(JSON.stringify({ v: 3, items }), {
      headers: { ...CORS, "Content-Type": "application/json", "Cache-Control": "public, max-age=600" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ v: 3, items: [], error: String((e as Error).message || e) }), {
      status: 502, headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});
