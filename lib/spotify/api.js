'use strict';

const search = api => title =>
    api.searchTracks(title, { limit: 1 })
        .then(({ body }) => body.tracks)


const getToken = client => client.clientCredentialsGrant()
    .then(
        ({ body: { access_token, expires_in } }) => {
            console.info('The access token expires in ' + expires_in);
            // Save the access token so that it's used in future calls
            client.setAccessToken(access_token);
            return client
        })
module.exports = (client) => {

    return {
        searchByTitle(title) {
            return getToken(client) // tokens are very short lived, so we refresh each time
                .then(search)
                .then(finder => finder(title))
        }
    }
};