import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

test("the actual Fellowship Table inline browser module parses as JavaScript", () => {
 const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");
 const match=html.match(/<script type="module">([\s\S]*?)<\/script>/);
 assert.ok(match,"Expected exactly one inline module");
 const check=spawnSync(process.execPath,["--input-type=module","--check"],{input:match[1],encoding:"utf8"});
 assert.equal(check.status,0,check.stderr);
 assert.match(html,/id="export-handoff"/);
 assert.match(match[1],/buildBrowserHandoff\(selected,events\)/);
});
