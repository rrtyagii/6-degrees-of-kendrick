import dotenv from "dotenv";
dotenv.config();

import express, { Request, Response } from "express";
import cors from "cors";
import { searchDegreeOfSeparation } from "@/lib/graph";
import { readFileAsJson } from "@/lib/helper_functions";

const app = express();
const port = 5050; 
app.use(cors());
app.use(express.json());

app.get('/', (req: Request, res: Response) => {
    res.send('Hello World!');
});

app.post('/search', async (req: Request, res: Response) => {
    try{
        const body = req.body;
        const artistName = body.artist;
        const degreeObject = await searchDegreeOfSeparation(artistName);
        if (degreeObject) {
            res.status(200).send(degreeObject);
        } else {
            res.status(404).send({error: "Data not found or error in processing request"});
        }
    } catch(error: any){
        res.status(500).send({error: error.message});
    }
});

app.post('/random', async (req: Request, res: Response) => {
    try {
        // Assuming you have a function that can fetch random artist names
        //const randomArtistName = await getRandomArtistName();
        // if (randomArtistName) {
        //     const degreeObject = await searchDegreeOfSeparation(randomArtistName);
        //     res.status(200).send(degreeObject);
        // } else {
        //     throw new Error("Failed to fetch random artist");
        // }
    } catch (error : any) {
        res.status(500).send({ error: error.message });
    }
});


app.listen(port, () => {
    console.log(`Server started at http://localhost:${port}`);
});