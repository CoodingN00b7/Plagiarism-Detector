# Plagiarism Detection Platform (Production-Style Refactor)

A full-stack plagiarism detection system rebuilt with clean architecture.

## What This Refactor Delivers

- FastAPI backend with modular service layers
- PAN Plagiarism Corpus 2011 ingestion pipeline
- Baseline TF-IDF + cosine similarity engine
- Optional semantic reranking with Sentence Transformers
- Chunk-based and sentence-level overlap detection
- Corpus-wide candidate indexing for fast retrieval on larger PAN datasets
- Optional FAISS-backed semantic candidate indexing for paraphrase-heavy searches
- Plagiarism highlighting and heatmap scoring
- PDF report export endpoint
- Caching for repeated checks
- React + Tailwind frontend with dark/light mode and animated UI

## New Folder Structure

```text
backend/
  api/
    dependencies.py
    routes.py
  models/
    schemas.py
  services/
    classification.py
    dataset_loader.py
    highlighter.py
    pdf_report.py
    preprocessing.py
    reporting.py
    similarity.py
    storage.py
  utils/
    cache.py
    config.py
    file_parsers.py
    text.py
  scripts/
    build_pan_dataset.py
  storage/
    pan2011/
    uploads/
    pdf_reports/
  main.py
frontend/
  src/
    components/
      Heatmap.jsx
      SourcePanel.jsx
      ThemeToggle.jsx
    lib/
      api.js
    pages/
      DashboardPage.jsx
      HomePage.jsx
      ResultPage.jsx
    styles/
      index.css
    App.jsx
    main.jsx
  index.html
  package.json
  postcss.config.js
  tailwind.config.js
  vite.config.js
.env.example
requirements.txt
README.md
```

## Dataset Integration (PAN Plagiarism Corpus 2011)

### 1. Place Dataset

Copy PAN-PC-11 documents into:

```text
backend/storage/pan2011/
```

The loader currently ingests `.txt` documents recursively and indexes them to SQLite.

### 2. Build Structured Dataset

Run:

```bash
python3.12 backend/scripts/build_pan_dataset.py
```

Output:

- SQLite indexed records in `backend/storage/plagiarism_platform.db`
- Structured manifest JSON in `backend/storage/pan2011_processed.json`

### 3. Preprocessing Pipeline

Every document goes through:

- Tokenization
- Stopword removal (scikit-learn English stop words)
- Rule-based lemmatization fallback
- Sentence splitting for overlap and heatmap logic

## Backend API (FastAPI)

Base URL: `/api/v1`

- `POST /check`
  - Input: raw text
  - Output: similarity score, classification, source matches, highlighted text, heatmap
- `POST /upload`
  - Input: file (`.txt`, `.pdf`)
  - Output: same report format as `/check`
- `GET /report/{id}`
  - Return stored report
- `GET /report/{id}/pdf`
  - Download generated PDF report
- `GET /report/{id}/export`
  - Download a JSON bundle containing the report and explanation payload
- `GET /documents`
  - Return indexed PAN documents
- `GET /health`
  - Health status

## Similarity and Detection Design

### 1. Baseline Engine: TF-IDF + Cosine Similarity

Used for robust lexical similarity and partial overlap checks.

- Document split into chunks of sentences
- Chunk-to-chunk cosine similarity matrix
- Aggregate best chunk scores for final baseline percentage

### 1b. Candidate Index

The backend builds a reusable TF-IDF candidate index over the stored corpus and reuses it for top-k retrieval.
This reduces repeated full-table scans and makes the service more scalable as the dataset grows.

### 1c. Semantic Candidate Index

When semantic mode is enabled, the backend can also search a sentence-transformer embedding index.
If `faiss` is installed, the semantic index uses it for fast approximate nearest-neighbor retrieval.
Otherwise it falls back to a normalized in-memory embedding matrix.

### 2. Sentence-Level Overlap

Each suspicious sentence is compared against candidate source sentences.
High-scoring sentence overlaps are retained for highlighting and source evidence.

### 3. Semantic Reranking (Optional)

When enabled, Sentence Transformers rerank top candidates by semantic embedding similarity.
This improves paraphrase detection where lexical overlap is weak.

### 4. Classification Thresholds

- `0-20%`: Original
- `20-50%`: Suspicious
- `50%+`: Plagiarized

## Why These Algorithms

- TF-IDF + cosine:
  - Fast, explainable, easy baseline
  - Strong for direct copy and phrase overlap
- Sentence Transformers:
  - Better semantic understanding for paraphrasing
  - Higher compute and model dependency overhead

## TF-IDF vs BERT Tradeoffs

- TF-IDF:
  - Pros: lightweight, deterministic, low latency
  - Cons: weaker semantic generalization
- BERT/Sentence Transformers:
  - Pros: stronger paraphrase and semantic matching
  - Cons: larger memory footprint, slower inference, model download/deployment complexity

Recommended production strategy:

- Use TF-IDF for first-pass candidate retrieval
- Apply semantic model only on top-k candidates

## Scalability Improvements Included

- Persistent report/document storage in SQLite
- TTL cache to avoid recomputing repeated queries
- Chunked scoring for long texts
- Candidate limiting (`MAX_SOURCE_CANDIDATES`) to bound runtime

## Future Improvements

- ANN vector index (FAISS) for large-scale semantic retrieval
- Redis cache and background workers for heavy scans
- Web crawling source fetch pipeline
- External plagiarism APIs for enrichment
- Multi-tenant auth and role-based access control
- Docker + CI/CD + observability stack

## Setup and Run

## 1. Backend

```bash
python3.12 -m pip install --user --break-system-packages -r requirements.txt
cp .env.example .env
python3.12 backend/scripts/build_pan_dataset.py
python3.12 -m uvicorn backend.main:app --reload --port 8000
```

Backend URL:

```text
http://127.0.0.1:8000
```

## 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend URL:

```text
http://127.0.0.1:5173
```

Set backend URL in frontend if needed:

```bash
export VITE_API_BASE_URL=http://127.0.0.1:8000/api/v1
```

## Production Notes

- Replace SQLite with PostgreSQL for high concurrency
- Put FastAPI behind Nginx + Gunicorn/Uvicorn workers
- Add authentication and API rate limits
- Add dataset versioning and migration scripts
- Add test suites (unit + integration + performance)

## Docker Production Stack

Run the full stack with one command:

```bash
docker compose up --build
```

The compose stack includes:

- `backend`: FastAPI API service on port 8000 inside the network
- `frontend`: Nginx-served React build
- `proxy`: public reverse proxy on port 8080

The services include healthchecks and startup ordering, so the proxy waits for the backend and frontend to report healthy before it serves traffic.

Open the app at:

```text
http://127.0.0.1:8080
```

The proxy forwards:

- `/` to the frontend service
- `/api/*` to the backend service

Data persistence:

- `backend/storage` is mounted into the backend container for the SQLite DB, uploads, reports, and PAN dataset files

Notes:

- If you add or update the PAN corpus, rebuild the dataset inside the container or on the host before running scans.
- The frontend is built with same-origin API calls, so it works directly behind the reverse proxy.

## Status

This repository has been restructured into a full-stack, modular plagiarism detection platform aligned with final-year project and product-style architecture requirements.
