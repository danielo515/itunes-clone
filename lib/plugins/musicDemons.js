'use strict';
const Request = require('request-promise-native');
const { memoize } = require('lodash');

const client = Request.defaults({
    baseUrl: 'https://musicdemons.com/api/v1',
    json: true
});

const listSongs = api => (page = 0, pageSize = 20) =>
    api
        .get('/song')
        .then(res => res.slice(page * pageSize, pageSize))

const getSong = api => id =>
    api
        .get('/song/' + id)

const getSongArtist = api => (songId) =>
    api
        .get(`/song/${songId}/artists`)

const listArtists = (api) => () => api.get('/artist')
const listArtistSongs = (api) => (artistId) => api.get(`/artist/${artistId}/songs`)

/*
we memoize to avoid unnecessary calls and because the api is not the fastest on the world.
It is ok to memoize a promise because it should be thenable as many times as you wish
*/
module.exports = {
    api: client, // expose the raw client for convenience
    songs: {
        list: memoize(listSongs(client)),
        getById: memoize(getSong(client)),
        getArtist: memoize(getSongArtist(client))
    },
    artist: {
        list: memoize(listArtists(client)),
        getSongs: memoize(listArtistSongs(client))
    }
};