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
            validate: {
                query: {
                    page: Joi.number().integer().default(0).description('Which page to fetch. Page size is fixed')
                }
            },
            response: {
                status: {
                    200: Joi.object({
                        status: Joi.string(),
                        count: Joi.number().integer().description('The number of returned elements'),
                        total: Joi.number().integer().description('The number total elements available'),
                        page: Joi.number().integer(),
                        pageSize: Joi.number().integer(),
                        songs: Joi.array().items(Joi.object())
                    })
                }
            },
            handler(request, reply) {
                /*
                    The target api does not have pagination, so we do more or less manually
                    We do it here instead on the server method to take advantage of the cache.
                    Otherwise different page numbers could invalidate the cache
                */
                const { page } = request.query;
                const pageSize = 20;
                const offset = page * pageSize;

                return server.methods.songs.list((err, res) => {
                    if (err) return reply(err)
                    const songs = res.slice(offset, offset + pageSize);
                    reply({
                        status: 'ok',
                        total: res.length,
                        count: songs.length,
                        pageSize,
                        page,
                        songs
                    })
                })
            }
        }
    });

    server.route({
        method: 'GET',
        path: '/api/songs/{songId}/cover',
        config: {
            description: 'Return the cover of the requested song',
            notes: 'does not actually return any image, just an url',
            tags: ['api', 'media'],
            cors: { origin: ['*'] },
            validate: {
                params: {
                    songId: Joi.number().integer().required()
                }
            }
        },
        handler(request, reply) {
            const { songId } = request.params;
            server.methods.songs.cover(songId, (err, res) => reply(err, res))
        }
    });

    // This is the static file server and it's used on development to serve music files. It will not be used on production
    server.route({
        method: 'GET',
        path: '/api/songs/{param}',
        config: {
            description: 'Serve a single song',
            notes: 'works by file name',
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
