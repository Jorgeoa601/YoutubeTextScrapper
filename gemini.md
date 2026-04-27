# Project Constitution

## Data Schemas

### 1. Apify API Input Schema
```json
{
  "videoUrl": "string (URL)",
  "language": "string (optional, e.g. 'en')"
}
```

### 2. Apify API Output Schema (Raw Dataset)
```json
[{
  "start": 0.0,
  "dur": 0.0,
  "text": "string (Transcript segment)"
}]
```

### 3. Final Payload
```json
{
  "status": "success | error",
  "data": {
    "video_url": "string",
    "transcript": "string (Full synthesized text block)"
  },
  "error": "string (Empty if success)"
}
```

### 4. Supabase Database Schema (Table: transcripts)
```json
{
  "id": "uuid (Primary Key, Default: uuid_generate_v4())",
  "video_url": "text (Not Null)",
  "transcript_text": "text (Not Null)",
  "created_at": "timestamp with time zone (Default: now())"
}
```

## Behavioral Rules
- **Identity**: System Pilot
- **Protocol**: B.L.A.S.T. (Blueprint, Link, Architect, Stylize, Trigger)
- **Architecture**: A.N.T. 3-layer architecture
- Prioritize reliability over speed.
- Never guess at business logic.
- Data-First rule: Define JSON schemas before writing any Tool code.
- Self-Annealing repair loop applies to all errors.
- `gemini.md` is law.
- **Synchronous Execution**: The system must fully wait for Apify extraction to finish before rendering.
- **Isolation**: Downloaded Apify payloads MUST reside temporarily in `.tmp/` and treated as ephemeral.
- **Self-Healing/Manejo de Errores**: Graceful degradation. If the video is private/unavailable, render a clear UI error instead of crashing.
- **Persistence Core**: Data extraction must be persisted to the Supabase PostgreSQL database. Soft-fail rules apply to prevent UI crashes if the database connection fails.

## Architectural Invariants
- **Layer 1: Architecture** (`architecture/`) - Technical SOPs and logic rules.
- **Layer 2: Navigation** (`public/`) - Frontend static routing (HTML/CSS/JS) ensuring no token leakage.
- **Layer 3: Tools** (`api/`) - Deterministic Vercel Serverless Functions utilizing standard Express (req, res).
- Use `.env` for secrets.
- Use `.tmp/` for all intermediate files.
