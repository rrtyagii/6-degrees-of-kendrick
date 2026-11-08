import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

test("the website lockfile excludes maintenance dependencies", () => {
    const lock = JSON.parse(readFileSync(path.resolve("package-lock.json"), "utf8"));
    const forbidden = ["@spotify/", "@supabase/", "dotenv"];
    for (const entry of Object.keys(lock.packages)) {
        const name = entry.replace(/^.*node_modules\//, "");
        assert.ok(!forbidden.some(prefix => name.startsWith(prefix)), entry);
    }
    assert.equal(existsSync(path.resolve("build/src/lib/helper_functions.js")), false);
    assert.equal(existsSync(path.resolve("build/src/lib/populate_database.js")), false);
    assert.equal(existsSync(path.resolve("build/src/lib/fetching_data_spotify.js")), false);
});
