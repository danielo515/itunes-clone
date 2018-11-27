'use strict';

const rc = require('rc');
const { clientSecret, clientId } = rc('spotify')
if (!clientSecret || !clientId) {
    console.error(`
    SPOTIFY CREDENTIALS ARE MISSING.
    You must provide an spotify clientSecret and a ClientId
    either by env variable or creating a '.spotifyrc' file
    `)
    process.exit(-1)
}
const SpotifyWebApi = require('spotify-web-api-node');
const Api = require('./api');

const spotifyApi = new SpotifyWebApi({
    clientId,
    clientSecret
});


module.exports = Api(spotifyApi)