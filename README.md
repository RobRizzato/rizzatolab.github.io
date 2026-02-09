# rizzatolab.github.io

## Local preview

From the repository root:

- `python3 -m http.server 8010`
- Open `http://localhost:8010/` (e.g. `http://localhost:8010/pages/publications.html`)

## Updating publications

The publications list on `pages/publications.html` is generated from local data files so it works reliably on GitHub Pages.

### Step 1: Export BibTeX from Google Scholar

- Open your Google Scholar profile
- Select papers (or export all)
- Click **BibTeX** and copy the output

### Step 2: Paste BibTeX into the repo

- Replace the contents of `assets/publications.bib` with the exported BibTeX

### Step 3: Regenerate the website data files

Run this from the repository root:

- `python3 tools/bibtex_to_json.py assets/publications.bib assets/publications.json`

This will update:

- `assets/publications.json` (used when served over HTTP)
- `assets/publications.js` (fallback so the page also works when opened via `file://`)

### Step 4: Deploy (GitHub Pages)

Commit and push the updated files:

- `git add assets/publications.bib assets/publications.json assets/publications.js`
- `git commit -m "Update publications"`
- `git push`