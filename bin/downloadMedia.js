'use strict';
const Fs = require('fs');
const Path = require('path');
const Ytdl = require('ytdl-core');
const { songs } = require('./all-songs.json');

const { deburr, kebabCase, trim } = require('lodash');
const { join, pipe } = require('lodash/fp');

const saveSong = filename => stream => next =>
    stream
        .on('end', next)
        .on('data', () => process.stdout.write(":"))
        .on('close', () => console.log('Stream for ', filename, 'closed'))
        .pipe(Fs.createWriteStream(filename))

const downloadSong = id => Ytdl(id, { filter: 'audioonly' });
const targetPath = './lib/assets/songs'

const normalize = pipe(deburr, kebabCase, trim)
const makeFileName = pipe(join('_'), normalize, str => Path.resolve(targetPath, str + '.mp3'))

const fetchNext = (idx = 0) => {
    if (idx >= songs.length) return console.log('Finished downloading songs')
    const { youtube_id, id, title } = songs[idx]
    console.log('Downloading song \n', { idx, id, title, youtube_id });
    saveSong
        (makeFileName([id, title]))
        (downloadSong(youtube_id))
        (() => fetchNext(idx + 1))
}

fetchNext(0)