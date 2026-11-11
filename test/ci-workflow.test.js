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

// The domain is expired, so GitHub Pages is the address customers get. The same
// dist/ is published under the /ai-ulu/ project path with a Pages-specific origin.
//
// The deploy writes the gh-pages branch rather than using the Pages artifact API:
// Pages serves that branch, so the site is one commit and does not depend on the
// Pages Actions API being reachable.
test("a GitHub Pages job publishes dist/ under the project sub-path", async () => {
  const yml = await read(".github/workflows/deploy.yml");
  assert.match(yml, /^\s{2}pages:/m, "there is a pages job");
  assert.match(yml, /git push[\s\S]*?gh-pages/, "it pushes the gh-pages branch");
  assert.match(yml, /cd dist/, "it publishes the built site");
  assert.match(yml, /BASE_PATH:\s*\/ai-ulu\//, "the build carries the project base path");
  assert.match(yml, /SITE_URL:\s*https:\/\/ali-ulu\.github\.io\/ai-ulu/, "canonical URLs point at the Pages origin");
  assert.match(yml, /contents:\s*write/, "the job may write the branch");
});

// Pages serves the gh-pages branch through Jekyll unless .nojekyll is present,
// and Jekyll skips any path starting with "_" (our _headers file).
test("the build marks the output so Pages serves it without Jekyll", async () => {
  const build = await read("scripts/build.mjs");
  assert.match(build, /\.nojekyll/, "the build writes .nojekyll into dist/");
});
