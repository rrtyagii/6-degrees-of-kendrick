import dotenv from "dotenv";
import { Page, SimplifiedAlbum, SimplifiedArtist, SpotifyApi, Track } from "@spotify/web-api-ts-sdk";
import {readFileAsJson, getAllArtistFromArtistTable, getAllTracksFromTracksTable, getArtist_TrackFromArtist_TrackTable} from "../lib/helper_functions";
import fs, { read } from "fs";

dotenv.config({ path: "../../.env" });

const [SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET] = 
    ['CLIENT_ID', 'CLIENT_SECRET'].map(key => {
        const value = process.env[key];
        if (!value) throw new Error(`${key} is not set`);
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

const currentArtists = await readFileAsJson("current_artists.json");
const currentArtistSet = new Set();
currentArtists.forEach((artist:any) => {
    currentArtistSet.add(artist.spotify_id);
});

const currentTracks = await readFileAsJson("current_tracks.json");
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

//methods to update artist and track cache
function updateArtistCache(artist: any) {
    currentArtistSet.add(artist.id);
    console.log(`Artist added to cache: ${artist.name}`);
}

function updateTrackCache(track: any) {
    currentTrackSet.add(track.id);
    console.log(`Track added to cache: ${track.name}`);
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

    console.log("albums_to_fetch_tracks", albums_to_fetch_tracks);
    await fs.promises.writeFile("albums_to_fetch_tracks_of.json", JSON.stringify(albums_to_fetch_tracks, null, 2));
};

const getTracksOfAlbums = async () => {
    const albumIds = await readFileAsJson("albums_to_fetch_tracks_of.json");
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
    await fs.promises.writeFile("tracks_to_add.json", JSON.stringify(tracks_to_add, null, 2));
};

const tracks_to_add = await readFileAsJson("tracks_to_add.json");

const getTracks = async () => {
    const MAX_IDs = 50;
    let artists_to_add: string[] = [];

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
        }
    }
    await fs.promises.writeFile("artists_to_add.json", JSON.stringify(artists_to_add, null, 2));
};


//get all_albums of 1000 most popular artists in my current database.
// get the tracks of each album and get the artists, then update the remote database and the local cache (Set and json file in my case).