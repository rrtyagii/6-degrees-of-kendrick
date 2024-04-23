import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { Database } from "../types/database.types";
import fs from "fs";

dotenv.config({ path: "../../.env" });

const [SUPABASE_URL, SUPABASE_KEY] = 
    ['SUPABASE_URL', 'SUPABASE_KEY'].map(key => {
        const value = process.env[key];
        if (!value) throw new Error(`${key} is not set`);
        return value;
    }
);

const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_KEY);

export const readFileAsJson = async (filename:string) => {
    const data = await fs.promises.readFile(filename, "utf-8");
    return JSON.parse(data);
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