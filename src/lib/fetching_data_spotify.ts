import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

import {SpotifyApi, Track } from "@spotify/web-api-ts-sdk";
import {readFileAsJson, getTop1000Artists} from "./helper_functions";

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const [SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET] = 
    ['CLIENT_ID', 'CLIENT_SECRET'].map(key => {
        const value = process.env[key];
        if (!value) throw new Error(`${key} is not set in ${__filename}`);
        return value;
});

const spotifyApi = SpotifyApi.withClientCredentials(SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET); 

const LIMIT = 50;
const KENDRICKALBUMITEMS = 332;
let OFFSET = 0;

// let currentArtists = await getAllArtistFromArtistTable();
// let currentTracks = await getAllTracksFromTracksTable();
// let currentArtist_Track = await getArtist_TrackFromArtist_TrackTable();


// await fs.promises.writeFile("current_artists.json", JSON.stringify(currentArtists, null, 2));
// await fs.promises.writeFile("current_tracks.json", JSON.stringify(currentTracks, null, 2));
// await fs.promises.writeFile("current_artist_tracks.json", JSON.stringify(currentArtist_Track, null, 2));

//const tracks_to_add = await readFileAsJson("tracks_to_add.json");
const currentArtists = await readFileAsJson("../mocks/current_artists.json");
const currentArtistSet = new Set();
currentArtists.forEach((artist:any) => {
    currentArtistSet.add(artist.spotify_id);
});

const currentTracks = await readFileAsJson("../mocks/current_tracks.json");
const currentTrackSet = new Set();
currentTracks.forEach((track:any) => {
    currentTrackSet.add(track.spotify_id);
});

//methods to check artist and track cache
function isArtistInCache(artistId: string): boolean {
    return currentArtistSet.has(artistId);
}

function isTrackInCache(trackId: string): boolean {
    return currentTrackSet.has(trackId);
}

function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const getAllKendrickAlbums = async () => {
    const includeGroups = "album,single,appears_on,compilation";
    let albums_to_fetch_tracks: string[] = [];

    for (let i = 0; i < 332; i += LIMIT) {
        const artistAlbums = await spotifyApi.artists.albums("2YZyLoL8N0Wb9xBt1NhZWg", includeGroups, "US", LIMIT, OFFSET);

        for(let album of artistAlbums.items){

            if(album.id !== "0LyfQWJT6nXafLPZqxe9Of" && (isTrackInCache(album.id) === false) && 
            (albums_to_fetch_tracks.some((id) => id === album.id) === false))
            {
                albums_to_fetch_tracks.push(album.id);
            }
        }
        OFFSET += LIMIT;
    }
    await fs.promises.writeFile("../mocks/albums_to_fetch_tracks_of.json", JSON.stringify(albums_to_fetch_tracks, null, 2));
};

const getArtistAlbums = async (artistAlbumId:string) => {
    const includeGroups = "album,single,appears_on,compilation";
    let albums_to_fetch_tracks: string[] = [];

    let artistAlbumsTotal = (await spotifyApi.artists.albums(artistAlbumId, includeGroups, "US", LIMIT, 0)).total;

    for (let i = 0; i < artistAlbumsTotal; i += LIMIT) {
        const artistAlbums = await spotifyApi.artists.albums(artistAlbumId, includeGroups, "US", LIMIT, i);

        for(let album of artistAlbums.items){

            if(album.id !== "0LyfQWJT6nXafLPZqxe9Of" && (isTrackInCache(album.id) === false) && 
            (albums_to_fetch_tracks.some((id) => id === album.id) === false)){
                albums_to_fetch_tracks.push(album.id);
            }

        }

        await delay(500);
    }
    return albums_to_fetch_tracks;
    // console.log("albums_to_fetch_tracks", albums_to_fetch_tracks);
    // await fs.promises.writeFile("albums_to_fetch_tracks_of.json", JSON.stringify(albums_to_fetch_tracks, null, 2));
};

const getTracksOfAlbums = async () => {
    const albumIds = await readFileAsJson("../mocks/albums_to_fetch_tracks_of.json");
    let tracks_to_add: string[] = [];
    const LIMIT = 20;

    for(let i=0; i<albumIds.length; i+=LIMIT){
        const chunk:string[] = albumIds.slice(i, i+LIMIT);
        const albumTracks = await spotifyApi.albums.get(chunk, "US");
        
        for(let album of albumTracks){
            for(let track of album.tracks.items){
                if(isTrackInCache(track.id) === false && tracks_to_add.some((id) => id === track.id) === false){
                    tracks_to_add.push(track.id);
                }
            }
        }

    }
    await fs.promises.writeFile("../mocks/tracks_to_add.json", JSON.stringify(tracks_to_add, null, 2));
};


const getTracks = async ():Promise<void> => {
    const MAX_IDs = 50;
    let artists_to_add: string[] = [];
    let tracks_to_add: string[] = [];

    for(let i=0; i<tracks_to_add.length; i+=MAX_IDs){
        const chunk:string[] = tracks_to_add.slice(i, i+MAX_IDs);

        const tracks:Track[] = await spotifyApi.tracks.get(chunk, "US");

        for(let track of tracks){

            let artists = track.artists;

            for(let artist of artists){
                if(isArtistInCache(artist.id) === false && artists_to_add.some((id) => id === artist.id) === false && artist.id !== "0LyfQWJT6nXafLPZqxe9Of"){
                    artists_to_add.push(artist.id);
                }
            }

            if(isTrackInCache(track.id) === false && tracks_to_add.some((id) => id === track.id) === false){
                tracks_to_add.push(track.id);
            }
        }
    }
    await fs.promises.writeFile("../mocks/artists_to_add.json", JSON.stringify(artists_to_add, null, 2));
    await fs.promises.writeFile("../mocks/tracks_to_add.json", JSON.stringify(tracks_to_add, null, 2));
};

//get all_albums of 1000 most popular artists in my current database.
// get the tracks of each album and get the artists, then update the remote database and the local cache (Set and json file in my case).

async function getTop200ArtistsSpotifyIds(): Promise<void> {
    const top1000Artists = await getTop1000Artists().then(async (response) => {
        let topArtists: string[] = []; // Define the type and initialize as an empty array

        if (response === undefined) {
            console.log("No data found");
        } else {
            for (let artist of response) {
                console.log("current artist")
                if (artist.spotify_id != "2YZyLoL8N0Wb9xBt1NhZWg" && artist.spotify_id) {
                    topArtists.push(artist.spotify_id);
                }
            }
        }
        return topArtists;
    }).catch((error) => {
        console.error("Error in top1000Artists\n", error);
    });

    await fs.promises.writeFile("Top_200_artists_spotifyIds.json", JSON.stringify(top1000Artists, null, 2));

}

const fetchArtistAlbums = async (): Promise<void> => {
    let top1000ArtistsId = await readFileAsJson("../mocks/Top_200_artists_spotifyIds.json");
    let artistAlbums: string[] = [];

    for (let artistId of top1000ArtistsId) {
        console.log("current artist: ", artistId);
        const albums = await getArtistAlbums(artistId);
        artistAlbums.push(...albums);
        await delay(600);
    }

    await fs.promises.writeFile("../mocks/top200_artist_albums_to_fetch_tracks_of.json", JSON.stringify(artistAlbums, null, 2));
};

console.log("fetching data from spotify");