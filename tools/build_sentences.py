#!/usr/bin/env python3
"""Pflegt data/sentences.json (Alltagssätze zum Selbst-Formulieren).

  python3 tools/build_sentences.py neue.json [--date YYYY-MM-DD]

neue.json: Liste [{"es","de","alt":[...],"t":"Thema"}]. Bekannte Sätze (gleiches es) werden
übersprungen, neue bekommen eine stabile id und "added" (erscheinen in der App als neu).
"""
import argparse, datetime as dt, hashlib, json, re
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "data" / "sentences.json"

def key(es):
    return re.sub(r"[^\wáéíóúñü ]", "", es.lower()).strip()

def main():
    ap = argparse.ArgumentParser(); ap.add_argument("files", nargs="+"); ap.add_argument("--date", default=dt.date.today().isoformat())
    ap.add_argument("--no-new-flag", action="store_true", help="beim Erstaufbau nicht als neu markieren")
    a = ap.parse_args()
    data = json.loads(OUT.read_text(encoding="utf-8")) if OUT.exists() else {"items": []}
    have = {key(x["es"]) for x in data["items"]}
    n = 0
    for f in a.files:
        for x in json.loads(Path(f).read_text(encoding="utf-8")):
            es = re.sub(r"\s+", " ", x["es"]).strip(); k = key(es)
            if not es or k in have: continue
            have.add(k)
            it = {"id": hashlib.sha1(k.encode()).hexdigest()[:10], "es": es, "de": x["de"].strip(), "t": x.get("t", "Alltag")}
            alt = [s.strip() for s in x.get("alt", []) if s.strip() and key(s) != k]
            if alt: it["alt"] = alt
            if not a.no_new_flag: it["added"] = a.date
            data["items"].append(it); n += 1
    data["generated"] = a.date
    OUT.write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"{n} neue Sätze, gesamt {len(data['items'])}")

if __name__ == "__main__":
    main()
