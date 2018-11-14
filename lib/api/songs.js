'use strict';

const Joi = require('joi');

exports.register = (server, options, next) => {

    server.route({
        method: 'GET',
        path: '/api/songs',
        config: {
            description: 'The list of available songs',
            notes: 'Just a simple json',
            tags: ['api'],
            response: {
                status: {
                    200: Joi.object()
                }
            },
            handler(request, reply) {

                return reply({
                    status: 'ok',
                    songs: server.songs
                });
            }
        }
    });

    return next();
};

exports.register.attributes = {
    name: 'songs-api'
};
