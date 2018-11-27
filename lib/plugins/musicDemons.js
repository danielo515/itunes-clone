
const Request = require('request-promise-native');

const client = Request.defaults({
    baseUrl: 'https://musicdemons.com/api/v1',
    json: true
});

const listSongs = api => (page = 0, pageSize = 20) =>
    api
        .get('/song')
        .then(res => res.slice(page * pageSize, pageSize))

const getSongArtist = api => (songId) =>
    api
        .get(`/song/${songId}/artists`)

const listArtists = (api) => () => api.get('/artist')
const listArtistSongs = (api) => (artistId) => api.get(`/artist/${artistId}/songs`)

module.exports = {
    api: client, // expose the raw client for convenience
    songs: {
        list: listSongs(client),
        getArtist: getSongArtist(client)
    },
    artist: {
        list: listArtists(client),
        getSongs: listArtistSongs(client)
    }
};