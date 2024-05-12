import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

import { Database } from "../types/database.types";
import { SupabaseClient, createClient } from "@supabase/supabase-js";

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

let supabase : SupabaseClient<Database>; 
const [SUPABASE_URL, SUPABASE_KEY] = 
    ['SUPABASE_URL', 'SUPABASE_KEY'].map(key => {
        const value = process.env[key];
        if (!value) throw new Error(`${key} is not set in ${__filename}`);
        return value;
    }
);

try{
    supabase = createClient<Database>(SUPABASE_URL, SUPABASE_KEY);
} catch(error : any){
    console.error("helper_function -> error in setting up supabase\n", error);
    throw error;
}

export const readFileAsJson = async (filename: string) => {
    try {
        const data = await fs.promises.readFile(filename, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error('An error occurred', error);
        throw error;
    }
};

export const appendOrCreateJSONFile = async(filename: string, data: any) => {
    try{    
        const existingData = await readFileAsJson(filename);
        if(existingData && Array.isArray(existingData)){
            const existingIds = new Set(existingData.map((item: any) => item.id));
            const uniqueNewData = data.filter((item:any) => !existingIds.has(item.id));
    
            if (uniqueNewData.length === 0) {
                return;
            }
    
            const combinedData = [...existingData, ...uniqueNewData];
            const combinedDataJson = JSON.stringify(combinedData, null, 2);
            await fs.promises.writeFile(filename, combinedDataJson);
        } else{
            await fs.promises.writeFile(filename, data);
        }
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

export const insertIntoArtistTable = async(name:string, spotify_id:string, popularity:number) => {
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

export const getArtistFromArtistTable = async(spotify_id:string) => {
    const {data, error} = await supabase.from("Artist").select().eq("spotify_id", spotify_id);

    if(error){
        console.error("error getArtistFromArtistTable\n", error);
    }

    if(data){
        return data;
    }
}

export const getArtistFromArtistTableById = async(id:any) => {
    const {data, error} = await supabase.from("Artist").select().eq("id", id);

    if(error){
        console.error("error getArtistFromArtistTable\n", error);
    }

    if(data){
        return data;
    }
}

export const getAllArtistFromArtistTable= async() => {
    const {data, error} = await supabase.from("Artist").select();

    if(error){
        console.error("error getArtistFromArtistTableById\n", error);
    }

    if(data){
        return data;
    }
}

export const getAllTracksFromTracksTable = async() => {
    const {data, error} = await supabase.from("Tracks").select();

    if(error){
        console.error("error getAllTracksFromTracksTable\n", error);
    }

    if(data){
        return data;
    }
}

export const getTrackFromTracksTable = async(spotify_id:string) => {
    const {data, error} = await supabase.from("Tracks").select().eq("spotify_id", spotify_id);
    
    if(error){
        console.error("error getTrackFromTracksTable\n", error);
    }
    
    if(data){
        return data;
    }
}

export const getTrackFromTracksTableById = async(id: any) => {
    const {data, error} = await supabase.from("Tracks").select().eq("id", id);
    
    if(error){
        console.error("error getTrackFromTracksTable\n", error);
    }
    
    if(data){
        return data;
    }
}

export const insertIntoTracksTable = async(
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

export const getArtist_TrackFromArtist_TrackTable = async() => {
    const {data, error} = await supabase.from("Artist_Track").select();

    if(error){
        console.error("error getArtist_TrackFromArtist_TrackTable\n", error);
    }

    if(data){
        return data;
    }
}

export const insertIntoArtist_TrackTable = async(
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

export const getArtist_TrackFromtrack_artistView = async() => {
    const {data, error} = await supabase.from("track_artists").select();

    if(error){
        console.error("error getArtist_TrackFromtrack_artistView\n", error);
    }

    if(data){
        return data;
    }
}

export const getTop1000Artists = async() => {
    const {data, error} = await supabase.from("Artist").select().order("popularity", {ascending: false}).range(0, 200);

    if(error){
        console.error("error getting Top 1000 Artists\n", error);
        throw error;
    }

    if(data){
        return data;
    }
}

export const getRandomArtistName = async() =>{
    try{
        const artists = await readFileAsJson(path.resolve(__dirname, '../mocks/current_artists.json'));
        const randomIndex = Math.floor(Math.random() * artists.length);
        return artists[randomIndex];
    }
    catch(error){
        console.error("error in getRandomArtistName\n", error);
        throw error;
    }
};

export const postAutoComplete = async (searchQuery: any) => {
    try {
        const { data, error } = await supabase
            .from("Artist")
            .select()
            .ilike("name", `%${searchQuery}%`);

        if (error) {
            throw new Error(`Error in postAutoComplete: ${error.message}`);
        }

        return data;
    } catch (error) {
        console.error("Error in postAutoComplete", error);
        throw error;
    }
};
