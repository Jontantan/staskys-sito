#!/usr/bin/env python3
"""Staskys sync — genera i dati del sito leggendo Discord (solo richieste GET, sola lettura).

Scrive nella cartella del sito:
  news.json    annunci del canale #updates (solo staff / webhook ufficiali)
  staff.json   high staff dalla lista ufficiale #staffs (nomi e avatar attuali)
  roles.json   ruoli pubblici con colori, come ottenerli e numero di membri (aggregato)
  events.json  eventi programmati del server (Discord scheduled events)
  guild.json   info generali: boost, livello, Member of the Week, ora dell'ultimo sync
  data.js      copia di tutto (+ config.json) per aprire il sito anche con doppio clic

Uso:  STASKYS_BOT_TOKEN=... python3 sync.py [cartella_sito | percorso/news.json]
Cron consigliato: ogni 5 minuti.  Il token non viene mai scritto nei file.
"""
import os, sys, json, re, time, urllib.request, urllib.error
from datetime import datetime, timezone

GUILD = "1244253666295283713"
NEWS_CHANNEL = "1245379873548144661"     # ︲📣┋updates
STAFFS_CHANNEL = "1364072469564100678"   # ︲⚡┋staffs
HIGH_ROLES = ["Founder", "Co-owner", "Manager", "Admin", "Supervisor"]
API = "https://discord.com/api/v10"

TOKEN = os.environ.get("STASKYS_BOT_TOKEN") or sys.exit("Imposta la variabile STASKYS_BOT_TOKEN")
arg = sys.argv[1] if len(sys.argv) > 1 else os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # radice del repo
SITE = os.path.dirname(os.path.abspath(arg)) if arg.endswith(".json") else os.path.abspath(arg)


class Forbidden(Exception):
    pass


def get(path):
    for _ in range(6):
        req = urllib.request.Request(API + path, headers={"Authorization": "Bot " + TOKEN, "User-Agent": "StaskysSync (sito, 2.0)"})
        try:
            return json.load(urllib.request.urlopen(req, timeout=25))
        except urllib.error.HTTPError as e:
            if e.code == 429:
                time.sleep(float(json.load(e).get("retry_after", 2)) + 0.5)
                continue
            if e.code in (403, 404):
                raise Forbidden(f"{e.code} su {path.split('?')[0]}")
            raise SystemExit(f"Errore API {e.code} su {path.split('?')[0]}")
    raise SystemExit("Troppi rate limit")


def tidy(n):
    n = re.split(r"\s[|#]|[|]", n or "")[0].strip()
    return n if re.search(r"[^\W_]", n) else ""


def plain_role(name):
    return re.sub(r"^[^\w]*[｜|┃]\s*|^[｜|]\s*", "", name).strip()


guild = get(f"/guilds/{GUILD}?with_counts=true")
roles_raw = get(f"/guilds/{GUILD}/roles")
roles = {r["id"]: r["name"] for r in roles_raw}
channels = {c["id"]: c["name"] for c in get(f"/guilds/{GUILD}/channels")}

# ---------- membri (serve "Server Members Intent"; se manca, si salta) ----------
members, members_ok = {}, True
try:
    after = "0"
    while True:
        page = get(f"/guilds/{GUILD}/members?limit=1000&after={after}")
        for m in page:
            members[m["user"]["id"]] = m
        if len(page) < 1000:
            break
        after = page[-1]["user"]["id"]
        time.sleep(0.5)
except Forbidden:
    members_ok = False


def member(uid):
    if uid not in members:
        try:
            members[uid] = get(f"/guilds/{GUILD}/members/{uid}")
        except Forbidden:
            members[uid] = None
        time.sleep(0.3)
    return members[uid]


def display_name(uid, user=None):
    m = member(uid) or {}
    u = m.get("user") or user or {}
    return tidy(u.get("global_name")) or tidy(m.get("nick")) or "Staff Staskys"


def avatar_url(uid):
    m = member(uid) or {}
    u = m.get("user") or {}
    if m.get("avatar"):
        return f"https://cdn.discordapp.com/guilds/{GUILD}/users/{uid}/avatars/{m['avatar']}.png?size=256"
    if u.get("avatar"):
        return f"https://cdn.discordapp.com/avatars/{uid}/{u['avatar']}.png?size=256"
    return f"https://cdn.discordapp.com/embed/avatars/{(int(uid) >> 22) % 6}.png"


# ---------- staff ----------
staff, staff_ids, seen = [], set(), set()
for sm in get(f"/channels/{STAFFS_CHANNEL}/messages?limit=10")[::-1]:
    role = None
    for line in sm["content"].split("\n"):
        r = re.search(r"<@&(\d+)>", line)
        if r:
            role = plain_role(roles.get(r[1], ""))
        for uid in re.findall(r"<@!?(\d+)>", line):
            staff_ids.add(uid)
            if role in HIGH_ROLES and uid not in seen and member(uid):
                seen.add(uid)
                staff.append({"role": role, "name": display_name(uid), "avatar": avatar_url(uid)})
staff.sort(key=lambda x: HIGH_ROLES.index(x["role"]))

# ---------- news ----------
def clean(t):
    t = re.sub(r"\|\|\s*(@everyone|@here|<@&\d+>|Ping:.*?)\s*\|\|", "", t)
    t = re.sub(r"\|\|\s*\|\|", "", t)
    t = re.sub(r"@(everyone|here)", "", t)
    t = re.sub(r"<@!?\d+>", "", t)
    t = re.sub(r"<@&(\d+)>", "", t)
    t = re.sub(r"<#(\d+)>", lambda m: "#" + re.sub(r"^[^\w]*", "", channels.get(m[1], "canale")), t)
    t = re.sub(r"<id:customize>", "Canali & Ruoli", t)
    t = re.sub(r"<a?:\w+:\d+>", "", t)
    t = re.sub(r"https?://(discord\.com/channels|tenor\.com)\S*", "", t)
    t = re.sub(r"(?m)^\s*(-#\s*)?_ _\s*$", "", t)
    return re.sub(r"\n{3,}", "\n\n", t).strip()


items = []
for m in get(f"/channels/{NEWS_CHANNEL}/messages?limit=100"):
    if not (m.get("webhook_id") or m["author"]["id"] in staff_ids):
        continue  # solo staff / webhook ufficiali, mai membri comuni
    body = m["content"] + "".join(e.get("description") or "" for e in m.get("embeds", []))
    if not (len(body) >= 120 or "@everyone" in m["content"] or m.get("attachments")):
        continue
    text = m["content"]
    for e in m.get("embeds", []):
        text += "\n" + (e.get("title") or "") + "\n" + (e.get("description") or "")
    text = clean(text)
    if not text and not m.get("attachments"):
        continue
    lines = [l for l in text.split("\n") if re.sub(r"[#*_~`|>\s-]", "", l)]
    title = re.sub(r"^#+\s*|[*_~`|>]", "", lines[0]).strip() if lines else "Annuncio"
    imgs = [a["url"] for a in m.get("attachments", []) if (a.get("content_type") or "").startswith("image")]
    imgs += [e["image"]["url"] for e in m.get("embeds", []) if e.get("image")]
    items.append({"id": m["id"], "date": m["timestamp"], "title": title[:140], "body": "\n".join(lines[1:])[:1200],
                  "author": "Staskys" if m.get("webhook_id") else display_name(m["author"]["id"], m["author"]),
                  "images": imgs, "url": f"https://discord.com/channels/{GUILD}/{NEWS_CHANNEL}/{m['id']}"})
    if len(items) >= 20:
        break

# ---------- ruoli ----------
self_roles = set()
try:
    for p in get(f"/guilds/{GUILD}/onboarding").get("prompts", []):
        for op in p["options"]:
            self_roles |= set(op["role_ids"])
except Forbidden:
    pass

role_count = {}
if members_ok:
    for m in members.values():
        for rid in (m or {}).get("roles", []):
            role_count[rid] = role_count.get(rid, 0) + 1

SUP = str.maketrans("⁰¹²³⁴⁵⁶⁷⁸⁹", "0123456789")
STAFF_NAMES = {"Founder", "Co-owner", "Manager", "Trusted", "Admin", "Supervisor", "Mod", "Helper", "Trial Staff", "Developer",
               "Partner Manager", "Giveaway Manager", "Events Manager", "Social Manager"}
SPECIAL = {"Server Booster": "Boosta il server una volta.", "Double Booster": "Boosta il server due volte.",
           "Member of the Week": "Riconoscimento settimanale assegnato dallo staff.",
           "Member": "Si ottiene completando la verifica."}
groups = {"staff": [], "livelli": [], "supporter": [], "colori": [], "giochi": [], "ping": [], "tornei": []}
levels = []
for r in sorted(roles_raw, key=lambda r: -r["position"]):
    name, rid = r["name"], r["id"]
    if r.get("managed") and "premium_subscriber" not in (r.get("tags") or {}):
        continue
    if name == "@everyone" or not re.search(r"\w", name):
        continue
    clean_name = plain_role(name)
    lv = re.search(r"lvl\s*([⁰¹²³⁴⁵⁶⁷⁸⁹0-9]+)", name)
    entry = {"name": clean_name, "color": f"#{r['color']:06x}" if r["color"] else None, "members": role_count.get(rid)}
    if lv:
        n = int(lv[1].translate(SUP))
        levels.append({"level": n, "name": f"Livello {n}", "members": role_count.get(rid)})
    elif clean_name in STAFF_NAMES:
        entry["how"] = "Candidature staff o promozione interna."
        groups["staff"].append(entry)
    elif clean_name in SPECIAL:
        entry["how"] = SPECIAL[clean_name]
        groups["supporter"].append(entry)
    elif rid in self_roles:
        entry["how"] = "Scegli da Canali & Ruoli."
        if r["color"] and not re.search(r"[｜|┃]", name):
            groups["colori"].append(entry)
        elif re.search(r"Minecraft|Valorant|Rainbow|Overwatch|Brawl|Roblox|Fortnite", name):
            groups["giochi"].append(entry)
        elif re.search(r"Boy|Girl|Binary|enne", name):
            pass  # ruoli personali (età/genere): non mostrati sul sito
        else:
            groups["ping"].append(entry)
    elif re.search(r"TORNEO|VINCITORI|MVP", name):
        entry["how"] = "Partecipando ai tornei della community."
        groups["tornei"].append(entry)
levels.sort(key=lambda x: x["level"])

# ---------- eventi programmati ----------
events = []
try:
    for e in get(f"/guilds/{GUILD}/scheduled-events?with_user_count=true"):
        if e.get("privacy_level") != 2 or e.get("status") not in (1, 2):
            continue
        img = f"https://cdn.discordapp.com/guild-events/{e['id']}/{e['image']}.png?size=600" if e.get("image") else None
        loc = (e.get("entity_metadata") or {}).get("location") or channels.get(e.get("channel_id") or "", "")
        events.append({"id": e["id"], "name": e["name"], "description": clean(e.get("description") or "")[:600],
                       "start": e["scheduled_start_time"], "end": e.get("scheduled_end_time"), "live": e["status"] == 2,
                       "location": re.sub(r"^[^\w]*", "", loc), "interested": e.get("user_count"), "image": img,
                       "url": f"https://discord.com/events/{GUILD}/{e['id']}"})
    events.sort(key=lambda x: x["start"])
except Forbidden:
    pass

# ---------- Member of the Week ----------
motw = None
motw_role = next((r["id"] for r in roles_raw if "Member of the Week" in r["name"]), None)
if members_ok and motw_role:
    winners = [uid for uid, m in members.items() if m and motw_role in m.get("roles", [])]
    if winners:
        uid = winners[0]
        motw = {"name": display_name(uid), "avatar": avatar_url(uid)}

now = datetime.now(timezone.utc).isoformat()
guild_doc = {"updated": now, "name": guild["name"], "members": guild.get("approximate_member_count"),
             "online": guild.get("approximate_presence_count"), "boosts": guild.get("premium_subscription_count"),
             "boost_level": guild.get("premium_tier"), "motw": motw}
docs = {
    "news": {"updated": now, "channel": "updates", "items": items},
    "staff": {"updated": now, "staff": staff},
    "roles": {"updated": now, "groups": groups, "levels": levels, "counts": members_ok},
    "events": {"updated": now, "events": events},
    "guild": guild_doc,
}


def write(name, text):
    path = os.path.join(SITE, name)
    open(path + ".tmp", "w", encoding="utf-8").write(text)
    os.replace(path + ".tmp", path)


for k, v in docs.items():
    write(f"{k}.json", json.dumps(v, ensure_ascii=False, indent=1))
try:
    docs["config"] = json.load(open(os.path.join(SITE, "config.json"), encoding="utf-8"))
except (OSError, ValueError):
    pass
write("data.js", "window.STASKYS_DATA=" + json.dumps(docs, ensure_ascii=False) + ";\n")
print(f"OK: {len(items)} annunci, {len(staff)} staff, {sum(map(len, groups.values()))} ruoli, {len(levels)} livelli, "
      f"{len(events)} eventi, MOTW {'sì' if motw else 'no'}, membri {'letti' if members_ok else 'non disponibili'} -> {SITE}")
