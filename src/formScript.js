document.getElementById('search-form').addEventListener('submit', function(e) {
    e.preventDefault();

    const artistName = document.getElementById('artist').value;
    fetch("http://localhost:5050/search", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ artist: artistName })
    }).then((res) => {
        return res.json()
    })
    .then((data) => {
        console.log("data from script", data);
        let trackId ='';
        const path = data.path;

        const degreeOfSeparation = document.getElementById('degree-of-separation');
        const searchedArtistName = document.getElementById('searched-artist-name');

        degreeOfSeparation.innerHTML = data.degree;
        searchedArtistName.innerHTML = artistName;

        const track = document.getElementById("tracks");

        path.forEach(artist => {
            trackId = artist.track.spotifyId;
            console.log('trackId:', trackId);
            const spotifyPreview = spotifyPreviewBox(trackId);
            console.log('Appending spotifyPreviewPlayer to track');
            track.appendChild(spotifyPreview);
        });

        // Remove the 'hidden' class from the 'artist-result' section
        document.getElementById('artist-result').classList.remove('hidden');
    })
    .catch(err => console.error(err));
});

const spotifyPreviewBox = (spotifyTrackId) => {
    const spotifyPreviewPlayer = `<iframe style="border-radius:12px" src="https://open.spotify.com/embed/track/${spotifyTrackId}?utm_source=generator&theme=0" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy">
    </iframe>`;
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = spotifyPreviewPlayer;
    const node = tempDiv.firstChild;
    console.log('spotifyPreviewBox is returning:', node);
    return node;
};