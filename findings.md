# Findings & Discoveries

*This document will store all research, discoveries, technical constraints, and API caveats discovered during the project lifecycle.*

## Architectural Constraints (Self-Healing Memory)
- **Netlify Serverless Emulation:** When using `netlify dev` with static files partitioned deeply in a `public/` directory without a higher-level framework (like Next.js), you must include a `netlify.toml` file at the root to explicitly map `publish = "public/"`. Failure to do this results in a blind `404 Not Found` upon booting `localhost:8888`.

## Supabase Integration (Data Persistence)
**SQL Initialization Query:** To construct the persistence layer for the transcripts, the following query must be executed manually in the Supabase SQL Editor:
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE TABLE transcripts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  video_url text NOT NULL,
  transcript_text text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);
```
