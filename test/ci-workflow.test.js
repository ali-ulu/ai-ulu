import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => readFile(join(root, rel), "utf8");

test("deploy workflow does not cancel in-progress runs on main", async () => {
  const yml = await read(".github/workflows/deploy.yml");
  // A half-finished deploy must not be interrupted by the next push.
  assert.doesNotMatch(
    yml,
    /cancel-in-progress:\s*true\s*$/m,
    "cancel-in-progress must not be unconditional: it would cancel main deploys",
  );
  assert.match(yml, /cancel-in-progress:\s*\$\{\{\s*github\.event_name == 'pull_request'\s*\}\}/);
});

test("deploy job runs only from main, never on pull requests", async () => {
  const yml = await read(".github/workflows/deploy.yml");
  assert.match(yml, /if:\s*github\.ref == 'refs\/heads\/main' && github\.event_name != 'pull_request'/);
});

test("CI lints and runs end-to-end tests", async () => {
  const yml = await read(".github/workflows/deploy.yml");
  assert.match(yml, /run:\s*npm run lint/, "CI must lint");
  assert.match(yml, /^\s{2}e2e:/m, "CI must have an e2e job");
  assert.match(yml, /run:\s*npm run test:e2e/, "the e2e job must run the suite");
});

test("the worker claims the custom domain and its www alias", async () => {
  const cfg = await read("wrangler.jsonc");
  assert.match(cfg, /"pattern":\s*"ai-ulu\.com",\s*"custom_domain":\s*true/, "apex route present");
  assert.match(cfg, /"pattern":\s*"www\.ai-ulu\.com",\s*"custom_domain":\s*true/, "www route present");
});
