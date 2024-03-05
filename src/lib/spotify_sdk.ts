import dotenv from "dotenv";
import { SpotifyApi } from "@spotify/web-api-ts-sdk";
import fs from "fs";
import { createClient } from "@supabase/supabase-js";
import { Database } from "./database.types";

dotenv.config({ path: "../../.env" });

const [SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SUPABASE_URL, SUPABASE_KEY] = 
    ['CLIENT_ID', 'CLIENT_SECRET', 'SUPABASE_URL', 'SUPABASE_KEY'].map(key => {
        const value = process.env[key];
        if (!value) throw new Error(`${key} is not set`);
        return value;
    });

const spotifyApi = SpotifyApi.withClientCredentials(SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET); 
const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_KEY);
const CHUNK_SIZE = 50;

const readFileAsJson = async (filename:string) => {
    const data = await fs.promises.readFile(filename, "utf-8");
    return JSON.parse(data);
};

const appendOrCreateJSONFile = async(filename: string, data: any) => {
    try{    
        const existingData = await readFileAsJson(filename);
        const existingIds = new Set(existingData.map((item: any) => item.id));
        const uniqueNewData = data.filter((item:any) => !existingIds.has(item.id));

        if (uniqueNewData.length === 0) {
            return;
        }

        const combinedData = [...existingData, ...uniqueNewData];
        const combinedDataJson = JSON.stringify(combinedData, null, 2);

        await fs.promises.writeFile(filename, combinedDataJson);

    } catch (error: any){
        if(error.code === "ENOENT"){
            console.log("File not found");
            const combinedDataJson = JSON.stringify(data, null, 2);
            await fs.promises.writeFile(filename, combinedDataJson);
            console.log("File created successfully");
        } else{
            console.error('An error occurred:', error);
        }
    }
}

const insertIntoArtistTable = async(name:string, spotify_id:string, popularity:number) => {
    const {data, error} = await supabase.from("Artist").insert([{
        name: name,
        spotify_id: spotify_id,
        popularity: popularity,
    }]);

    if(error){
        console.error("error insertIntoArtistTable\n", error);
    }

    if(data){
        console.log("inserted successfully");
    }
};

const getArtistFromArtistTable = async(spotify_id:string) => {
    const {data, error} = await supabase.from("Artist").select().eq("spotify_id", spotify_id);

    if(error){
        console.error("error getArtistFromArtistTable\n", error);
    }

    if(data){
        return data;
    }
}

const insertIntoTracksTable = async(
    name:string,
    preview_url:string,
    spotify_id:string,
) =>{
    const {data, error} = await supabase.from("Tracks").insert([{
        name: name,
        preview_url: preview_url,
        spotify_id: spotify_id,
    }]);

    if(error){
        console.error("error insertIntoTracksTable\n", error);
    }
    if(data){
        console.log("inserted into Track successfully");
    }
}

const getTrackFromTracksTable = async(spotify_id:string) => {
    const {data, error} = await supabase.from("Tracks").select().eq("spotify_id", spotify_id);

    if(error){
        console.error("error getTrackFromTracksTable\n", error);
    }

    if(data){
        return data;
    }
}

const insertIntoArtist_TrackTable = async(
    artist_id:any,
    track_id:any,
) =>{
    const {data, error} = await supabase.from("Artist_Track").insert([{
        artist_id: artist_id,
        track_id: track_id,
    }]);

    if(error){
        console.error("error in insertIntoArtist_TrackTable\n", error);
    }
    if(data){
        console.log("inserted into Artist_Track successfully");
    }
}

async function processArtists () {
    const artists = await readFileAsJson("artist_database.json 01-55-02-501.json");
    const ids_array = artists.map((artist:any) => artist.spotify_id);

    for(let i=0; i<ids_array.length; i+=CHUNK_SIZE){
        const chunk = ids_array.slice(i, i+CHUNK_SIZE);
        const response:any = await spotifyApi.artists.get(chunk);

        for( const artist of response){
            await insertIntoArtistTable(artist.name, artist.id, artist.popularity);
        }

        await new Promise(resolve => setTimeout(resolve, 2000));
        console.log(`chunk finished: ${[i, i+CHUNK_SIZE]}`);
    }
}

async function processTracks() {
    const tracks = await readFileAsJson("track_database.json 01-55-02-561.json");
    const trackIds = tracks.map((track:any) => track.spotify_id);
  
    for (let i = 0; i < trackIds.length; i += CHUNK_SIZE) {
        const chunk = trackIds.slice(i, i + CHUNK_SIZE);
        const response:any = await spotifyApi.tracks.get(chunk, "US");
  
        for (const track of response) {
            const { name, id: trackSpotifyId, preview_url = "" } = track;
            await insertIntoTracksTable(name, preview_url, trackSpotifyId);
  
            for (const artist of track.artists) {
                const artistFromDb = await getArtistFromArtistTable(artist.id);
                const artistId = artistFromDb? artistFromDb[0].id : "null";
  
                const trackFromDb = await getTrackFromTracksTable(trackSpotifyId);
                const trackId = trackFromDb? trackFromDb[0].id : "null";
  
                await insertIntoArtist_TrackTable(artistId, trackId);
            }
        }
  
        await new Promise(resolve => setTimeout(resolve, 1500));
        console.log(`Chunk finished: ${[i, i + CHUNK_SIZE]}`);
    }
}

async function main(){
    await processArtists();
    await processTracks();
}