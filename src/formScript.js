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
        if(res.ok) {
            return res.json();
        } else {
            throw new Error('Failed to fetch random artist');
        }
    })
    .then((data) => {
        console.log("Search artist data:", data);
        if (data) {
            displayDegreeOfSeparation(data, false, artistName);
        }
    })
    .catch(err => console.error(err));
});

document.getElementById('random-button').addEventListener('click', function(e) {
    e.preventDefault();

    fetch("http://localhost:5050/random", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    }).then((res) => {
        if(res.ok) {
            return res.json();
        } else {
            throw new Error('Failed to fetch random artist');
        }
    })
    .then((data) => {
        console.log("Random artist data:", data);
        if (data) {
            displayDegreeOfSeparation(data, true);
        }
    })
    .catch(err => {
        console.error('Fetch Error:', err);
        alert('Failed to fetch data for a random artist');
    });
});

document.getElementById('artist').addEventListener('input', function(){
    const inputValue = this.value;
    const resultList = document.getElementById('autocomplete-results');

    if (inputValue.length < 2 ) {
        resultList.innerHTML = '';
        resultList.classList.add('hidden');
        return;
    }

    fetch(`http://localhost:5050/autocomplete?term=${inputValue}`)
    .then((res) => {
        return res.json();
    })
    .then((names)=>{
        resultList.innerHTML = '';

        if (names.length > 0) {
            resultList.classList.remove('hidden');
        } else {
            resultList.classList.add('hidden');
        }

        names.forEach((name) => {
            let resultItem = document.createElement('div');
            resultItem.textContent = name;
            resultItem.className = 'p-2 hover:bg-neutral-900 cursor-pointer';
            resultItem.addEventListener('click', () => {
                document.getElementById('artist').value = name;
                resultList.innerHTML = '';
                resultList.classList.add('hidden');
            });
            resultList.appendChild(resultItem);
        });
    })
    .catch(error => console.error('Autocomplete error:', error));
});

document.addEventListener('click', function (e) {
    if (e.target.id !== 'artist') {
        document.getElementById('autocomplete-results').classList.add('hidden');
    }
});

function displayDegreeOfSeparation(data, isRandom = false, artistName) {
    let trackId = '';
    const path = data.path;

    const degreeOfSeparation = document.getElementById('degree-of-separation');
    const searchedArtistName = document.getElementById('searched-artist-name');

    degreeOfSeparation.innerHTML = data.degree;

    if(isRandom) {
        const path = data.path;
        artist = path[path.length - 1].artist;
        searchedArtistName.innerHTML = artist;
    } else {
        searchedArtistName.innerHTML = artistName;
    }

    const track = document.getElementById("tracks");
    track.innerHTML = '';

    path.forEach(artist => {
        trackId = artist.track.spotifyId;
        const spotifyPreview = spotifyPreviewBox(trackId);
        track.appendChild(spotifyPreview);
    });

    document.getElementById('artist-result').classList.remove('hidden');
}


const spotifyPreviewBox = (spotifyTrackId) => {
    const spotifyPreviewPlayer = `<iframe style="border-radius:12px" src="https://open.spotify.com/embed/track/${spotifyTrackId}?utm_source=generator&theme=0" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy">
    </iframe>`;
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = spotifyPreviewPlayer;
    const node = tempDiv.firstChild;
    console.log('spotifyPreviewBox is returning:', node);
    return node;
};