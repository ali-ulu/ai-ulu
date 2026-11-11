import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => readFile(join(root, rel), "utf8");

// The biggest objection people type into search is "can I build it with AI for
// free?". The home page answers it instead of ignoring it.
test("the home page answers the 'build it with AI for free' objection", async () => {
  const home = await read("dist/index.html");
  assert.match(home, /id="neden"/, "the objection section is present");
  assert.match(home, /Yapay zekâ ile <em>bedava<\/em> yaparım/, "it names the objection");
  assert.match(
    home,
    /href="\/blog\/yapay-zeka-ile-web-sitesi-yapmak\/"/,
    "it links to the post that argues the point",
  );
  // The benefits section points at it, so a skimmer finds it.
  assert.match(home, /href="\/#neden"/, "an in-page link reaches the section");
});

test("the packages section links to the price explainer", async () => {
  const home = await read("dist/index.html");
  assert.match(
    home,
    /href="\/blog\/web-sitesi-fiyatini-ne-belirler\/"/,
    "packages link to the pricing post",
  );
});

test("no placeholder price ships while priceFrom is unset", async () => {
  const home = await read("dist/index.html");
  const lead = home.match(/id="paketler"[\s\S]*?<div class="grid g3">/)?.[0] ?? "";
  assert.match(lead, /Fiyat listesi yok/, "the honest fallback shows");
  assert.doesNotMatch(lead, /₺/, "no currency symbol appears without a real number");
});
