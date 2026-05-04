# Serverless SOP

## Objective
Define the rules for the Vercel Serverless Backend.

## Constraints
1. **Never leak APIFY_TOKEN:** Environment variables are accessed strictly via `process.env.APIFY_TOKEN` in the L3 functions.
2. **Synchronous Enforcement:** Functions must await the exact Apify Client execution.
3. **Data Mapping:** Array extraction mapping `[{start}] {text}` must handle messy data safely.
4. **Vercel API standard:** Serverless functions must reside strictly inside `api/` and fulfill the signature `module.exports = async function handler(req, res)`.
5. **Database Soft Fail:** Supabase database insertions must be handled asynchronously via `@supabase/supabase-js`. The insertion must be wrapped in an independent `try/catch`. If the insertion fails, the system must log the error (`console.error`) but still gracefully return the HTTP 200 transcript payload to the client.
6. **Incremental Two-Step Scraping Strategy:** To process entire channels (e.g., @starterstory), the scraper must first fetch the channel's video list and cross-reference with the `videos` table in Supabase. Only URLs not existing in the database are processed for transcripts and metadata.
7. **Resource Quota (30 Videos Max):** Any given automated scraping run must strictly limit the extraction to a maximum of 30 new videos to prevent Vercel timeout errors and manage Apify resource consumption.
8. **Dynamic Scheduling Integration:** The frontend will allow configuring the scraper execution frequency. This configuration is stored and managed via backend triggering (e.g., Vercel Cron or dynamic background tasks) bypassing manual execution.
