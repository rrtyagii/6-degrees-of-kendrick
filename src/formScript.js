'use strict';

const searchForm = document.getElementById('search-form');
const artistInput = document.getElementById('artist');
const searchButton = searchForm.querySelector('button[type="submit"]');
const randomButton = document.getElementById('random-button');
const resultList = document.getElementById('autocomplete-results');
const errorMessage = document.getElementById('search-error');
const result = document.getElementById('artist-result');
let autocompleteController;
let autocompleteTimer;
let autocompleteVersion = 0;
let searchController;

function hideSuggestions() {
    clearTimeout(autocompleteTimer);
    autocompleteController?.abort();
    autocompleteVersion += 1;
    resultList.replaceChildren();
    resultList.classList.add('hidden');
}

function setError(message = '') {
    errorMessage.textContent = message;
    errorMessage.classList.toggle('hidden', !message);
}

async function requestJson(url, options) {
    const response = await fetch(url, options);
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error || 'Unable to complete this request');
    return body;
}

async function searchArtist(url, artist) {
    searchController?.abort();
    const controller = new AbortController();
    searchController = controller;
    hideSuggestions();
    setError();
    result.classList.add('hidden');
    document.getElementById('tracks').replaceChildren();
    searchButton.disabled = true;
    randomButton.disabled = true;
    searchForm.setAttribute('aria-busy', 'true');
    try {
        const data = await requestJson(url, {
            method: 'POST',
            ...(artist ? {
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ artist }),
            } : {}),
            signal: controller.signal,
        });
        if (searchController !== controller) return;
        const name = data.path.at(-1)?.artist || 'Kendrick Lamar';
        artistInput.value = name;
        displayDegreeOfSeparation(data, name);
    } catch (error) {
        if (searchController === controller && error.name !== 'AbortError') setError(error.message);
    } finally {
        if (searchController === controller) {
            searchButton.disabled = false;
            randomButton.disabled = false;
            searchForm.setAttribute('aria-busy', 'false');
        }
    }
}

searchForm.addEventListener('submit', event => {
    event.preventDefault();
    const artist = artistInput.value.trim();
    if (artist) searchArtist('/api/search', artist);
});

randomButton.addEventListener('click', () => searchArtist('/api/random'));

artistInput.addEventListener('input', () => {
    hideSuggestions();
    const inputValue = artistInput.value.trim();
    if (inputValue.length < 2 || inputValue.length > 100) return;
    const version = autocompleteVersion;

    autocompleteTimer = setTimeout(async () => {
        autocompleteController = new AbortController();
        try {
            const names = await requestJson(`/api/autocomplete?term=${encodeURIComponent(inputValue)}`, {
                signal: autocompleteController.signal,
            });
            if (version !== autocompleteVersion) return;
            resultList.replaceChildren(...names.map(name => {
                const item = document.createElement('button');
                item.type = 'button';
                item.textContent = name;
                item.className = 'block w-full p-2 text-left hover:bg-neutral-900';
                item.addEventListener('click', () => {
                    artistInput.value = name;
                    hideSuggestions();
                    artistInput.focus();
                });
                return item;
            }));
            resultList.classList.toggle('hidden', names.length === 0);
        } catch (error) {
            if (version === autocompleteVersion && error.name !== 'AbortError') hideSuggestions();
        }
    }, 200);
});

document.addEventListener('click', event => {
    if (event.target !== artistInput && !resultList.contains(event.target)) hideSuggestions();
});

document.addEventListener('keydown', event => {
    if (event.key === 'Escape') hideSuggestions();
    if (event.key === 'ArrowDown' && event.target === artistInput) {
        event.preventDefault();
        resultList.firstElementChild?.focus();
    }
});

function displayDegreeOfSeparation(data, artistName) {
    document.getElementById('degree-of-separation').textContent = String(data.degree);
    document.getElementById('degree-label').textContent = data.degree === 1 ? 'degree' : 'degrees';
    document.getElementById('searched-artist-name').textContent = artistName;
    document.getElementById('connection-heading').hidden = data.degree === 0;

    const tracks = document.getElementById('tracks');
    let previous = 'Kendrick Lamar';
    tracks.replaceChildren(...data.path.map(({ artist, track }) => {
        const connection = document.createElement('section');
        connection.className = 'connection';
        const heading = document.createElement('h3');
        heading.textContent = `${previous} / ${artist}`;
        previous = artist;
        const title = document.createElement('p');
        title.textContent = track.name;
        connection.append(heading, title);

        if (/^[A-Za-z0-9]{22}$/.test(track.spotifyId)) {
            const button = document.createElement('button');
            button.type = 'button';
            button.textContent = 'Load Spotify player';
            button.addEventListener('click', () => {
                const frame = document.createElement('iframe');
                frame.src = `https://open.spotify.com/embed/track/${track.spotifyId}?theme=0`;
                frame.className = 'spotify-embed';
                frame.allow = 'encrypted-media; fullscreen; picture-in-picture';
                frame.title = track.name;
                frame.referrerPolicy = 'no-referrer';
                frame.sandbox = 'allow-forms allow-popups allow-presentation allow-same-origin allow-scripts';
                button.replaceWith(frame);
            }, { once: true });
            connection.append(button);
        }
        return connection;
    }));
    result.classList.remove('hidden');
}
