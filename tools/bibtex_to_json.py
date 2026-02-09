#!/usr/bin/env python3
"""Convert a BibTeX file (e.g. exported from Google Scholar) into JSON for the website.

Usage:
  python3 tools/bibtex_to_json.py assets/publications.bib assets/publications.json

The output JSON is an array of objects:
  {
    "title": "...",
    "authors": ["A. Author", "B. Author"],
    "year": 2025,
    "venue": "Nature Physics",
    "type": "article",
    "links": {"doi": "...", "url": "..."}
  }
"""

from __future__ import annotations

import json
import re
import sys
from dataclasses import dataclass
from typing import Dict, List, Tuple


@dataclass
class BibEntry:
    entry_type: str
    citekey: str
    fields: Dict[str, str]


def _strip_outer_braces(value: str) -> str:
    value = value.strip().rstrip(",")
    if len(value) >= 2 and ((value[0] == "{" and value[-1] == "}") or (value[0] == '"' and value[-1] == '"')):
        return value[1:-1].strip()
    return value


def _clean_tex(value: str) -> str:
    # Keep it conservative: remove outer braces and collapse whitespace.
    value = re.sub(r"\s+", " ", value)
    # Remove common BibTeX brace-protection blocks: {Word} -> Word
    value = re.sub(r"\{([^{}]+)\}", r"\1", value)
    return value.strip()


def _parse_value(text: str, i: int) -> Tuple[str, int]:
    # Parses a BibTeX value starting at text[i]. Supports {...} and "...".
    n = len(text)
    while i < n and text[i].isspace():
        i += 1
    if i >= n:
        return "", i

    if text[i] == "{":
        depth = 0
        start = i
        while i < n:
            ch = text[i]
            if ch == "{":
                depth += 1
            elif ch == "}":
                depth -= 1
                if depth == 0:
                    i += 1
                    break
            i += 1
        return text[start:i].strip(), i

    if text[i] == '"':
        i += 1
        start = i
        escaped = False
        while i < n:
            ch = text[i]
            if escaped:
                escaped = False
            elif ch == "\\":
                escaped = True
            elif ch == '"':
                value = text[start:i]
                i += 1
                return f'"{value}"', i
            i += 1
        return f'"{text[start:i]}"', i

    # Bareword (rare in Scholar exports)
    start = i
    while i < n and text[i] not in ",\n\r}":
        i += 1
    return text[start:i].strip(), i


def parse_bibtex(raw: str) -> List[BibEntry]:
    entries: List[BibEntry] = []

    # Drop full-line comments.
    raw = "\n".join(line for line in raw.splitlines() if not line.lstrip().startswith("%"))

    i = 0
    n = len(raw)
    while i < n:
        at = raw.find("@", i)
        if at == -1:
            break
        i = at + 1

        # entry type
        m = re.match(r"([A-Za-z]+)\s*\{", raw[i:])
        if not m:
            continue
        entry_type = m.group(1).lower()
        i += m.end(0)  # positioned after '{'

        # citekey
        comma = raw.find(",", i)
        if comma == -1:
            break
        citekey = raw[i:comma].strip()
        i = comma + 1

        # fields until matching top-level closing brace
        fields_text_start = i
        depth = 1
        while i < n and depth > 0:
            if raw[i] == "{":
                depth += 1
            elif raw[i] == "}":
                depth -= 1
            i += 1
        fields_text = raw[fields_text_start : i - 1]

        fields: Dict[str, str] = {}
        j = 0
        while j < len(fields_text):
            # skip whitespace and commas
            while j < len(fields_text) and fields_text[j] in "\n\r\t ,":
                j += 1
            if j >= len(fields_text):
                break

            name_match = re.match(r"([A-Za-z][A-Za-z0-9_\-]*)\s*=", fields_text[j:])
            if not name_match:
                # can't parse further
                break
            name = name_match.group(1).lower()
            j += name_match.end(0)

            value, j = _parse_value(fields_text, j)
            if value:
                fields[name] = _clean_tex(_strip_outer_braces(value))

            # consume trailing stuff to next comma
            while j < len(fields_text) and fields_text[j] not in ",":
                if fields_text[j] == "\n":
                    break
                j += 1
            if j < len(fields_text) and fields_text[j] == ",":
                j += 1

        entries.append(BibEntry(entry_type=entry_type, citekey=citekey, fields=fields))

    return entries


def entry_to_publication(e: BibEntry) -> dict:
    f = e.fields

    title = f.get("title", "").strip()
    authors_raw = f.get("author", "")
    authors = [a.strip() for a in authors_raw.split(" and ") if a.strip()] if authors_raw else []

    year_str = f.get("year", "").strip()
    year = None
    if year_str:
        try:
            year = int(re.findall(r"\d{4}", year_str)[0])
        except Exception:
            year = None

    venue = (
        f.get("journal")
        or f.get("booktitle")
        or f.get("publisher")
        or f.get("school")
        or ""
    ).strip()

    links = {}
    if f.get("doi"):
        links["doi"] = f["doi"].strip()
    if f.get("url"):
        links["url"] = f["url"].strip()

    pub = {
        "title": title,
        "authors": authors,
        "year": year,
        "venue": venue,
        "type": e.entry_type,
        "links": links,
    }

    # Drop empty keys for cleanliness
    if not pub["authors"]:
        pub.pop("authors")
    if pub["year"] is None:
        pub.pop("year")
    if not pub["venue"]:
        pub.pop("venue")
    if not pub["links"]:
        pub.pop("links")

    return pub


def main(argv: List[str]) -> int:
    if len(argv) != 3:
        print("Usage: python3 tools/bibtex_to_json.py INPUT.bib OUTPUT.json", file=sys.stderr)
        return 2

    inp, outp = argv[1], argv[2]
    with open(inp, "r", encoding="utf-8") as f:
        raw = f.read()

    entries = parse_bibtex(raw)
    pubs = [entry_to_publication(e) for e in entries]

    def sort_key(p: dict):
        year = p.get("year", 0)
        title = p.get("title", "")
        return (-int(year) if isinstance(year, int) else 0, title.lower())

    pubs.sort(key=sort_key)

    with open(outp, "w", encoding="utf-8") as f:
        json.dump(pubs, f, ensure_ascii=False, indent=2)
        f.write("\n")

    js_outp = None
    if outp.lower().endswith(".json"):
        js_outp = outp[:-5] + ".js"
        with open(js_outp, "w", encoding="utf-8") as f:
            f.write("// Auto-generated from BibTeX. Do not edit by hand.\n")
            f.write("window.PUBLICATIONS = ")
            json.dump(pubs, f, ensure_ascii=False)
            f.write(";\n")

    msg = f"Wrote {len(pubs)} publications to {outp}"
    if js_outp:
        msg += f" and {js_outp}"
    print(msg)
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
