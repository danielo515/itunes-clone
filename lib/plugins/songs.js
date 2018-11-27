'use strict';
const Request = require('request-promise-native');

const client = Request.defaults({
    baseUrl: 'https://musicdemons.com/api/v1',
    json: true
});

const listSongs = api => (page = 0, pageSize = 20, next) =>
    api
        .get('/song')
        .then(res => next(null, res.slice(page * pageSize, pageSize)))
        .catch(next);

const getSongArtist = api => (songId, next) =>
    api
        .get(`/song/${songId}/artists`)
        .then(res => next(null, res))
        .catch(next);

const cacheConfig = {
    expiresIn: 60 * 60 * 1000, // one hour in ms
    generateTimeout: false, // The external api we are using is quite slow
};

exports.register = (server, options, next) => {
    // const songs = require('./songs.json');
    // server.decorate('server', 'songs', songs);
    server.method('songs.list', listSongs(client), {
        cache: cacheConfig,
        generateKey: (page = 0, pageSize = 20) => [page, pageSize].join('-'),
    });
    server.method('songs.getArtist', getSongArtist(client), {
        cache: cacheConfig,
    });
    return next();
};

exports.register.attributes = {
    name: 'songs',
    multiple: false,
};
