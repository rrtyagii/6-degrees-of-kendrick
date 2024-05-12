import * as path from 'path';

import {readFileAsJson} from "./helper_functions";

type TrackInfo = {
    id: string;
    name: string;
    spotify_id: string;
    preview_url: string;
    number_id: number;
}

interface ArtistInfo {
    id: number,
    name: string,
    spotify_id: string,
    popularity: number,
}

type Connection = {
    artist: string;
    tracks: TrackInfo[];
};

export class ArtistNode {
    name: string;
    connections: Map<string, TrackInfo[]>;

    constructor(name: string) {
        this.name = name;
        this.connections = new Map();
    }
    
    addConnection(node: ArtistNode, track: TrackInfo) {
        if (!this.connections.has(node.name)) {
            this.connections.set(node.name, []);
        }
        this.connections.get(node.name)!.push(track);
    }
    
    getConnections(): Map<string, TrackInfo[]> {
        return this.connections;
    }
    
    isAdjacent(node: ArtistNode): boolean {
        return this.connections.has(node.name);
    }
}

export class Graph {
    nodes: Map<string, ArtistNode>;

    constructor() {
        this.nodes = new Map();
    }

    addNode(name: string): ArtistNode {
        let node = this.nodes.get(name);
        if (!node) {
            node = new ArtistNode(name);
            this.nodes.set(name, node);
        }
        return node;
    }

    addEdge(sourceName: string, destinationName: string, track: TrackInfo) {
        const sourceNode = this.addNode(sourceName);
        const destinationNode = this.addNode(destinationName);
        sourceNode.addConnection(destinationNode, track);
        destinationNode.addConnection(sourceNode, track);
    }

    getNode(name: string): ArtistNode | undefined {
        return this.nodes.get(name);
    }

    breadthFirstTraversal(endName: string): { 
        degree: number, 
        path: { artist: string, track: TrackInfo} [] } | undefined {

        const start = this.getNode("Kendrick Lamar");
        const end = this.getNode(endName);
    
        if (!start || !end) {
            return undefined;
        }
    
        const visited = new Set<string>();

        const queue: Array<{
            node: ArtistNode; 
            depth: number, 
            path: { artist : string, track: TrackInfo} [] 
        }> = [];
    
        queue.push({ 
            node: start, 
            depth: 0, 
            path: []
        });
        visited.add(start.name);
    
        while (queue.length > 0) {
            const { node, depth, path } = queue.shift()!;
    
            for (const [adjName, tracks] of node.getConnections()) {

                const adjNode = this.getNode(adjName);
                if(!adjNode) continue;

                const track = tracks[0];
                const newPath = [...path, { artist: adjName, track: track }];
                if (adjNode === end) {
                    return { degree: depth + 1, path: newPath };
                }
                if (!visited.has(adjName)) {
                    visited.add(adjName);
                    queue.push({ node: adjNode, depth: depth + 1, path: newPath });
                }
            }
        }
        return undefined;
    }
    
    visualize() {
        for (let [key, value] of this.nodes) {
            const adjacents = Array.from(value.getConnections()).map(([nodeName, tracks]) => ({
                artist: nodeName,
                tracks: tracks.map(track => `${track.name} (URL: ${track.preview_url})`)
            }));
            console.log(`${key} -->`, adjacents.length > 0 ? adjacents : "No connections");
        }
    }
    
    serialize() {
        const nodes = [];
        for (let [name, node] of this.nodes) {
            nodes.push({
                name: name,
                connections: Array.from(node.getConnections()).map(([adjName, tracks]) => ({
                    artist: adjName,
                    tracks: tracks.map(track => ({name: track.name, spotifyId: track.spotify_id, previewUrl: track.preview_url}))
                }))
            });
        }
        return JSON.stringify(nodes, null, 2);
    }
}

export async function populate_graph(){
    const graph = new Graph();

    const trackToArtists = new Map<string, string[]>();

    const artistsData = await readFileAsJson('../mocks/current_artists.json');
    const trackData = await readFileAsJson('../mocks/current_tracks.json');
    const artistTrackData = await readFileAsJson("../mocks/current_artist_tracks.json");

    if(artistsData === undefined || artistTrackData === undefined){
        throw new Error("No data found");
    }

    artistsData.forEach((artistData:any) => {
        if(artistData.name !== null){
            graph.addNode(artistData.name);
        }
    });

    artistTrackData.forEach((artistTrack: any) => {
        const trackId = artistTrack.track_id;  // Ensure this ID is correctly capturing from artistTrack
        if(!trackToArtists.has(trackId)){
            trackToArtists.set(trackId, []);
        }

        const artists = trackToArtists.get(trackId);
        artists?.push(artistTrack.artist_id);  // Confirm artist IDs are correctly added
    });

    trackToArtists.forEach((artists, trackId) => {
        const trackInfo: TrackInfo | undefined = trackData.find((track:TrackInfo) => track.id === trackId);
        if (!trackInfo) return;  // Confirm track information is found

        const trackDetails:TrackInfo = {
            id: trackInfo.id,
            name: trackInfo.name,
            spotify_id: trackInfo.spotify_id,
            preview_url: trackInfo.preview_url,
            number_id: trackInfo.number_id
        };

        // Nested loop to create edges between all artists in the same track
        for (let i = 0; i < artists.length; i++) {
            for (let j = i + 1; j < artists.length; j++) {
                const artistName1 = artistsData.find((artist:any) => artist.id === artists[i])?.name;
                const artistName2 = artistsData.find((artist:any) => artist.id === artists[j])?.name;
                if (artistName1 && artistName2) {
                    graph.addEdge(artistName1, artistName2, trackDetails);
                }
            }
        }
    });
}

export async function deserialize(): Promise<Graph> {
    const filePath = path.join(__dirname, 'graph.json');

    const data = await readFileAsJson(filePath);
    const graph = new Graph();

    data.forEach((nodeData: { name: string; connections: Connection[] }) => {
        graph.addNode(nodeData.name);
    });

    data.forEach((nodeData: { name: string; connections: Connection[] }) => {
        nodeData.connections.forEach(connection => {
            connection.tracks.forEach((track: TrackInfo) => {
                graph.addEdge(nodeData.name, connection.artist, track);
            });
        });
    });
    return graph;
}

export const searchDegreeOfSeparation = async(artistName: string) => {
    const artistGraph = await deserialize();

    const deg = artistGraph?.breadthFirstTraversal(artistName); 

    return deg;
}