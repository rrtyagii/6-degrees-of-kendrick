export type ArtistDataType = {
    id?: number,
    name: string,
    spotify_id: string,
    popularity?: number,
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
    id: number,
    name: string,
    AlbumId: AlbumDataType,
    AristId: ArtistDataType,
    preview_url: string,
    spotify_id: string,
    artist_track_data: ArtistTrackDataType,
};

export type ArtistTrackDataType={
    id: number,
    artist_id : ArtistDataType,
    track_id : TrackDataType,
    role: string,
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