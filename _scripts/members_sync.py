"""Profili del sito: nickname e avatar del server Staskys per chi usa il sito.

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
    for table in ("leaderboard", "media_ratings"):
        try:
            req = urllib.request.Request(f"{url}/rest/v1/{table}?select=discord_id&limit=5000",
                                         headers={"apikey": key, "Authorization": "Bearer " + key})
            for r in json.load(urllib.request.urlopen(req, timeout=20)):
                d = str(r.get("discord_id") or "")
                if d.isdigit():
                    ids.add(d)
        except Exception as e:  # tabella non ancora creata: si salta
            print(f"members: {table} non letta ({e.__class__.__name__})")
    return sorted(ids)

def run(member, guild, site, write):
    out = {}
    for uid in _ids(site)[:600]:
        m = member(uid)
        if not m:
            out[uid] = {"in_server": False}
            continue
        u = m.get("user") or {}
        if m.get("avatar"):
            av = f"https://cdn.discordapp.com/guilds/{guild}/users/{uid}/avatars/{m['avatar']}.png?size=256"
        elif u.get("avatar"):
            av = f"https://cdn.discordapp.com/avatars/{uid}/{u['avatar']}.png?size=256"
        else:
            av = f"https://cdn.discordapp.com/embed/avatars/{(int(uid) >> 22) % 6}.png"
        out[uid] = {"in_server": True, "nick": clean_nick(m.get("nick") or u.get("global_name") or u.get("username") or ""),
                    "username": u.get("username") or "", "avatar": av, "joined": (m.get("joined_at") or "")[:10]}
    from datetime import datetime, timezone
    write("members.json", json.dumps({"updated": datetime.now(timezone.utc).isoformat(), "members": out},
                                     ensure_ascii=False, indent=1))
    return len(out)
