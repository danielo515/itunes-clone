'use strict';

exports.register = function (server, options, next) {

    server.route({
        path: '/ops/healthcheck',
        method: 'GET',
        handler(request, reply) {

            return reply({ message: 'ok' });
        }
    });

    return next();
};

exports.register.attributes = {
    name: 'healthCheck'
};
