/* The browser version's stand-in for Ink Lifter's local server
   (app/main.py). app.js's api() hands every request here in web mode, and
   gets back the same shapes and messages the server would give. When a
   route in main.py changes, change it here too.

   The server only writes "Export all" into a folder; in a browser, images
   are downloaded or shared instead (app.js), so all that's left is the
   health check. Nothing leaves the browser. */

const VERSION = document.documentElement.dataset.version || "dev";

const fail = (status, detail) => Object.assign(new Error(detail), { status });

export default async function localApi(method, path) {
  switch (`${method} ${path}`) {
    case "GET /api/health": return { output_dir: "", version: VERSION };
  }
  throw fail(404, "That needs the Ink Lifter desktop app.");
}
