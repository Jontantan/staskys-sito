"""Profili del sito: nickname, avatar e banner del server Staskys per chi usa il sito.

Viene chiamato alla fine di sync.py (ogni 10 minuti dalla GitHub Action).
Legge da Supabase (chiave pubblica "anon", sola lettura) gli ID Discord di chi ha
giocato ai minigiochi o messo voti nel catalogo, poi chiede a Discord il loro
nickname e avatar NEL SERVER e scrive members.json.
Solo chi ha usato il sito finisce nel file (niente elenco di tutti i membri).
"""
import json, os, re, time, urllib.request

# Parole offensive nei nickname: vengono coperte con *** sul sito (regola: niente insulti/slur sul sito).
_BAD = re.compile(r"\w*(?:froc|ricchion|nigg|fag+ot|finocch|ritardat|mongoloid|puttan|zoccol)\w*|\bnegr[oiae]\b|\btroi[ae]\b", re.I)

def clean_nick(n):
    return _BAD.sub("***", n or "").strip()

def _supabase(site):
    txt = open(os.path.join(site, "giochi-config.js"), encoding="utf-8").read()
    url = re.search(r'SUPABASE_URL:\s*"([^"]+)"', txt)[1]
    key = re.search(r'SUPABASE_ANON_KEY:\s*"([^"]+)"', txt)[1]
    return url, key

def _ids(site):
    url, key = _supabase(site)
    ids = set()
    for table in ("leaderboard", "media_ratings", "site_profiles"):
        try:  # Supabase dà al massimo 1000 righe per richiesta: si legge a pagine
            for off in range(0, 50000, 1000):
                req = urllib.request.Request(f"{url}/rest/v1/{table}?select=discord_id&limit=1000&offset={off}",
                                             headers={"apikey": key, "Authorization": "Bearer " + key})
                page = json.load(urllib.request.urlopen(req, timeout=20))
                for r in page:
                    d = str(r.get("discord_id") or "")
                    if d.isdigit():
                        ids.add(d)
                if len(page) < 1000:
                    break
        except Exception as e:  # tabella non ancora creata: si salta
            print(f"members: {table} non letta ({e.__class__.__name__})")
    return sorted(ids)

def _role_of(m, roles_raw, show, plain):
    """Ruolo dello staff più alto del membro (patch 4.2: compare sul profilo del sito). Nome e colore, oppure None."""
    if not roles_raw or not show:
        return None
    by_id = {r["id"]: r for r in roles_raw}
    best = None
    for rid in m.get("roles") or []:
        r = by_id.get(rid)
        if r and plain(r["name"]) in show and (best is None or r["position"] > best["position"]):
            best = r
    if not best:
        return None
    return plain(best["name"]), (f"#{best['color']:06x}" if best.get("color") else "")


def run(member, guild, site, write, roles_raw=None, show_roles=None, plain_role=None):
    plain_role = plain_role or (lambda n: n)
    out = {}
    for uid in _ids(site)[:600]:
        m = member(uid)
        if not m:
            out[uid] = {"in_server": False}
            continue
        u = m.get("user") or {}
        # PROFILO DEL SERVER prima di tutto (patch 2.3): avatar, nickname e banner impostati in Staskys,
        # poi quelli normali di Discord. Avatar animati (codice che inizia con a_) come .gif.
        def pic(path, h, size):
            return f"https://cdn.discordapp.com/{path}/{h}.{'gif' if h.startswith('a_') else 'png'}?size={size}" if h else ""
        g_av = pic(f"guilds/{guild}/users/{uid}/avatars", m.get("avatar"), 256)
        u_av = pic(f"avatars/{uid}", u.get("avatar"), 256)
        av = g_av or u_av or f"https://cdn.discordapp.com/embed/avatars/{(int(uid) >> 22) % 6}.png"
        banner = pic(f"guilds/{guild}/users/{uid}/banners", m.get("banner"), 600) or pic(f"banners/{uid}", u.get("banner"), 600)
        out[uid] = {"in_server": True, "nick": clean_nick(m.get("nick") or u.get("global_name") or u.get("username") or ""),
                    "username": u.get("username") or "", "avatar": av, "global_avatar": u_av, "banner": banner,
                    "joined": (m.get("joined_at") or "")[:10]}
        ro = _role_of(m, roles_raw, show_roles, plain_role)
        if ro:
            out[uid]["role"], out[uid]["role_color"] = ro
    from datetime import datetime, timezone
    write("members.json", json.dumps({"updated": datetime.now(timezone.utc).isoformat(), "members": out},
                                     ensure_ascii=False, indent=1))
    return len(out)
