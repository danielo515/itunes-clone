'use strict';
const Fs = require('fs');
const Path = require('path');
const Ytdl = require('ytdl-core');
const MusicDemons = require('../lib/plugins/musicDemons');
const B = require('bluebird');
const { deburr, kebabCase, trim } = require('lodash');
const { join, pipe } = require('lodash/fp');

/**
 * This is just an script that fulfills a double purpose:
 * - downloading the songs that we expect to use (the first 12 users from the api ) from youtube
 * - creating a file with denormalized meta-data about songs that the original api does not provide
 * All the methods and functions here are intentionally sequential (download songs one by one, fetch artist songs artist by artist)
 * to not abuse the external APIs and avoid posible blocks
*/

const targetPath = Path.resolve('./lib/assets/songs');
const existingSongs = new Set(Fs.readdirSync(targetPath));

const saveSong = filename => stream => next =>
    stream
        .on('end', next)
        .on('data', () => process.stdout.write(':'))
        .on('close', () => console.log('Stream for ', filename, 'closed'))
        .on('error', (err) => {
            console.log('Skip ', filename)
            console.error('Download error', err);
            next(err)
        })
        .pipe(Fs.createWriteStream(filename))

const downloadSong = id => Ytdl(id, { filter: 'audioonly' });

const normalize = pipe(deburr, kebabCase, trim)
const makeFileName = pipe(join('_'), normalize, str => Path.join(targetPath, str + '.mp3'))
// This function is not strictly creating a proper json file. Instead it creates an array content that we can convert to a proper json file just adding
// brakets at the start and end of the file. This is done because this script can be stopped at any time and we want to just be able to "resume"
const appendMeta = song => Fs.appendFileSync(
    'songs-meta.json',
    JSON.stringify(song, null, 2) + ', \n',
    'utf8')

const nextSong = songs => idx => {

    if (idx >= songs.length) return { idx: null }
    appendMeta(songs[idx])
    const { youtube_id, id, title } = songs[idx]
    const filename = makeFileName([id, title])
    const songInfo = { idx, id, title, youtube_id, filename };
    if (!youtube_id || existingSongs.has(Path.basename(filename))) {
        console.log('skipping song ', songInfo, ' at index ', idx);
        return nextSong(songs)(idx + 1)
    }
    return songInfo
}

const fetchSongs = getNext => (index = 0) => {
    const { id, title, youtube_id, idx, filename } = getNext(index);
    if (idx === null) return console.log('Finished downloading songs')
    console.log('Downloading song \n', { idx, id, title, youtube_id });
    saveSong
        (filename)
        (downloadSong(youtube_id))
        (() => fetchSongs(getNext)(idx + 1))
}

const startAt = parseInt(process.argv[2], 10) || 0
const injectArtist = (artist) => (song) => ({ ...song, artist: artist.name, artist_id: artist.id })
const main = async () => {

    const artists = await MusicDemons.artist.list();
    console.info('Got artists list');
    // We are intentionally using reduce to fetch one by one and not abuse the public API
    const songs = await B.reduce(
        artists.slice(0, 12),
        (all, artist) => MusicDemons.artist.getSongs(artist.id)
            .then(artistSongs => all.concat(artistSongs.map(injectArtist(artist)))),
        []);
    console.info('Got songs list');
    const next = nextSong(songs)
    fetchSongs(next)(startAt)
};

// fetchNext(startAt)
main().catch(() => process.exit(-1))