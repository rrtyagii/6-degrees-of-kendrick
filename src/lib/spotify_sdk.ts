import { SpotifyApi, TopTracksResult } from "@spotify/web-api-ts-sdk";
import fs from "fs";

const KENDRICK_LAMAR_SPOTIFY_ID = "2YZyLoL8N0Wb9xBt1NhZWg";
const INCLUDE_GROUPS = ["album", "single", "appears_on", "compilation"];
const LIMIT = 50;
const OFFSET = 0;

let ARTIST_DATABASE: any = [];
let TRACK_DATABASE: any = [];
let ARTIST_TRACK_JOIN_TABEL:any = [];
let artist_queue = [ KENDRICK_LAMAR_SPOTIFY_ID ];

async function appendOrCreateJSONFile(filename: string, data: any){
    try{    
        const currentFileData = await fs.promises.readFile(filename, "utf-8");
        const existingData = JSON.parse(currentFileData);

        const existingIds = new Set(existingData.map((item: any) => item.id));
        const uniqueNewData = data.filter((item:any) => !existingIds.has(item.id));

        if (uniqueNewData.length === 0) {
            //console.log('No unique data to append. No changes made to the file.');
            return;
        }

        const combinedData = [...existingData, ...uniqueNewData];
        const combinedDataJson = JSON.stringify(combinedData, null, 2);

        await fs.promises.writeFile(filename, combinedDataJson);

        //console.log("File updated successfully");

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

const spotifyApi = SpotifyApi.withClientCredentials(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET
);

let tryCount = 1000;
let artistCounter = 0;
let trackCounter = 0;

// Get artist songs
// if song has more than one artist:
//     add new artist to queue
//     update database

while(artist_queue.length > 0 && tryCount > 0){
    const artist_id : any = artist_queue.shift();
    const artist_top_tracks = await spotifyApi.artists.topTracks(artist_id, "US");
    const tracks = artist_top_tracks.tracks;

    for(let i = 0; i < tracks.length; i++){
        const track = tracks[i];
        const artists = track.artists;

        if(artists.length > 1){
            for(let j = 0; j < artists.length; j++){
                
                const artist = artists[j];
                
                const artist_object = {
                    name: artist.name,
                    spotify_id: artist.id,
                    track_with_kendrick_name: track.name,
                    track_with_kendrick_id: track.id,
                };

                if(!artist_queue.includes(artist.id) && artist_id !== artist.id){
                    artist_queue.push(artist.id);
                }
                
                if (!ARTIST_DATABASE.some((existingArtist: any) => existingArtist.spotify_id === artist_object.spotify_id)) {
                    ARTIST_DATABASE.push({
                        name: artist.name,
                        spotify_id: artist.id,
                        uri: artist.external_urls.spotify
                    });
                    artistCounter++;
                }

                if (artist.id !== KENDRICK_LAMAR_SPOTIFY_ID && !ARTIST_TRACK_JOIN_TABEL.some((existing:any) => existing.spotify_id === artist.id)) {
                    ARTIST_TRACK_JOIN_TABEL.push({
                        name: artist.name,
                        spotify_id: artist.id,
                        track_with_kendrick_name: track.name,
                        track_with_kendrick_id: track.id,
                    });
                }
            } 
        }

        if(!TRACK_DATABASE.some((existtingTrack:any) => existtingTrack.spotify_id === track.id)){
            TRACK_DATABASE.push({
                name: track.name,
                spotify_id: track.id,
                spotify_url: track.external_urls.spotify,
                preview_url: track.preview_url,
            });
            trackCounter++;
        };
    };
    console.log("tryCount: ", tryCount);
    tryCount--;
};

console.log(`Processed ${artistCounter} artists and ${trackCounter} tracks.`);

appendOrCreateJSONFile("artist_database.json", ARTIST_DATABASE);
appendOrCreateJSONFile("artist_track_join_table.json", ARTIST_TRACK_JOIN_TABEL);
appendOrCreateJSONFile("track_database.json", TRACK_DATABASE);