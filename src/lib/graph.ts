import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { Database } from "../types/database.types";
import {getArtistFromArtistTableById, getAllArtistFromArtistTable, getArtist_TrackFromtrack_artistView, getTrackFromTracksTable} from "./helper_functions";
import { writeFile, readFile } from "fs";

dotenv.config({ path: "../../.env" });

const [SUPABASE_URL, SUPABASE_KEY] = 
    ['SUPABASE_URL', 'SUPABASE_KEY'].map(key => {
        const value = process.env[key];
        if (!value) throw new Error(`${key} is not set`);
        return value;
    });

const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_KEY);

class ArtistNode {
    name: string;
    connections: ArtistNode[];

    constructor(name: string) {
        this.name = name;
        this.connections = [];
    }

    addAdjacent(node: ArtistNode) {
        if (!this.isAdjacent(node)) {
            this.connections.push(node);
        }
    }

    removeAdjacent(node: ArtistNode) {
        const index = this.connections.indexOf(node);
        if (index > -1) {
            this.connections.splice(index, 1);
            return node;
        }
    }

    getAdjacents() {
        return this.connections;
    }

    isAdjacent(node: ArtistNode) {
        return this.connections.indexOf(node) > -1;
    }
}

export class Graph {
    nodes: Map<string, ArtistNode>;

    constructor() {
        this.nodes = new Map();
    }

    addNode(name: string) {
        if (!this.nodes.has(name)) {
            const vertex = new ArtistNode(name);
            this.nodes.set(name, vertex);
            return vertex;
        } else {
            return this.nodes.get(name);
        }
    }

    removeVertex(name: string) {
        const vertex = this.nodes.get(name);
        if (vertex) {
            for (const node of this.nodes.values()) {
                node.removeAdjacent(vertex);
            }
        }
        this.nodes.delete(name);
    }

    addEdge(sourceName: string, destinationName: string) {
        const sourceNode = this.addNode(sourceName);
        const destinationNode = this.addNode(destinationName);

        if (sourceNode && destinationNode) {
            sourceNode.addAdjacent(destinationNode);
            destinationNode.addAdjacent(sourceNode);
        }
    }

    removeEdge(sourceName: string, destinationName: string) {
        const sourceNode = this.nodes.get(sourceName);
        const destinationNode = this.nodes.get(destinationName);

        if (sourceNode && destinationNode) {
            sourceNode.removeAdjacent(destinationNode);
            destinationNode.removeAdjacent(sourceNode);
        }
    }

    getNode(name: string) : ArtistNode | undefined{
        return this.nodes.get(name);
    }

    breadthFirstTraversal(endName: string): number | undefined {
        const start = this.getNode("Kendrick Lamar");
        const end = this.getNode(endName);

        if (!start || !end) {
            throw new Error('Start or end node not found');
        }

        if (start === end) {
            return 0;
        }
    
        const visited = new Set<ArtistNode>(); // Tracks visited nodes
        const queue: Array<{node: ArtistNode; depth: number}> = []; // Queue to manage nodes and their depth
    
        queue.push({ node: start, depth: 0 }); // Initialize queue with the start node
        visited.add(start); // Mark start node as visited
    
        while (queue.length > 0) {
            const { node, depth } = queue.shift()!; // Get the next node and its depth
            console.log(`Visiting ${node.name} at depth ${depth}`);
            
            // Visit all adjacent nodes
            for (const adjacent of node.getAdjacents()) {
                if (adjacent === end) {
                    // If the end node is found, return the current depth + 1
                    return depth + 1;
                }
    
                if (!visited.has(adjacent)) {
                    // If this node hasn't been visited, add it to the queue
                    queue.push({ node: adjacent, depth: depth + 1 });
                    visited.add(adjacent); // Mark this node as visited
                }
            }
        }
        // If the end node is not found, return undefined or -1 based on your preference
        return undefined;
    }
    
    visualize() {
        for (let [key, value] of this.nodes) {
            const adjacents = value.getAdjacents().map(node => node.name).join(', ');
            console.log(`${key} --> [ ${adjacents} ]`);
        }
    }

    serialize(){
        const nodes = [];
        for(let [name, node] of this.nodes){
            nodes.push({
                name: name,
                connections: node.getAdjacents().map(adjacent => adjacent.name)
            });
        }
        return JSON.stringify(nodes, null, 2);
    }
}

// function generatePairs(artistIds: number[] | null ): [number, number][] {
//     let pairs: [number, number][] = [];

//     artistIds?.forEach((id1, index1) => {
//         artistIds?.slice(index1 + 1).forEach((id2) => {
//             pairs.push([id1, id2]);
//         });
//     });

//     return pairs;
// }

// const graph = new Graph();
// const artistsData = await getAllArtistFromArtistTable();
// const artistTrackView = await getArtist_TrackFromtrack_artistView();

// if(artistsData === undefined || artistTrackView === undefined){
//     throw new Error("No data found");
// } else{
//     for(const artistData of artistsData){
//         if(artistData.name !== null){
//             graph.addNode(artistData.name);
//         }
//     }

//     for (const artistTrack of artistTrackView) {
//         console.log("the length of artistTrack.artist_ids is: ", artistTrack.artist_ids?.length);
//         console.log(artistTrack.artist_ids);

//        if (artistTrack?.artist_ids !== null) {
//             const pairs = generatePairs(artistTrack.artist_ids);
//             for (const pair of pairs) {
//                 const artist1 = await getArtistFromArtistTableById(pair[0]);
//                 const artist2 = await getArtistFromArtistTableById(pair[1]);
//                 if (artist1 !== undefined && artist2 !== undefined) {
//                     graph.addEdge(artist1[0].name, artist2[0]?.name);
//                 }
//             }
//         }
//     }
// }

// const serialized_graph = graph.serialize();

// writeFile("graph.json", serialized_graph, "utf-8", (err) => {
//     if(err){
//         console.log(err);
//     } else{
//         console.log("The file has been saved");
//     }
// });

