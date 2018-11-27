'use strict';

const { clientSecret, clientId } = require('./spotify-credentials.json')
const SpotifyWebApi = require('spotify-web-api-node');
const Api = require('./api');

const spotifyApi = new SpotifyWebApi({
    clientId,
    clientSecret
});


module.exports = Api(spotifyApi)