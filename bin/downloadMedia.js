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
        .on('error', (err) => {
            console.log('Skip ', filename)
            console.error('Download error', err);
            next()
        })
        .pipe(Fs.createWriteStream(filename))

const downloadSong = id => Ytdl(id, { filter: 'audioonly' });
const targetPath = './lib/assets/songs'

const normalize = pipe(deburr, kebabCase, trim)
const makeFileName = pipe(join('_'), normalize, str => Path.resolve(targetPath, str + '.mp3'))

const nextSong = idx => {

    if (idx >= songs.length) return { idx: null }
    const { youtube_id, id, title } = songs[idx]
    const songInfo = { idx, id, title, youtube_id };
    if (!youtube_id) {
        console.log('skipping song ', songInfo, ' at index ', idx);
        return nextSong(idx + 1)
    }
    return songInfo
}

const fetchNext = (index = 0) => {
    const { id, title, youtube_id, idx } = nextSong(index);
    if (idx === null) return console.log('Finished downloading songs')
    console.log('Downloading song \n', { idx, id, title, youtube_id });
    saveSong
        (makeFileName([id, title]))
        (downloadSong(youtube_id))
        (() => fetchNext(idx + 1))
}

const startAt = parseInt(process.argv[2], 10) || 0
fetchNext(startAt)