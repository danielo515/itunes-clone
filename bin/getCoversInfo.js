'use strict';
const Fs = require('fs');
const Path = require('path');
const { songs } = require('./all-songs.json');
const { deburr, kebabCase, trim } = require('lodash');
const { join, pipe } = require('lodash/fp');
const Request = require('request-promise-native');
const { clientSecret, clientId } = require('./spotify-credentials.json')
const SpotifyWebApi = require('spotify-web-api-node');

const spotifyApi = new SpotifyWebApi({
    clientId,
    clientSecret
});

const client = Request.defaults({
    baseUrl: 'https://musicdemons.com/api/v1',
    json: true
});

const searchSongs = api => title =>
    api.searchTracks(title, { limit: 1 })
        .then(({ body }) => body.tracks)

spotifyApi.clientCredentialsGrant()
    .then(
        ({ body: { access_token, expires_in } }) => {
            console.log('The access token expires in ' + expires_in);
            console.log('The access token is ' + access_token);

            // Save the access token so that it's used in future calls
            spotifyApi.setAccessToken(access_token);
            return searchSongs(spotifyApi)
        })
    .then((search) =>
        Promise.all(
            songs.slice(0, 4).map(song => search(song.title))
        )
    )
    .then(x => console.dir(x, { depth: 4 }))
    .catch(
        (err) => {
            console.log('Something went wrong when retrieving an access token', err);
        }
    );