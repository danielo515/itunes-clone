'use strict';
const path = require('path');
const Joi = require('joi');

exports.register = (server, options, next) => {

    server.route({
        method: 'GET',
        path: '/api/songs',
        config: {
            description: 'The list of available songs',
            notes: 'Just a simple json',
            tags: ['api'],
            cors: { origin: ['*'], additionalHeaders: ['content-type'] },
            response: {
                status: {
                    200: Joi.object({
                        status: Joi.string(),
                        songs: Joi.array().items(Joi.object())
                    })
                }
            },
            handler(request, reply) {

                return server.methods.songs.list(0, 20, (err, res) => {
                    err ? reply(err)
                        : reply({ status: 'ok', songs: res })
                })
            }
        }
    });

    server.route({
        method: 'GET',
        path: '/api/songs/{param}',
        config: {
            description: 'Serve a single song',
            notes: 'works by song title',
            tags: ['api', 'static'],
            cors: { origin: ['*'] }
        },
        handler: {
            directory: {
                path: './lib/assets/songs',
                redirectToSlash: true,
                listing: false, // you can switch this to true while testing and you will get an auto-generated index with the files
                index: false
            }
        }
    });

    return next();
};

exports.register.attributes = {
    name: 'songs-api'
};
