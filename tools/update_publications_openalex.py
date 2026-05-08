#!/usr/bin/env python3
"""Update website publication data from OpenAlex plus the local BibTeX file.

This is intentionally independent of Google Scholar because Scholar does not
provide a stable public API. OpenAlex is machine-readable and works well for a
scheduled GitHub Pages workflow.

Usage:
  python3 tools/update_publications_openalex.py
  python3 tools/update_publications_openalex.py --author-id A5079611641
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
import time
import urllib.parse
import urllib.request
from difflib import SequenceMatcher
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional

from bibtex_to_json import entry_to_publication, parse_bibtex


DEFAULT_AUTHOR_ID = "A5079611641"
OPENALEX_BASE = "https://api.openalex.org"


def normalize_title(title: str) -> str:
    title = re.sub(r"<[^>]+>", "", title)
    title = title.lower()
    title = re.sub(r"[^a-z0-9]+", " ", title)
    return re.sub(r"\s+", " ", title).strip()


def clean_title(title: str) -> str:
    title = re.sub(r"<[^>]+>", "", title or "")
    return re.sub(r"\s+", " ", title).strip()


def normalize_doi(doi: str) -> str:
    doi = doi.strip()
    doi = re.sub(r"^https?://(dx\.)?doi\.org/", "", doi, flags=re.I)
    return doi


def clean_venue(name: str) -> str:
    name = (name or "").strip()
    lowered = name.lower()
    if lowered in {"arxiv.org", "arxiv (cornell university)"}:
        return "arXiv"
    if "biorxiv" in lowered:
        return "bioRxiv"
    return name


def work_score(pub: Dict[str, Any]) -> int:
    score = 0
    links = pub.get("links") or {}
    venue = (pub.get("venue") or "").lower()

    if links.get("doi"):
        score += 20
    if links.get("url"):
        score += 4
    if venue and venue not in {"arxiv", "biorxiv"}:
        score += 10
    if pub.get("type") == "preprint":
        score -= 12
    if pub.get("date"):
        score += 2
    if pub.get("authors"):
        score += 1
    return score


def choose_better(existing: Dict[str, Any], candidate: Dict[str, Any]) -> Dict[str, Any]:
    # The manually curated BibTeX remains the source of truth for records it
    # already contains. OpenAlex enriches those records with links/DOIs.
    if existing.get("_source") == "local" and candidate.get("_source") == "openalex":
        merged = dict(existing)
        links = dict(existing.get("links") or {})
        links.update({k: v for k, v in (candidate.get("links") or {}).items() if v and not links.get(k)})
        if links:
            merged["links"] = links
        if not merged.get("date") and candidate.get("date"):
            merged["date"] = candidate["date"]
        return merged

    if work_score(candidate) > work_score(existing):
        return candidate

    merged = dict(existing)
    for key in ("authors", "year", "date", "venue", "type"):
        if not merged.get(key) and candidate.get(key):
            merged[key] = candidate[key]

    links = dict(existing.get("links") or {})
    links.update({k: v for k, v in (candidate.get("links") or {}).items() if v and not links.get(k)})
    if links:
        merged["links"] = links
    return merged


def openalex_get(path: str, params: Dict[str, str]) -> Dict[str, Any]:
    email = os.environ.get("OPENALEX_MAILTO")
    if email:
        params = {**params, "mailto": email}

    url = f"{OPENALEX_BASE}{path}?{urllib.parse.urlencode(params)}"
    request = urllib.request.Request(url, headers={"User-Agent": "rizzatolab-publications-updater/1.0"})
    with urllib.request.urlopen(request, timeout=30) as response:
        return json.load(response)


def fetch_openalex_works(author_id: str) -> List[Dict[str, Any]]:
    works: List[Dict[str, Any]] = []
    cursor = "*"

    while cursor:
        data = openalex_get(
            "/works",
            {
                "filter": f"authorships.author.id:{author_id}",
                "sort": "publication_date:desc",
                "per-page": "200",
                "cursor": cursor,
            },
        )
        works.extend(data.get("results", []))
        next_cursor = data.get("meta", {}).get("next_cursor")
        if not next_cursor or next_cursor == cursor:
            break
        cursor = next_cursor
        time.sleep(0.1)

    return works


def work_to_publication(work: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    title = clean_title(work.get("title") or "")
    if not title:
        return None

    source = ((work.get("primary_location") or {}).get("source") or {}).get("display_name") or ""
    landing_page = (work.get("primary_location") or {}).get("landing_page_url") or ""
    doi = normalize_doi(work.get("doi") or "")

    links: Dict[str, str] = {}
    if doi:
        links["doi"] = doi
    if landing_page:
        links["url"] = landing_page
    elif work.get("id"):
        links["url"] = work["id"]

    pub: Dict[str, Any] = {
        "title": title,
        "authors": [
            a.get("author", {}).get("display_name")
            for a in work.get("authorships", [])
            if a.get("author", {}).get("display_name")
        ],
        "year": work.get("publication_year"),
        "date": work.get("publication_date"),
        "venue": clean_venue(source),
        "type": work.get("type") or "article",
        "links": links,
        "_source": "openalex",
    }

    return {key: value for key, value in pub.items() if value}


def load_local_bibtex(path: Path) -> List[Dict[str, Any]]:
    if not path.exists():
        return []
    entries = parse_bibtex(path.read_text(encoding="utf-8"))
    pubs = [entry_to_publication(entry) for entry in entries]
    for pub in pubs:
        pub["_source"] = "local"
    return pubs


def merge_publications(groups: Iterable[Iterable[Dict[str, Any]]]) -> List[Dict[str, Any]]:
    merged: Dict[str, Dict[str, Any]] = {}

    for pubs in groups:
        for pub in pubs:
            title_key = normalize_title(pub.get("title", ""))
            if not title_key:
                continue
            if title_key in merged:
                merged[title_key] = choose_better(merged[title_key], pub)
            else:
                fuzzy_key = None
                for existing_key in merged:
                    if SequenceMatcher(None, existing_key, title_key).ratio() >= 0.92:
                        fuzzy_key = existing_key
                        break
                if fuzzy_key:
                    merged[fuzzy_key] = choose_better(merged[fuzzy_key], pub)
                else:
                    merged[title_key] = pub

    def sort_key(pub: Dict[str, Any]):
        year = pub.get("year") or 0
        date_digits = re.sub(r"\D", "", pub.get("date") or "")
        date = int(date_digits) if date_digits else 0
        title = pub.get("title") or ""
        return (-int(year), -date, title.lower())

    pubs = []
    for pub in merged.values():
        clean = dict(pub)
        clean.pop("_source", None)
        pubs.append(clean)
    return sorted(pubs, key=sort_key)


def write_outputs(pubs: List[Dict[str, Any]], out_json: Path) -> None:
    out_json.parent.mkdir(parents=True, exist_ok=True)
    out_json.write_text(json.dumps(pubs, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    js_out = out_json.with_suffix(".js")
    js_out.write_text(
        "// Auto-generated from OpenAlex and local BibTeX. Do not edit by hand.\n"
        + "window.PUBLICATIONS = "
        + json.dumps(pubs, ensure_ascii=False)
        + ";\n",
        encoding="utf-8",
    )


def main(argv: List[str]) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--author-id", default=os.environ.get("OPENALEX_AUTHOR_ID", DEFAULT_AUTHOR_ID))
    parser.add_argument("--bib", default="assets/publications.bib")
    parser.add_argument("--out", default="assets/publications.json")
    args = parser.parse_args(argv[1:])

    bib_path = Path(args.bib)
    out_json = Path(args.out)

    openalex_pubs = [p for p in (work_to_publication(w) for w in fetch_openalex_works(args.author_id)) if p]
    local_pubs = load_local_bibtex(bib_path)
    pubs = merge_publications([openalex_pubs, local_pubs])
    write_outputs(pubs, out_json)

    print(
        f"Wrote {len(pubs)} publications to {out_json} and {out_json.with_suffix('.js')} "
        f"({len(openalex_pubs)} from OpenAlex, {len(local_pubs)} from local BibTeX)."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
