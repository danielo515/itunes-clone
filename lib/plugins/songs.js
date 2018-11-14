'use strict';

exports.register = (server, options, next) => {

    const songs = require('./songs.json');
    server.decorate('server', 'songs', songs);
    return next();
};

exports.register.attributes = {
    name: 'songs',
    multiple: false
};
