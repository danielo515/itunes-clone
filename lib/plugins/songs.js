'use strict';
const MusicD = require('./musicDemons');
const { flatten, flatMap } = require('lodash/fp');
const Meta = require('./songs-meta.json');
const Config = require('getconfig');
const url = require('url-join');

// artist -> song -> song
const injectArtist = ({ name, id }) => song => ({ ...song, artist: name, artist_id: id })
const mergeMeta = meta => song => ({
    ...song,
    ...meta[song.id],
    url: url(Config.cdn, meta[song.id].file) // CDN can be changed by config
})

const listSongs = api => () => {

    const merge = mergeMeta(Meta)
    return api
        .artist
        .list()
        .then(artists => artists.slice(0, 50))  // We intentionally take just the first 50
        .then(artists => Promise.all(
            artists.map(
                artist => api
                    .artist
                    .getSongs(artist.id)
                    .then(flatMap(merge))
            )
        ))
        .then(flatten) // we just need to remove one level. If I had more time, I would take a different approach (in one pass, instead of flatten the result)
}



const cacheConfig = {
    expiresIn: 60 * 60 * 1000, // one hour in ms
    generateTimeout: false, // The external api we are using is quite slow
};

exports.register = (server, options, next) => {

    server.method('songs.list', listSongs(MusicD), {
        cache: cacheConfig,
        callback: false,
        generateKey: () => 'Fixed-key' // because no args hapi does not know how to generate a key
    });

    return next();
};

exports.register.attributes = {
    name: 'songs',
    multiple: false,
};
