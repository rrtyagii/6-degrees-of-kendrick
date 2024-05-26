import * as dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response } from "express";
import cors from "cors";
import { searchDegreeOfSeparation } from "./src/lib/graph";
import { getRandomArtistName, postAutoComplete } from "./src/lib/helper_functions";
import path from "path";

const app = express();
const port = process.env.PORT || ""; 
app.use(cors());
app.use(express.json());

app.get('/', (req: Request, res: Response) => {
    res.sendFile(path.resolve(__dirname, './src/index.html'));
});

app.post('/api/search', async (req: Request, res: Response) => {
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

app.post('/api/random', async (req: Request, res: Response) => {
    try {
        // Assuming you have a function that can fetch random artist names
        const randomArtistName = await getRandomArtistName();


        if (randomArtistName) {
            const degreeObject = await searchDegreeOfSeparation(randomArtistName.name);

            res.status(200).send(degreeObject);
        } else {
            res.status(404).send();
        }
    } catch (error : any) {
        console.error("Error in /random", error);
        res.status(500).send({ error: error.message });
    }
});

app.get('/api/autocomplete', async (req: Request, res: Response) => {
    const searchQuery = req.query.term; 
    if(!searchQuery){
        res.json([]);
    }

    try{
        const autoCompleteData = await postAutoComplete(searchQuery);
        const names = autoCompleteData.map(artist => artist.name);
        res.json(names)
    } catch (error) {
        console.error('Error fetching autocomplete data:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.listen(port, () => {
    console.log(`Server started at http://localhost:${port}`);
});