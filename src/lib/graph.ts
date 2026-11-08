import { promises as fs } from "fs";
import path from "path";

export type TrackInfo = {
    id: string;
    name: string;
    spotifyId: string;
};

type PathEntry = {
    artist: string;
    track: TrackInfo;
};

type ArtistRecord = {
    id: number;
    name: string | null;
};

type TrackRecord = {
    id: string;
    name: string;
    spotify_id: string;
};

type ArtistTrackRecord = {
    artist_id: number;
    track_id: string;
};

const normalizeName = (name: string) => name.trim().toLowerCase();

export class ArtistNode {
    readonly name: string;
    readonly connections = new Map<string, TrackInfo[]>();

    constructor(name: string) {
        this.name = name;
    }

    addConnection(node: ArtistNode, track: TrackInfo) {
        // A single representative track is sufficient to explain each connection.
        if (!this.connections.has(node.name)) this.connections.set(node.name, [track]);
    }
}

export class Graph {
    readonly nodes = new Map<string, ArtistNode>();
    private index?: {
        names: Map<string, string>;
        sortedNames: Array<{ name: string; normalized: string }>;
        parents: Map<string, { previous: string; track: TrackInfo }>;
        reachable: string[];
    };

    addNode(name: string): ArtistNode {
        const existing = this.nodes.get(name);
        if (existing) return existing;

        const node = new ArtistNode(name);
        this.nodes.set(name, node);
        this.index = undefined;
        return node;
    }

    addEdge(sourceName: string, destinationName: string, track: TrackInfo) {
        if (sourceName === destinationName) return;

        const source = this.addNode(sourceName);
        const destination = this.addNode(destinationName);
        source.addConnection(destination, track);
        destination.addConnection(source, track);
        this.index = undefined;
    }

    getNode(name: string): ArtistNode | undefined {
        return this.nodes.get(name);
    }

    findNode(name: string): ArtistNode | undefined {
        const exact = this.nodes.get(name.trim());
        if (exact) return exact;
        const canonicalName = this.getIndex().names.get(normalizeName(name));
        return canonicalName === undefined ? undefined : this.nodes.get(canonicalName);
    }

    private getIndex() {
        if (this.index) return this.index;
        const names = new Map<string, string>();
        for (const name of this.nodes.keys()) {
            if (!names.has(normalizeName(name))) names.set(normalizeName(name), name);
        }
        const sortedNames = Array.from(this.nodes.keys())
            .sort((a, b) => a.localeCompare(b))
            .map(name => ({ name, normalized: normalizeName(name) }));
        const start = "Kendrick Lamar";
        const visited = new Set([start]);
        const parents = new Map<string, { previous: string; track: TrackInfo }>();
        const queue = this.nodes.has(start) ? [start] : [];
        // One BFS serves every request because all paths originate at Kendrick.
        for (let cursor = 0; cursor < queue.length; cursor += 1) {
            const node = this.nodes.get(queue[cursor])!;
            for (const [adjacentName, tracks] of node.connections) {
                const track = tracks[0];
                if (visited.has(adjacentName) || !track || !this.nodes.has(adjacentName)) continue;
                visited.add(adjacentName);
                parents.set(adjacentName, { previous: node.name, track });
                queue.push(adjacentName);
            }
        }

        this.index = { names, sortedNames, parents, reachable: queue.slice(1) };
        return this.index;
    }

    breadthFirstTraversal(endName: string): { degree: number; path: PathEntry[] } | undefined {
        const index = this.getIndex();
        const end = this.nodes.has(endName.trim()) ? endName.trim() : index.names.get(normalizeName(endName));
        if (!end || !this.nodes.has("Kendrick Lamar")) return undefined;
        if (end !== "Kendrick Lamar" && !index.parents.has(end)) return undefined;
        const result: PathEntry[] = [];
        for (let current = end; current !== "Kendrick Lamar";) {
            const parent = index.parents.get(current)!;
            result.push({ artist: current, track: { ...parent.track } });
            current = parent.previous;
        }
        result.reverse();
        return { degree: result.length, path: result };
    }

    randomArtistName(): string | undefined {
        const reachable = this.getIndex().reachable;
        return reachable[Math.floor(Math.random() * reachable.length)];
    }

    autocomplete(query: string): string[] {
        const normalized = normalizeName(query);
        if (!normalized) return [];
        const matches: string[] = [];
        for (const entry of this.getIndex().sortedNames) {
            if (entry.normalized.includes(normalized)) matches.push(entry.name);
            if (matches.length === 10) break;
        }
        return matches;
    }
}

const mocksDirectory = path.resolve(process.cwd(), "src/mocks");

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function readMockJson<T>(filename: string, valid: (value: unknown) => value is T): Promise<T[]> {
    const contents = await fs.readFile(path.join(mocksDirectory, filename), "utf8");
    const records: unknown = JSON.parse(contents);
    if (!Array.isArray(records)) throw new Error(`${filename} must contain an array`);
    for (let index = 0; index < records.length; index += 1) {
        if (!valid(records[index])) throw new Error(`${filename} has an invalid record at index ${index}`);
    }
    return records;
}

async function loadGraph(): Promise<Graph> {
    const [artists, tracks, artistTracks] = await Promise.all([
        readMockJson("current_artists.json", (value): value is ArtistRecord =>
            isRecord(value) && Number.isSafeInteger(value.id) &&
            (value.name === null || typeof value.name === "string")),
        readMockJson("current_tracks.json", (value): value is TrackRecord =>
            isRecord(value) && typeof value.id === "string" && typeof value.name === "string" &&
            typeof value.spotify_id === "string" && /^[A-Za-z0-9]{22}$/.test(value.spotify_id)),
        readMockJson("current_artist_tracks.json", (value): value is ArtistTrackRecord =>
            isRecord(value) && Number.isSafeInteger(value.artist_id) && typeof value.track_id === "string"),
    ]);

    const graph = new Graph();
    const artistNames = new Map(artists.flatMap(artist => artist.name ? [[artist.id, artist.name] as const] : []));
    const trackInfo = new Map(tracks.map(track => [track.id, {
        id: track.id,
        name: track.name,
        spotifyId: track.spotify_id,
    }]));
    const artistsByTrack = new Map<string, number[]>();

    for (const relation of artistTracks) {
        const artistIds = artistsByTrack.get(relation.track_id) ?? [];
        artistIds.push(relation.artist_id);
        artistsByTrack.set(relation.track_id, artistIds);
    }

    for (const artistName of artistNames.values()) graph.addNode(artistName);

    for (const [trackId, artistIds] of artistsByTrack) {
        const track = trackInfo.get(trackId);
        if (!track) continue;

        const uniqueArtistNames = [...new Set(artistIds.map(id => artistNames.get(id)).filter((name): name is string => Boolean(name)))];
        for (let source = 0; source < uniqueArtistNames.length; source += 1) {
            for (let destination = source + 1; destination < uniqueArtistNames.length; destination += 1) {
                graph.addEdge(uniqueArtistNames[source], uniqueArtistNames[destination], track);
            }
        }
    }

    if (!graph.getNode("Kendrick Lamar")) throw new Error("Artist dataset is missing Kendrick Lamar");
    graph.breadthFirstTraversal("Kendrick Lamar");
    return graph;
}

let graphPromise: Promise<Graph> | undefined;

export function deserialize(): Promise<Graph> {
    graphPromise ??= loadGraph().catch(error => {
        graphPromise = undefined;
        throw error;
    });
    return graphPromise;
}

export async function searchDegreeOfSeparation(artistName: string) {
    return (await deserialize()).breadthFirstTraversal(artistName);
}

export async function getRandomArtistName(): Promise<string | undefined> {
    return (await deserialize()).randomArtistName();
}

export async function autocompleteArtistNames(query: string): Promise<string[]> {
    return (await deserialize()).autocomplete(query);
}
