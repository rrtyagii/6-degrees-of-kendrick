import { getAlbumTrackParams, getAristAlbumParams, authorizeSpotify, TrackDataType, ArtistDataType} from "./types";

const fs = require("fs");
const KENDRICK_LAMAR_SPOTIFY_ID = "2YZyLoL8N0Wb9xBt1NhZWg";
const INCLUDE_GROUPS = ["album", "single", "appears_on", "compilation"];
const LIMIT = 50;
const OFFSET = 0;

async function appendOrCreateJSONFile(filename: string, data: any){
    try{    
        const currentFileData = await fs.promises.readFile(filename, "utf-8");
        const existingData = JSON.parse(currentFileData);

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

const getArtistAlbum = async ({ access_token, artist_spotify_id, include_groups, limit=50, offset=0 } : getAristAlbumParams ) => {
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
    let albums_json = [];
    let album_tracks: any = [];
    let track_number = 0;

    const album_data = await getArtistAlbum({
        access_token: "C11444UJZ",
        artist_spotify_id: KENDRICK_LAMAR_SPOTIFY_ID,
        include_groups: INCLUDE_GROUPS[0],
        limit: LIMIT,
        offset: OFFSET,
    });
    const albums = album_data["items"];

    for(let i=0; i<albums.length; i++){
        const current_object = {
            "id": i+1,
            "name": albums[i]['name'],
            "spotify_id": albums[i]['id'], 
        };
        albums_json.push(current_object);
    };

    for(let i=0; i<albums_json.length; i++){
        const tracks_list = await getAlbumTracks({
            access_token:"C11444UJZl",
            album_id: albums_json[i]['spotify_id'],
        });

        const tracks = tracks_list["items"];

        for(let j=0; j<tracks.length; j++){
            const current_object = {
                "id": ++track_number,
                "name": tracks[j]['name'],
                "spotify_id": tracks[j]['id'],
                "spotify_url": tracks[j]['external_urls'].spotify,
                "preview_url": tracks[j]['preview_url'],
            };
            album_tracks.push(current_object);
        }
    };
    await appendOrCreateJSONFile("kendricks_albums.json", albums_json);
    await appendOrCreateJSONFile("tracks_from_kendrick_alumbs.json", album_tracks);
}

main();