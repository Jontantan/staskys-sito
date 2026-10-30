#!/usr/bin/env python3
"""Staskys — ruoli automatici "King <gioco>".

Per ogni minigioco del sito trova il n.1 della classifica (Supabase) e gli assegna
il ruolo "King <Nome>", togliendolo a chiunque altro lo abbia.
Tocca SOLO i ruoli King: li crea se mancano (sotto il ruolo più alto del bot),
li assegna e li rimuove. Non modifica né elimina altri ruoli, canali o membri,
e non invia messaggi.

Uso:  STASKYS_BOT_TOKEN=... python3 _scripts/kings.py [--dry-run]
Gli ID dei ruoli vengono salvati in _scripts/kings.json. Il token non viene mai stampato.
"""
import os, sys, json, time, urllib.request, urllib.error, urllib.parse
from datetime import datetime, timezone
from zoneinfo import ZoneInfo

GUILD = os.environ.get("STASKYS_GUILD", "1244253666295283713")
API = "https://discord.com/api/v10"
SB_URL = "https://otxtpwojvuyxksrsfpdl.supabase.co/rest/v1"
SB_KEY = ("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im90eHRwd29qdnV5eGtzcnNmcGRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI5NjM0MjEsImV4cCI6MjEwODUzOTQyMX0"
          ".-TgsMJ2feBz8pT7tXGs7Es7IumpDWvKpopoy5Yt_hoE")  # chiave anon pubblica (già nel sito)
DRY = "--dry-run" in sys.argv
MAP_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "kings.json")
TOKEN = os.environ.get("STASKYS_BOT_TOKEN") or os.environ.get("STASKYS_DISCORD_BOT_TOKEN") or sys.exit("Imposta la variabile STASKYS_BOT_TOKEN")

# gioco: (nome ruolo, colore, più basso è meglio?)
GAMES = {
    "2048":     ("King 2048",     0xEDC22E, False),
    "breakout": ("King Breakout", 0xE74C3C, False),
    "clicker":  ("King Clicker",  0xF39C12, False),
    "dino":     ("King Dino",     0x7F8C8D, False),
    "flappy":   ("King Flappy",   0x2ECC71, False),
    "mines":    ("King Mines",    0x95A5A6, True),   # tempo in secondi, solo vittorie
    "quiz":     ("King Quiz",     0x9B59B6, False),
    "reaction": ("King Reazione", 0x1ABC9C, True),   # ms medi
    "snake":    ("King Snake",    0x27AE60, False),
    "stack":    ("King Stack",    0x3498DB, False),
    "suika":    ("King Suika",    0xE91E63, False),
    "tetris":   ("King Tetris",   0x00BCD4, False),
    "typing":   ("King Typing",   0x34495E, False),
    "wordle":   ("King Wordle",   0x6AAA64, True),   # tentativi di oggi (7 = non indovinata)
}


def dc(method, path, body=None, reason=None):
    for _ in range(6):
        h = {"Authorization": "Bot " + TOKEN, "User-Agent": "StaskysKings (sito, 1.0)"}
        data = None
        if body is not None:
            data = json.dumps(body).encode(); h["Content-Type"] = "application/json"
        if reason:
            h["X-Audit-Log-Reason"] = urllib.parse.quote(reason)
        req = urllib.request.Request(API + path, data=data, headers=h, method=method)
        try:
            with urllib.request.urlopen(req, timeout=25) as r:
                raw = r.read()
                return json.loads(raw) if raw else None
        except urllib.error.HTTPError as e:
            if e.code == 429:
                time.sleep(float(json.load(e).get("retry_after", 2)) + 0.5); continue
            if e.code == 404:
                return None
            raise RuntimeError(f"Discord {method} {path}: HTTP {e.code} {e.read()[:300]!r}")
    raise RuntimeError("Troppi rate limit da Discord")


def sb(path):
    req = urllib.request.Request(SB_URL + path, headers={"apikey": SB_KEY, "Authorization": "Bearer " + SB_KEY})
    return json.load(urllib.request.urlopen(req, timeout=25))


def rome_midnight_utc():
    now = datetime.now(ZoneInfo("Europe/Rome"))
    return now.replace(hour=0, minute=0, second=0, microsecond=0).astimezone(timezone.utc).isoformat()


def top_players(game, lower):
    """Candidati in ordine (miglior punteggio, poi chi l'ha fatto prima), un solo posto per utente."""
    q = f"/scores?select=discord_id,username,score,created_at&game=eq.{urllib.parse.quote(game)}&discord_id=not.is.null"
    if game == "wordle":
        q += "&score=lte.6&created_at=gte." + urllib.parse.quote(rome_midnight_utc())
    q += f"&order=score.{'asc' if lower else 'desc'},created_at.asc&limit=500"
    seen, out = set(), []
    for r in sb(q):
        if r["discord_id"] not in seen:
            seen.add(r["discord_id"]); out.append(r)
    return out


def main():
    log = (lambda s: print(("[PROVA] " if DRY else "") + s))
    me = dc("GET", "/users/@me")
    log(f"Bot: {me['username']} ({me['id']}) · server {GUILD}")
    roles = {r["id"]: r for r in dc("GET", f"/guilds/{GUILD}/roles")}
    member = dc("GET", f"/guilds/{GUILD}/members/{me['id']}")
    perms = 0
    for rid in member["roles"] + [GUILD]:
        perms |= int(roles[rid]["permissions"])
    if not perms & (1 << 28) and not perms & 8:
        sys.exit("Il bot non ha il permesso Gestisci ruoli")
    top = max(roles[r]["position"] for r in member["roles"])

    mapping = json.load(open(MAP_FILE)) if os.path.exists(MAP_FILE) else {}
    by_name = {r["name"]: r for r in roles.values()}
    created = []
    for game, (name, color, _) in GAMES.items():
        rid = mapping.get(game)
        if rid in roles:
            continue
        if name in by_name:  # esiste già con questo nome: riusalo
            mapping[game] = by_name[name]["id"]; continue
        if DRY:
            log(f"Creerei il ruolo {name} (#{color:06X})"); mapping[game] = None; continue
        r = dc("POST", f"/guilds/{GUILD}/roles", {"name": name, "color": 0, "hoist": False,
               "mentionable": False, "permissions": "0"}, reason="Ruoli King automatici")
        roles[r["id"]] = r; mapping[game] = r["id"]; created.append(r["id"])
        log(f"Creato il ruolo {name} ({r['id']})")
    if created:  # sposta SOLO i ruoli appena creati appena sotto il ruolo più alto del bot
        dc("PATCH", f"/guilds/{GUILD}/roles",
           [{"id": rid, "position": top - 1} for rid in reversed(created)], reason="Ruoli King automatici")
        log(f"Posizionati {len(created)} ruoli sotto la posizione {top}")
    if not DRY:
        json.dump(mapping, open(MAP_FILE, "w"), indent=2, ensure_ascii=False)

    king_ids = {v for v in mapping.values() if v}
    for rid in king_ids:  # sicurezza: tocchiamo solo ruoli il cui nome inizia con "King "
        if not roles[rid]["name"].startswith("King ") or roles[rid]["position"] >= top:
            sys.exit(f"Ruolo {rid} non è un ruolo King gestibile: mi fermo")

    # chi ha già i ruoli King (scansione membri: serve l'intent Server Members)
    holders = {rid: set() for rid in king_ids}
    after = "0"
    while True:
        page = dc("GET", f"/guilds/{GUILD}/members?limit=1000&after={after}")
        for m in page:
            for rid in m["roles"]:
                if rid in holders:
                    holders[rid].add(m["user"]["id"])
        if len(page) < 1000:
            break
        after = page[-1]["user"]["id"]

    kings = {}
    for game, (name, _, lower) in GAMES.items():
        rid = mapping.get(game)
        king = None
        for c in top_players(game, lower):
            if dc("GET", f"/guilds/{GUILD}/members/{c['discord_id']}"):
                king = c; break
            log(f"{name}: {c['username']} ({c['discord_id']}) non è nel server, salto")
        if king is None and game == "wordle":
            log(f"{name}: nessuna partita vinta oggi, il ruolo resta com'è"); continue
        cur = holders.get(rid, set())
        want = king["discord_id"] if king else None
        if king:
            kings[name] = f"{king['username']} ({want}) · {king['score']}"
        for uid in cur - {want}:
            log(f"{name}: tolgo a {uid}")
            if not DRY: dc("DELETE", f"/guilds/{GUILD}/members/{uid}/roles/{rid}", reason=f"Non è più {name}")
        if want and want not in cur:
            log(f"{name}: assegno a {king['username']} ({want}), punteggio {king['score']}")
            if not DRY and rid: dc("PUT", f"/guilds/{GUILD}/members/{want}/roles/{rid}", reason=f"N.1 di {game}")
        if not king:
            log(f"{name}: nessun giocatore in classifica")
    log("Re attuali: " + "; ".join(f"{k} = {v}" for k, v in kings.items()))


if __name__ == "__main__":
    main()
