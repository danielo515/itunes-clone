'use strict';
const path = require('path');
const { readdir, writeFile: _writeFile, readFile: _readFile } = require('fs');
const { promisify } = require('util');
const writeFile = promisify(_writeFile);
const readDir = promisify(readdir);
const songs_path = path.resolve('./lib/assets/songs');
const output_path = path.resolve('./lib/plugins/songs.json');
const { capitalize } = require('lodash');

/**
 * @function getFirstMatch
 * Returns the first match of a regular expression when applied to an string
 * @param  {RegExp} regex the regular expression to use, must contain at least one capturing group
 * @param  {String} str the string where you want to apply the regular expression
 * @return {String} The expected substring or the empty string in case of failure
 */
const getFirstMatch = (regex) => (str) => {

    const res = regex.exec(str);
    return res == null ? '' : res[1];
};
const getArtist = getFirstMatch(/([a-z]+)-/);
const getTitle = getFirstMatch(/-([a-z]+)/);
const inferCover = (title) => `https://www.bensound.com/bensound-img/${title}.jpg`;

console.info('Reading songs from: ', songs_path);
console.info('Generated list will be at: ', output_path);

const main = async () => {

    const songs = (await readDir(songs_path))
        .filter((song) => song.endsWith('.mp3'))
        .map((song) => ({
            title: capitalize(getTitle(song))
            , file: song
            , artist: capitalize(getArtist(song))
            , cover: inferCover(getTitle(song))
        }));

    console.log(songs);
    return writeFile(output_path, JSON.stringify(songs, null, 2), 'utf8');
};

main()
    .catch((err) => {

        console.error('Something unexpected failed during list generation', err);
        process.exit(1);
    });
