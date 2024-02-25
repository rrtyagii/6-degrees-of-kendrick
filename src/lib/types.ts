export type ArtistDataType = {
    spotify_id: string,
    name: string,
};

export type AlbumDataType = {
    id: number,
    artist: ArtistDataType,
    total_tracks: number,
    spotify_id: string,
    album_type: string,
    album_group: string,
};

export type TrackDataType={
    spotify_id: string,
    name: string,
    preview_url: string, 
    artist_track_data?: ArtistDataType,
};

export type getAlbumTrackParams ={
    access_token: string,
    album_id: string,
    market?: string,
    limit?: number,
    offset?: number
};

export type getAristAlbumParams = {
    access_token: string,
    artist_spotify_id: string,
    include_groups: string,
    limit?: number,
    offset?: number
};

export type authorizeSpotify ={
    token_type: string,
    access_token: string,
    expires_in: number
};