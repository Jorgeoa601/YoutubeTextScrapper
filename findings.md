# Findings & Discoveries

*This document will store all research, discoveries, technical constraints, and API caveats discovered during the project lifecycle.*

## Architectural Constraints (Self-Healing Memory)
- **Netlify Serverless Emulation:** When using `netlify dev` with static files partitioned deeply in a `public/` directory without a higher-level framework (like Next.js), you must include a `netlify.toml` file at the root to explicitly map `publish = "public/"`. Failure to do this results in a blind `404 Not Found` upon booting `localhost:8888`.
