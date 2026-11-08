import assert from "node:assert/strict";
import test from "node:test";
import { autocompleteArtistNames, deserialize, Graph, searchDegreeOfSeparation } from "../src/lib/graph";

test("finds a direct Kendrick collaborator with a playable track", async () => {
    const result = await searchDegreeOfSeparation("Drake");

    assert.equal(result?.degree, 1);
    assert.equal(result?.path[0]?.artist, "Drake");
    assert.ok(result?.path[0]?.track.spotifyId);
});

test("matches artist names without case sensitivity", async () => {
    const result = await searchDegreeOfSeparation("drake");

    assert.equal(result?.degree, 1);
});

test("returns zero degrees for Kendrick", async () => {
    assert.deepEqual(await searchDegreeOfSeparation("Kendrick Lamar"), { degree: 0, path: [] });
});

test("autocomplete returns bounded local artist matches", async () => {
    const names = await autocompleteArtistNames("kend");

    assert.ok(names.includes("Kendrick Lamar"));
    assert.ok(names.length <= 10);
});

test("indexed paths match an independent BFS for every artist in the dataset", async () => {
    const graph = await deserialize();
    const distances = new Map([["Kendrick Lamar", 0]]);
    const queue = ["Kendrick Lamar"];
    for (let cursor = 0; cursor < queue.length; cursor += 1) {
        const name = queue[cursor];
        for (const adjacent of graph.getNode(name)!.connections.keys()) {
            if (distances.has(adjacent)) continue;
            distances.set(adjacent, distances.get(name)! + 1);
            queue.push(adjacent);
        }
    }

    for (const name of graph.nodes.keys()) {
        const result = graph.breadthFirstTraversal(name);
        assert.equal(result?.degree, distances.get(name), name);
        if (!result) continue;
        assert.equal(result.path.length, result.degree);
        let previous = "Kendrick Lamar";
        for (const entry of result.path) {
            assert.ok(graph.getNode(previous)?.connections.get(entry.artist)
                ?.some(track => track.spotifyId === entry.track.spotifyId));
            previous = entry.artist;
        }
    }
});

test("random excludes disconnected components and index is refreshed after adding an edge", () => {
    const graph = new Graph();
    const track = { id: "track", name: "Collaboration", spotifyId: "4X5f3vT8MRuXF68pfjNte5" };
    graph.addEdge("Kendrick Lamar", "Connected", track);
    graph.addEdge("Disconnected", "Also Disconnected", track);
    for (let i = 0; i < 100; i += 1) assert.equal(graph.randomArtistName(), "Connected");
    assert.equal(graph.breadthFirstTraversal("Disconnected"), undefined);
    graph.addEdge("Connected", "Disconnected", track);
    assert.equal(graph.breadthFirstTraversal("Disconnected")?.degree, 2);
});

test("callers cannot mutate the cached track metadata through search results", async () => {
    const result = await searchDegreeOfSeparation("Drake");
    result!.path[0].track.spotifyId = "corrupted";
    assert.notEqual((await searchDegreeOfSeparation("Drake"))?.path[0].track.spotifyId, "corrupted");
});
