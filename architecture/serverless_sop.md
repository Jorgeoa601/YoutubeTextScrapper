# Serverless SOP

## Objective
Define the rules for the Netlify Serverless Backend.

## Constraints
1. **Never leak APIFY_TOKEN:** Environment variables are accessed strictly via `process.env.APIFY_TOKEN` in the L3 functions.
2. **Synchronous Enforcement:** Functions must await the exact Apify Client execution.
3. **Data Mapping:** Array extraction mapping `[{start}] {text}` must handle messy data safely.
