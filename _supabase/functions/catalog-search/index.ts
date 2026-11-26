// Supabase Edge Function "catalog-search" — cerca Anime (AniList), Giochi (RAWG), Film (TMDB).
// Le chiavi RAWG_API_KEY e TMDB_API_KEY stanno SOLO nei Secrets di Supabase, mai nel sito.
// Uso: GET /functions/v1/super-endpoint?type=anime|game|movie|tv&q=testo   (q vuoto = di tendenza)
//      GET ...?type=tv&id=1234   → dettagli di una serie (numero di episodi)
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  const url = new URL(req.url);
  const type = url.searchParams.get("type") || "anime";
  const q = (url.searchParams.get("q") || "").trim().slice(0, 80);
  try {
    const id = url.searchParams.get("id") || "";
    const items = type === "tv" && id ? await seriesDetail(id) : type === "game" ? await games(q) : type === "movie" ? await movies(q) : type === "tv" ? await series(q) : await anime(q);
    return new Response(JSON.stringify({ items }), {
      headers: { ...CORS, "Content-Type": "application/json", "Cache-Control": "public, max-age=600" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ items: [], error: String((e as Error).message || e) }), {
      status: 502, headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});
