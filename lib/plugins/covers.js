'use strict';
const MusicD = require('./musicDemons');
const { indexBy } = require('lodash/fp');
// artist -> song -> song
const injectArtist = ({ name, id }) => song => ({ ...song, artist: name, artist_id: id })
const spotify = require('../spotify');

const getCover = api => songId => {

    return api
        .songs
        .getById(songId)
        .then(song => {
            return spotify
                .searchByTitle(song.title)
                .then(({ items }) => items[0].album.images)
                .then(indexBy('height'))

        })
}

const cacheConfig = {
    expiresIn: 60 * 60 * 1000, // one hour in ms
    generateTimeout: 10000, // ten seconds seems decent
};

exports.register = (server, options, next) => {

    server.method('songs.cover', getCover(MusicD), {
        cache: cacheConfig,
        callback: false,
    });

    return next();
};

exports.register.attributes = {
    name: 'covers',
    multiple: false,
};
