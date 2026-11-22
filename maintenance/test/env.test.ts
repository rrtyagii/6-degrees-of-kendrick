import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import * as dotenv from "dotenv";

test("credential parsing preserves quoted values, comments, and escaped newlines", () => {
    const data = dotenv.parse([
        "CLIENT_ID=example-client # comment",
        "CLIENT_SECRET='example#secret'",
        'MULTILINE="first\\nsecond"',
        "SUPABASE_URL=https://example.supabase.co",
    ].join("\n"));
    assert.equal(data.CLIENT_ID, "example-client");
    assert.equal(data.CLIENT_SECRET, "example#secret");
    assert.equal(data.MULTILINE, "first\nsecond");
    assert.equal(data.SUPABASE_URL, "https://example.supabase.co");
});

test("loading an explicit maintenance env file does not replace injected credentials", () => {
    const directory = mkdtempSync(path.join(os.tmpdir(), "kendrick-env-"));
    try {
        const filename = path.join(directory, ".env");
        writeFileSync(filename, "CLIENT_ID=from-file\nCLIENT_SECRET=example-secret\n");
        const environment: Record<string, string> = { CLIENT_ID: "from-host" };
        const result = dotenv.config({ path: filename, processEnv: environment, quiet: true });
        assert.equal(result.error, undefined);
        assert.equal(environment.CLIENT_ID, "from-host");
        assert.equal(environment.CLIENT_SECRET, "example-secret");
    } finally {
        rmSync(directory, { recursive: true, force: true });
    }
});
