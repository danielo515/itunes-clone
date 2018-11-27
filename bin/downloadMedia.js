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
 * Most of the stuff here can be done live on the backend, but it is better to do it during "compile time" because the data gathered here is
 * unlikely to change
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
/* This function is not strictly creating a proper json file.
Instead it creates the content that we can convert to a proper json file just adding the corresponding open tags
at the start and end of the file. This is done because this script can be stopped at any time and we want to just be able to "resume".
*/
const appendMeta = ({ id, artist, artist_id, filename }) => Fs.appendFileSync(
    'songs-meta.json',
    `"${id}": ${JSON.stringify({ id, artist, artist_id, file: Path.basename(filename) }, null, 2)}, \n`,
    'utf8')

const nextSong = songs => idx => {

    if (idx >= songs.length) return { idx: null }
    const song = songs[idx]
    const filename = makeFileName([song.id, song.title])
    const songInfo = { ...song, idx, filename };

    appendMeta(songInfo)

    if (!song.youtube_id || existingSongs.has(Path.basename(filename))) {
        console.info('skipping song ', songInfo, ' at index ', idx);
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
const numbArtistToFetch = parseInt(process.argv[3], 10) || 20
const injectArtist = (artist) => (song) => ({ ...song, artist: artist.name, artist_id: artist.id })
const main = async () => {

    const artists = await MusicDemons.artist.list();
    console.info('Got artists list ', artists.length);
    // We are intentionally using reduce to fetch one by one and not abuse the public API
    const songs = await B.reduce(
        artists.slice(startAt, startAt + numbArtistToFetch),
        (all, artist) => MusicDemons.artist.getSongs(artist.id)
            .then(artistSongs => all.concat(artistSongs.map(injectArtist(artist)))),
        []);
    console.info('Got songs list ', songs.length);
    const next = nextSong(songs)
    fetchSongs(next)(0)
};

main()
    .catch(err => {
        console.error('Failed while downloading', err)
        process.exit(-1)
    });