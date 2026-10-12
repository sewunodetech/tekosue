// Menjaga rebrand Tekosoe → Tekosue (ADR 0011, 0016): "tekosoe" hanya boleh tersisa di catatan riwayat
// dan di beberapa tempat kompatibilitas yang didaftar per file di bawah.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";

/** File yang dikecualikan utuh: catatan riwayat (rebrand, log status), guard ini, lockfile. */
const EXCLUDED_PATHS = [
  /^\.kiro\//,
  /^docs\/decisions\/0011-/,
  /^docs\/decisions\/0016-/,
  /^docs\/STATUS\.md$/,
  /^scripts\/rebrand-guard\.test\.mjs$/,
  /^package-lock\.json$/,
];

/**
 * Sejak ADR 0016 semua identifier memakai "tekosue". Yang tersisa hanya demi kompatibilitas:
 * label enkripsi lama (membuka struk/kunci trip sebelum 12 Okt) dan package lama di assetlinks
 * (APK lama tetap bisa masuk dengan passkey sampai diganti).
 */
const ALLOWED_IN = [
  ["apps/mobile/src/lib/receipt-crypto.ts", ["tekosoe/trip-key-wrap/v1", "tekosoe/receipt/v1"]],
  ["apps/mobile/src/lib/receipt-crypto.test.mts", ["tekosoe/trip-key-wrap/v1", "tekosoe/receipt/v1/"]],
  ["apps/web/public/.well-known/assetlinks.json", ["com.tekosoe.xyz"]],
];

test("no leftover Tekosoe outside the allowlist", () => {
  const out = execFileSync("git", ["grep", "-n", "-i", "tekosoe"], { encoding: "utf8" }).trim();
  const hits = out
    .split("\n")
    .filter(Boolean)
    .filter((line) => {
      const [path] = line.split(":");
      if (EXCLUDED_PATHS.some((re) => re.test(path))) return false;
      let rest = `${line.slice(line.indexOf(":", path.length + 1) + 1)}\n`;
      for (const [file, allowed] of ALLOWED_IN) {
        if (file === path) for (const word of allowed) rest = rest.split(word).join("");
      }
      return /tekosoe/i.test(rest);
    });
  assert.deepEqual(hits, [], `"tekosoe" di luar allowlist:\n${hits.join("\n")}`);
});

test("lockfile only references @tekosue workspaces", () => {
  assert.equal(readFileSync("package-lock.json", "utf8").includes("@tekosoe/"), false);
});
