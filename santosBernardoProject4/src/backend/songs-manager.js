/**
 * @author Jared Rathbun
 * @author Bernardo Santos
 * @author Allen Westgate
 * 
 * Manages all connections and data handling with the passwords SQL database.
 */

const mysql = require('mysql2/promise');
const jsmediatags = require('jsmediatags');
const uuid = require("uuid");
const fs = require('fs');
const { randomUUID } = require('crypto');


/**
 * Makes a connection to the passwords database, throwing an error if 
 * encountered.
 */
const config = {
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'project4'
}

const pool = mysql.createPool(config);

function base64ArrayBuffer(arrayBuffer) {
    var base64 = ''
    var encodings = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

    var bytes = new Uint8Array(arrayBuffer)
    var byteLength = bytes.byteLength
    var byteRemainder = byteLength % 3
    var mainLength = byteLength - byteRemainder

    var a, b, c, d
    var chunk

    // Main loop deals with bytes in chunks of 3
    for (var i = 0; i < mainLength; i = i + 3) {
        // Combine the three bytes into a single integer
        chunk = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2]

        // Use bitmasks to extract 6-bit segments from the triplet
        a = (chunk & 16515072) >> 18 // 16515072 = (2^6 - 1) << 18
        b = (chunk & 258048) >> 12 // 258048   = (2^6 - 1) << 12
        c = (chunk & 4032) >> 6 // 4032     = (2^6 - 1) << 6
        d = chunk & 63               // 63       = 2^6 - 1

        // Convert the raw binary segments to the appropriate ASCII encoding
        base64 += encodings[a] + encodings[b] + encodings[c] + encodings[d]
    }

    // Deal with the remaining bytes and padding
    if (byteRemainder == 1) {
        chunk = bytes[mainLength]

        a = (chunk & 252) >> 2 // 252 = (2^6 - 1) << 2

        // Set the 4 least significant bits to zero
        b = (chunk & 3) << 4 // 3   = 2^2 - 1

        base64 += encodings[a] + encodings[b] + '=='
    } else if (byteRemainder == 2) {
        chunk = (bytes[mainLength] << 8) | bytes[mainLength + 1]

        a = (chunk & 64512) >> 10 // 64512 = (2^6 - 1) << 10
        b = (chunk & 1008) >> 4 // 1008  = (2^6 - 1) << 4

        // Set the 2 least significant bits to zero
        c = (chunk & 15) << 2 // 15    = 2^4 - 1

        base64 += encodings[a] + encodings[b] + encodings[c] + '='
    }

    return base64
}

async function getDataSongs(path) {
    const readTags = ['artist', 'title', 'track', 'year', 'album', 'picture'];

    return new Promise((resolve, reject) => {
        new jsmediatags.Reader(path).setTagsToRead(readTags).read({
            onSuccess: (tag) => {
                // Build a Base64 Encoded String that holds the bytes for the album cover.
                // Code copied from https://github.com/aadsm/jsmediatags.
                let albumCover = undefined;
                let imageBytes = "";
                if (tag.tags.picture) {
                    const picture = tag.tags.picture;
                    for (var i = 0; i < picture.data.length; i++) {
                        imageBytes += String.fromCharCode(picture.data[i]);
                    }

                    albumCover = `data:${picture.format};base64,${base64ArrayBuffer(picture.data)}`;
                } else {
                    albumCover = '.\\default_album.jpg';
                }

                let title = tag.tags.title;
                let artist = tag.tags.artist;
                let album = tag.tags.album;
                let track = tag.tags.track;

                if (tag.tags.title === undefined) {
                    title = "Unknown Title";
                }

                if (tag.tags.artist === undefined) {
                    artist = "Unknown Artist";
                }

                if (tag.tags.album === undefined) {
                    album = "Unknown Album";
                }

                if (tag.tags.track === undefined) {
                    track = "Unknown Track";
                }

                let pathString = String(path).split("\\");
                let idFromPath = pathString[pathString.length - 1];
                idFromPath = idFromPath.replace("audio-", "");
                idFromPath = idFromPath.replace(".mp3", "");

                // Create a new JSON object for the song and push it to the array.
                let songJSON = {
                    'title': title,
                    'artist': artist,
                    'album': album,
                    'track': track,
                    'albumCover': albumCover,
                    'year': tag.tags.year,
                    'path': path,
                    'id': idFromPath
                };

                resolve(songJSON);
            }, onError: () => {
                console.log("Could no get ID3 data")
            }
        });
    })
}

/**
 * Returns a JSON object containing info about each song in the provided 
 * username's library.
 * 
 * @param {String} username The username to search for. 
 * @returns A JSON object containing information about each song. If no songs exist, null is returned.
 */
async function getSongs(username) {
    console.log("Searching for songs for user: " + username);

    let query = "SELECT song_path FROM songs WHERE username = ?";
    let result = null;
    try {
        result = await pool.execute(query, [username]);
    } catch (err) {
        return null;
    }

    let songsArray = result[0];
    var returnJSON = [];

    // If the songs array exists, walk over every path in it and build a json object for each song.
    if (songsArray) {
        const readTags = ['artist', 'title', 'track', 'year', 'album', 'picture'];
        let promises = songsArray.map(song => getDataSongs(song["song_path"]));
        await Promise.all(promises).then(results => {
            returnJSON = (results);
        }).catch(err => console.log("error promise"));

        return returnJSON;
    }

    return null;
}

/**
 * Adds a song to the username's library.
 * 
 * @param {String} username The user who's library the song will be added to.
 * @param {String} songPath The path of the song to add to the library.
 * @returns A boolean representing whether or not the operation is successful.
 */
async function addSong(username, songPath) {
    // Build the query and execute it with the username
    const query = "INSERT INTO songs(username, song_path) VALUES (?, ?)";

    try {
        result = await pool.execute(query, [username, songPath]);
        return true;
    } catch (err) {
        return false;
    }

}

/**
 * Removes a song from the library that matches the username and song path.
 * 
 * @param {String} username The user who's library the song will be removed from. 
 * @param {*} songPath The path of the song to remove from the library.
 * @returns A boolean representing if the operation is successful or not.
 */
async function deleteSong(username, songPath) {

    const query_id = "SELECT ID FROM songs WHERE username = ? AND song_path = ?";

    try {
        var result_id = await pool.execute(query_id, [username, songPath]);
        const query_delete = "DELETE FROM songs WHERE id = ?";
        try {
            let result = await pool.execute(query_delete, [result_id[0][0].ID]);
            console.log("DELETE successful!");
            return true;
        } catch (err) {
            return false;
        }
    } catch (err) {
        return false;
    }
}

module.exports = {
    getSongs,
    addSong,
    deleteSong,
    getDataSongs
};