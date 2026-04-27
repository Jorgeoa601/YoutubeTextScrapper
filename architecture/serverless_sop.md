# Serverless SOP

## Objective
Define the rules for the Vercel Serverless Backend.

## Constraints
1. **Never leak APIFY_TOKEN:** Environment variables are accessed strictly via `process.env.APIFY_TOKEN` in the L3 functions.
2. **Synchronous Enforcement:** Functions must await the exact Apify Client execution.
3. **Data Mapping:** Array extraction mapping `[{start}] {text}` must handle messy data safely.
4. **Vercel API standard:** Serverless functions must reside strictly inside `api/` and fulfill the signature `module.exports = async function handler(req, res)`.
5. **Database Soft Fail:** Supabase database insertions must be handled asynchronously via `@supabase/supabase-js`. The insertion must be wrapped in an independent `try/catch`. If the insertion fails, the system must log the error (`console.error`) but still gracefully return the HTTP 200 transcript payload to the client.
