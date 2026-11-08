import assert from "node:assert/strict";
import { once } from "node:events";
import { after, before, test } from "node:test";
import { Server } from "node:http";
import { AddressInfo } from "node:net";
import { gzipSync } from "node:zlib";
import { createApp } from "../src/app";

let server: Server;
let base: string;

before(async () => {
    server = createApp().listen(0, "127.0.0.1");
    await once(server, "listening");
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

after(async () => {
    if (server?.listening) {
        server.closeAllConnections();
        await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    }
});

const search = (body: unknown) => fetch(`${base}/api/search`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
});

test("search and random preserve the API contract", async () => {
    const response = await search({ artist: " drake " });
    assert.equal(response.status, 200);
    const data = await response.json();
    assert.equal(data.degree, 1);
    assert.equal(data.path[0].artist, "Drake");
    const random = await fetch(`${base}/api/random`, { method: "POST" });
    assert.equal(random.status, 200);
    assert.ok((await random.json()).degree > 0);
});

test("rejects object injection, invalid content types, long values and duplicate terms", async () => {
    for (const body of [{ artist: { $ne: null } }, { artist: " " }, { artist: "a".repeat(101) }, []]) {
        assert.equal((await search(body)).status, 400);
    }
    const wrongType = await fetch(`${base}/api/search`, { method: "POST", body: "artist=Drake" });
    assert.equal(wrongType.status, 415);
    assert.equal((await fetch(`${base}/api/autocomplete?term=a&term=b`)).status, 400);
    assert.deepEqual(await (await fetch(`${base}/api/autocomplete?term=a`)).json(), []);
});

test("sanitizes parser errors and rejects compressed and oversized payloads", async () => {
    const invalid = await fetch(`${base}/api/search`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: '{"artist":',
    });
    assert.equal(invalid.status, 400);
    assert.deepEqual(await invalid.json(), { error: "Request body must contain valid JSON" });
    assert.equal((await search({ artist: "a".repeat(3000) })).status, 413);
    const compressed = await fetch(`${base}/api/search`, {
        method: "POST", headers: { "Content-Type": "application/json", "Content-Encoding": "gzip" },
        body: gzipSync(JSON.stringify({ artist: "Drake" })),
    });
    assert.equal(compressed.status, 415);
});

test("source, data, dotfiles and encoded traversal are not public", async () => {
    for (const pathname of ["/.env", "/privateKey.pem", "/lib/helper_functions.ts", "/mocks/current_artists.json", "/maintenance/.env", "/maintenance/package.json", "/maintenance/src/populate_database.ts", "/%2e%2e%2f.env"]) {
        assert.equal((await fetch(base + pathname)).status, 404, pathname);
    }
    for (const pathname of ["/", "/formScript.js", "/styles/output.css", "/favicon.ico"]) {
        assert.equal((await fetch(base + pathname)).status, 200, pathname);
    }
});

test("security headers are present without forcing HTTPS in local development", async () => {
    const response = await fetch(base);
    assert.equal(response.headers.get("x-powered-by"), null);
    assert.equal(response.headers.get("x-content-type-options"), "nosniff");
    assert.match(response.headers.get("content-security-policy")!, /script-src 'self'/);
    assert.doesNotMatch(response.headers.get("content-security-policy")!, /upgrade-insecure-requests/);
    const preflight = await fetch(`${base}/api/search`, {
        method: "OPTIONS", headers: { Origin: "https://attacker.example", "Access-Control-Request-Method": "POST" },
    });
    assert.equal(preflight.headers.get("access-control-allow-origin"), null);
});

test("SQL, command and SSRF-shaped strings are only treated as artist names", async () => {
    for (const artist of ["' OR 1=1 --", "$(id); cat /etc/passwd", "http://169.254.169.254/latest/meta-data/"]) {
        const response = await search({ artist });
        assert.equal(response.status, 404);
        assert.deepEqual(await response.json(), { error: "Artist not found or is not connected to Kendrick Lamar" });
    }
});

test("rate limiting happens before parsing bodies, including spoofed forwarding headers", async () => {
    let limited = false;
    for (let attempt = 0; attempt < 31; attempt += 1) {
        const response = await fetch(`${base}/api/search`, {
            method: "POST", headers: { "Content-Type": "application/json", "X-Forwarded-For": `198.51.100.${attempt}` },
            body: "invalid JSON",
        });
        if (response.status === 429) { limited = true; break; }
        assert.equal(response.status, 400);
    }
    assert.ok(limited);
    const response = await search({ artist: "a".repeat(3000) });
    assert.equal(response.status, 429);
});
