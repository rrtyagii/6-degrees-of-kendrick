import { Graph } from "./graph";
import { promisify } from 'util';
import fs from 'fs';

const readFile = promisify(fs.readFile);

async function deserializeGraph(filePath: string){
    const graph = new Graph();

    try {
        const data = await readFile(filePath, 'utf8');
        const nodesArray = JSON.parse(data);

        nodesArray.forEach((node:any)=> {
            graph.addNode(node.name);
        });

        nodesArray.forEach((node:any) => {
            node.connections.forEach((connectionName:any) => {
                graph.addEdge(node.name, connectionName);
            });
        });
    } catch (err) {
        console.log('Error reading the graph file:', err);
        return;
    }

    return graph;
};

const artistGraph = await deserializeGraph("graph.json");
const artist = "Coldplay";
const deg = artistGraph?.breadthFirstTraversal(artist); 
console.log(`degree of separation Kendrick and ${artist}: ${deg}`);