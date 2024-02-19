//node --env-file=../../.env spotify.js
import { getAlbumTrackParams, getAristAlbumParams } from "./types";

const fs = require("fs");
const KENDRICK_LAMAR_SPOTIFY_ID = "2YZyLoL8N0Wb9xBt1NhZWg";
const ALBUM_ID = "";

const INCLUDE_GROUPS = ["album", "single", "appears_on", "compilation"];
const LIMIT = 50;
const OFFSET = 0;

type authorizeSpotify ={
    token_type: string,
    access_token: string,
    expires_in: number
};

async function appendOrCreateJSONFile(filename: string, data: any){
    try{    
        const currentFileData = await fs.promises.readFile(filename, "utf-8");
        const existingData = JSON.parse(currentFileData);

        const existingIds = new Set(existingData.map((item: any) => item.id));
        const uniqueNewData = data.filter((item:any) => !existingIds.has(item.id));

        if (uniqueNewData.length === 0) {
            console.log('No unique data to append. No changes made to the file.');
            return;
        }

        const combinedData = [...existingData, ...uniqueNewData];
        const combinedDataJson = JSON.stringify(combinedData, null, 2);

        await fs.promises.writeFile(filename, combinedDataJson);

        console.log("File updated successfully");
        
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

async function authorizeSpotify(): Promise<authorizeSpotify | undefined> {
    const response = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
        credentials: 'include',
        body: `grant_type=client_credentials&client_id=${process.env.CLIENT_ID}&client_secret=${process.env.CLIENT_SECRET}`
    });

    try {
        if (response.ok) {
            const data = await response.json();
            return data;
        } else {
            console.log("process.env.CLIENT_ID ", process.env.CLIENT_ID);
            throw new Error("Response not OK");
        }
    } catch (e) {
        console.error("error\n", e);
    }
    return;
}

const getArtistsAlbums = async ({ access_token, artist_spotify_id, include_groups, limit=50, offset=0 } : getAristAlbumParams ) => {
    const GET_ARTIST_ALBUM_ENDPOINT = `https://api.spotify.com/v1/artists/${artist_spotify_id}/albums?include_groups=${include_groups}&market=US&limit=${limit}&offset=${offset}`;

    const response = await fetch(GET_ARTIST_ALBUM_ENDPOINT, {
        method: "GET",
        headers: {"Authorization": `Bearer ${access_token}`}
    });

    try{
        if(response.ok){
            const data = await response.json();
            return data;
        } else{
            throw new Error("Response not OK");
        }
    } catch(e){
        console.error("error\n", e);
        return e;
    }
};

const getAlbumTracks = async ( {access_token, album_id, market='US', limit=50, offset=0}: getAlbumTrackParams ) =>{
    const GET_ALBUM_TRACKS_ENDPOINT = `https://api.spotify.com/v1/albums/${album_id}/tracks?market=${market}&limit=${limit}&offset=${offset}`;

    const response = await fetch(GET_ALBUM_TRACKS_ENDPOINT, {
        method: "GET",
        headers: {"Authorization": `Bearer ${access_token}`}
    });

    try{
        if(response.ok){
            const data = await response.json();
            return data;
        } else{
            throw new Error("Response not OK");
        }
    } catch(e){
        console.error("error\n", e);
        return e;
    }
};

async function main() {
    const authorizationResult = await authorizeSpotify();

    let getArtistAlbum;

    if(!authorizationResult){
        console.error("Authorization failed");
        return;
    } else{
        getArtistAlbum = await getArtistsAlbums({
            access_token: authorizationResult.access_token,
            artist_spotify_id: KENDRICK_LAMAR_SPOTIFY_ID,
            include_groups: INCLUDE_GROUPS[0],
            limit: LIMIT,
            offset: OFFSET,
        });
    }
    const items = getArtistAlbum["items"];
    let id = 0;

    const albumData = [];

    for(let i=0; i<items.length; i++){
        for(let j=0; j<items[i]['artists'].length ;j++){
            const album_object = {
                "id":`${++id}`,
                "name":items[i]['name'],
                "artist" : {
                    'spotify_id' : items[i]['artists'][j]['id'],
                    'name' : items[i]['artists'][j]['name']
                },
                "spotify_id": items[i]['id'],
                "total_tracks": items[i]['total_tracks'],
                "album_group":items[i]['album_group'],
                "album_type":items[i]['album_type'],
            }
            albumData.push((album_object));
            await appendOrCreateJSONFile("albumData.json", albumData);
        }
    };
}

main();