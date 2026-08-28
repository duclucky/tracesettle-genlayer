import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("keeps form controls and transaction feedback contained inside cards", async () => {
  const cssUrl = new URL("../frontend/src/styles.css", import.meta.url);
  const css = await readFile(cssUrl, "utf8");
  const block = (selector) => {
    const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const match = css.match(new RegExp(`${escaped}\\s*\\{[^}]*\\}`));
    assert.ok(match, `Missing CSS block for ${selector}`);
    return match[0];
  };

  assert.match(block(".form-panel"), /min-width:\s*0;/);
  assert.match(block(".form-panel"), /max-width:\s*100%;/);
  assert.match(block(".field-grid"), /min-width:\s*0;/);
  assert.match(block(".field-grid"), /max-width:\s*100%;/);
  assert.match(
    block(".field-grid input,\n.field-grid textarea,\n.field-grid select"),
    /max-width:\s*100%;/
  );
  assert.match(block(".transaction-state"), /max-width:\s*100%;/);
  assert.match(block(".transaction-state"), /overflow-wrap:\s*anywhere;/);
});
