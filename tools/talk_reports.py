#!/usr/bin/env python3
"""Wertet Lernberichte aus den Claude-Sprechgesprächen aus.

Claude schreibt am Ende jedes Gesprächs (Tab "Sprechen") einen Block:

    #LERNBERICHT-ES datum=2026-11-07 lektion=32
    FEHLER: la cuenta = die Rechnung; he ido = ich bin gegangen
    NEU: el atasco = der Stau
    GRAMMATIK: Pretérito perfecto; ser oder estar
    #ENDE

Aufruf (Montags-Update):
    python3 tools/talk_reports.py <berichte.txt> [--new-out neu.json] [--date YYYY-MM-DD]

- <berichte.txt>: alle gefundenen Blöcke hintereinander (Rohtext aus den Chats).
- --new-out: schreibt Wörter (NEU und FEHLER), die noch nicht in data/vocab.json
  stehen, als Kandidaten für die Vokabelliste: [{"es","de","datum"}].
- Schreibt data/focus.json: nur Vokabel-IDs bzw. Wörter und Grammatik-IDs,
  keine Gesprächstexte. Bereits verarbeitete Berichte (Hash) werden nicht
  doppelt gezählt; ein zweiter Lauf nach build_data.py ordnet neue Wörter
  ihren IDs zu.
- Einträge älter als 42 Tage fallen aus dem Fokus.
"""
import argparse
import datetime as dt
import hashlib
import json
import re
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
VOCAB = ROOT / "data" / "vocab.json"
GRAMMAR = ROOT / "data" / "grammar.json"
FOCUS = ROOT / "data" / "focus.json"
META = ROOT / "data" / "meta.json"
KEEP_DAYS = 42

BLOCK = re.compile(r"#LERNBERICHT-ES(.*?)#ENDE", re.S | re.I)
ART = re.compile(r"^(el|la|los|las|un|una|unos|unas)\s+")


def norm(s):
    s = unicodedata.normalize("NFD", str(s).lower())
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    s = re.sub(r"[¿¡!?.,;:\"“”«»()\[\]*_]", " ", s)
    s = re.sub(r"\s+", " ", s).strip()
    return ART.sub("", s)


def variants(es):
    out = set()
    for part in re.split(r"\s+/\s+|\s*;\s*", es):
        p = re.sub(r"\[.*?\]", "", part)
        out.add(norm(re.sub(r"\(.*?\)", " ", p)))
        out.add(norm(p.replace("(", "").replace(")", "")))
    return {v for v in out if v}


def pairs(line):
    res = []
    for chunk in line.split(";"):
        if "=" not in chunk:
            continue
        es, de = chunk.split("=", 1)
        es, de = es.strip(" -–•\t"), de.strip(" -–•\t")
        if es and de and es.lower() not in ("keine", "ninguno", "-"):
            res.append((es, de))
    return res


def parse(text):
    reports = []
    for m in BLOCK.finditer(text):
        body = m.group(1)
        head = body.splitlines()[0] if body.splitlines() else ""
        d = re.search(r"datum\s*=\s*(\d{4}-\d{2}-\d{2})", head)
        rep = {"datum": d.group(1) if d else None, "fehler": [], "neu": [], "gram": [],
               "hash": hashlib.sha1(norm(body).encode()).hexdigest()[:12]}
        for ln in body.splitlines()[1:]:
            key, _, val = ln.partition(":")
            k = norm(key)
            if k.startswith("fehler"):
                rep["fehler"] += pairs(val)
            elif k.startswith("neu"):
                rep["neu"] += pairs(val)
            elif k.startswith("grammatik"):
                rep["gram"] += [norm(x) for x in re.split(r"[;,]", val) if norm(x)]
        reports.append(rep)
    return reports


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("reports")
    ap.add_argument("--new-out")
    ap.add_argument("--date", default=dt.date.today().isoformat())
    a = ap.parse_args()

    vocab = json.loads(VOCAB.read_text(encoding="utf-8"))["items"]
    index = {}
    for v in vocab:
        for k in variants(v["es"]):
            index.setdefault(k, v["id"])
    tlist = json.loads(GRAMMAR.read_text(encoding="utf-8"))["topics"]
    topics = {t["id"] for t in tlist}

    def topic_of(g):
        if g in topics:
            return g
        gw = set(g.split())
        best, score = None, 0.0
        for t in tlist:
            tw = set(norm(t["title"]).split())
            sc = len(gw & tw) / max(len(tw), 1)
            if norm(t["title"]) == g:
                return t["id"]
            if sc > score:
                best, score = t["id"], sc
        return best if score >= 0.5 else None

    focus = json.loads(FOCUS.read_text(encoding="utf-8")) if FOCUS.exists() else {}
    words = {w["k"]: w for w in focus.get("words", [])}
    gram = {g["id"]: g for g in focus.get("grammar", [])}
    done = set(focus.get("reports", []))

    reports = parse(Path(a.reports).read_text(encoding="utf-8"))
    new_cands, fresh = {}, 0
    for r in reports:
        day = r["datum"] or a.date
        for kind in ("fehler", "neu"):
            for es, de in r[kind]:
                k = norm(es)
                if k not in index:
                    new_cands.setdefault(k, {"es": es, "de": de, "datum": day})
                if r["hash"] in done:
                    continue
                w = words.setdefault(k, {"k": k, "es": es, "de": de, "n": 0, "last": day})
                w["n"] += 2 if kind == "fehler" else 1
                w["last"] = max(w["last"], day)
        if r["hash"] not in done:
            for g in filter(None, map(topic_of, r["gram"])):
                if g in topics:
                    e = gram.setdefault(g, {"id": g, "n": 0, "last": day})
                    e["n"] += 1
                    e["last"] = max(e["last"], day)
            done.add(r["hash"])
            fresh += 1

    cutoff = (dt.date.fromisoformat(a.date) - dt.timedelta(days=KEEP_DAYS)).isoformat()
    wl = []
    for w in words.values():
        if w["last"] < cutoff:
            continue
        w["id"] = index.get(w["k"])
        wl.append(w)
    wl.sort(key=lambda w: (-w["n"], w["k"]))
    gl = sorted((g for g in gram.values() if g["last"] >= cutoff), key=lambda g: -g["n"])

    out = {"updated": a.date, "words": wl, "grammar": gl, "reports": sorted(done)}
    FOCUS.write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")

    if META.exists():
        meta = json.loads(META.read_text(encoding="utf-8"))
        h = hashlib.sha1(VOCAB.read_bytes() + FOCUS.read_bytes()).hexdigest()[:6]
        meta["version"] = meta.get("generated", a.date) + "-" + h
        meta["focusUpdated"] = a.date
        META.write_text(json.dumps(meta, ensure_ascii=False, indent=1), encoding="utf-8")

    if a.new_out:
        Path(a.new_out).write_text(json.dumps(list(new_cands.values()), ensure_ascii=False, indent=1), encoding="utf-8")

    print(f"{len(reports)} Berichte gefunden, {fresh} neu ausgewertet; Fokus: {len(wl)} Wörter "
          f"({sum(1 for w in wl if w['id'])} mit App-ID), {len(gl)} Grammatikthemen; "
          f"{len(new_cands)} Wörter noch nicht in der Vokabelliste")


if __name__ == "__main__":
    main()
