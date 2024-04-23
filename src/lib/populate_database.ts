import dotenv from "dotenv";
import { SpotifyApi } from "@spotify/web-api-ts-sdk";

import {readFileAsJson, insertIntoArtistTable, getArtistFromArtistTable, insertIntoTracksTable, getTrackFromTracksTable, insertIntoArtist_TrackTable, getAllArtistFromArtistTable, appendOrCreateJSONFile, getAllTracksFromTracksTable, getArtist_TrackFromArtist_TrackTable } from "./helper_functions";
import { writeFile } from "fs/promises";

dotenv.config({ path: "../../.env" });

const [SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET] = 
    ['CLIENT_ID', 'CLIENT_SECRET'].map(key => {
        const value = process.env[key];
        if (!value) throw new Error(`${key} is not set`);
        return value;
    }
);

const spotifyApi = SpotifyApi.withClientCredentials(SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET); 
const CHUNK_SIZE = 50;


async function processArtists () {
    const artists = await readFileAsJson("../mocks/artists_to_add.json");
    // const ids_array = artists.map((artist:any) => artist.spotify_id);

    for(let i=0; i<artists.length; i+=CHUNK_SIZE){
        const chunk = artists.slice(i, i+CHUNK_SIZE);
        
        const response:any = await spotifyApi.artists.get(chunk);
    
        for( const artist of response){
            await insertIntoArtistTable(artist.name, artist.id, artist.popularity);
        }

        await new Promise(resolve => setTimeout(resolve, 2000));
        console.log(`chunk finished: ${[i, i+CHUNK_SIZE]}`);
    }
}

async function processTracks() {
    const tracks = await readFileAsJson("../mocks/tracks_to_add.json");
    //const trackIds = tracks.map((track:any) => track.spotify_id);
    console.log("tracks length: \n", tracks.length);
    console.log('tracks: \n', tracks);

    for (let i = 0; i < tracks.length; i += CHUNK_SIZE) {
        const chunk:string[] = tracks.slice(i, i + CHUNK_SIZE);

        const response = await spotifyApi.tracks.get(chunk, "US");
  
        for (let track of response) {
            await insertIntoTracksTable(track.name, track.preview_url || "", track.id);
  
            for (const artist of track.artists) {
                const artistFromDb = await getArtistFromArtistTable(artist.id);
                const artistId = artistFromDb? artistFromDb[0].id : "null";
  
                const trackFromDb = await getTrackFromTracksTable(track.id);
                const trackId = trackFromDb? trackFromDb[0].id : "null";
  
               if(trackId !== "null" && artistId !== "null"){
                   await insertIntoArtist_TrackTable(artistId, trackId);
               }
            }
        }
  
        await new Promise(resolve => setTimeout(resolve, 1500));
        console.log(`Chunk finished: ${[i, i + CHUNK_SIZE]}`);
    }
}

async function main(){
    //await processArtists();
    await processTracks();
}

main()