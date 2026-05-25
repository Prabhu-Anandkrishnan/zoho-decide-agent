/**
 * dev-mock.js — intentionally empty.
 *
 * All fetch() calls now go directly to the FastAPI backend.
 * Set the backend origin in index.html via:
 *   window.zsHelpMeDecideConfig = {
 *     apiBaseUrl: "http://localhost:8000",
 *     devAlwaysShowInlinePrompt: true   // show inline prompt on every page load (dev only)
 *   }
 *
 * To re-enable offline mocking, restore the fetch interceptor here.
 */
