/**
 * @author Jared Rathbun
 * @author Bernardo Santos
 * @author Allen Westgate
 * 
 * Manages all connections and data handling with the passwords SQL database.
 */

const mysql = require('mysql2/promise');
const crypto = require('crypto');
const mkdirp = require('mkdirp');

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

/**
 * Generates a random 16-bit salt.
 * 
 * @returns A String representing a cryptographically random, 16 byte IV (salt).
 */
function genSalt() {
    return crypto.randomBytes(16).toString('base64');
}

/**
 * Generates a SHA512 (Secure Hashing Algorithm, 512 byte) hash of the password 
 * and salt provided.
 * 
 * @param {String} password The password to be hashed.
 * @param {String} salt The salt to be hashed with the password.
 * @returns A String reprenting the hash of the password and salt, represented 
 * in an equation as H(password + salt).
 */
function genHash(password, salt) {
    return crypto.createHash("sha512").update(password + salt).digest('base64');
}

/**
 * Pads a String with the specified width and character.
 * 
 * @param {Number} width The overall width of the String to be returned. 
 * @param {String} string The String to pad. 
 * @param {String} padding The character to fill the padding with.
 * @returns 
 */
function pad(width, string, padding) {
    return (width <= string.length) ? string :
        pad(width, padding + string, padding)
}

/**
 * Searches for the username and password pair in the database, returning 
 * true if the provided credentials match the database's record, false 
 * otherwise.
 * 
 * @param {String} username The username. 
 * @param {String} password The password.
 */
async function lookupEntry(username, password) {
    /* Make query to DB to get all entries with the username as the primary 
    key. */
    console.log("Validating credentials from database...");

    // Try to query the database looking for the username provided
    try {
        let query = "SELECT * FROM accounts WHERE username = ?";
        let result = await pool.execute(query, [username]);

        // If the result contains a row, then the username exists, now check the password
        if (result[0][0].id) {
            let hash = result[0][0].hash;
            let salt = result[0][0].salt;

            // Return true if the password is correct, false otherwise
            return genHash(password, salt) === hash;
        }

        // If no row is returned, it means that there is no username in the database that matches
        // the one provided
        return false;
    } catch (err) {

        // If error, return false
        return false;
    }

}

/**
 * Inserts the given username and password pair into the database.
 * 
 * @param {String} username The username to enter into the database. 
 * @param {String} password The password to enter into the database.
 * @param {String} path The path of the user's profile picture on the server.
 * @returns A boolean representing whether of not the operation was 
 * successful.
 */
async function insertEntry(username, password) {
    console.log("Inserting into database...");

    try {
        // Format and execute query
        let query = "SELECT * FROM accounts WHERE username = ?";
        let result = await pool.execute(query, [username]);

        // If username already in use, return false
        if (result[0][0] !== undefined) {
            console.log("Username in use, not able to insert...")

            // Return false to caller
            return false;

        } else {
            console.log("Able to insert, moving forward...");
            // Generate salt and hash to store the user's password
            const salt = String(genSalt());
            const hash = String(genHash(password, salt));
            const create_date = String(new Date().getTime().toString());

            // Format query with values
            let query = "INSERT INTO accounts (username, date, hash, salt, picture_path, followers, following) VALUES (?, ?, ?, ?, ?,?,?)";
            let values = [username, create_date, hash, salt, '.\\default-picture.png', '', ''];

            // Execute query
            await pool.execute(query, values);
            console.log("User successfully registered!");

            return true;
        }
    } catch (err) {
        // If error, then return false
        console.log(err)
        return false;
    }

}

/**
 * Searches for the username in the database, returning true if the 
 * provided username match the database's record, false 
 * otherwise.
 * 
 * @param {String} username The username. 
 */
async function lookupUsernameEntry(username) {
    /* Make query to DB to get all entries with the username as the primary 
    key. */
    console.log("Validating registering the username...");

    try {
        let query = "SELECT * FROM accounts WHERE username = ?";
        let result = await pool.execute(query, [username]);

        if (result[0][0].id) {
            return true;
        } else {
            return false;
        }
    } catch (err) {
        return false;
    }

}


async function updateProfilePicture(username, path) {
    console.log("Updating profile picture for user: " + username + " ...");

    try {
        let query_update = "UPDATE accounts SET picture_path = ? WHERE username = ?";
        await pool.execute(query_update, [path, username]);

        console.log("Profile picture update successful...");

        return true;
    } catch (e) {
        console.log("Error while updating profile picture from user...");
        console.log(e);
        return false;
    }
}

/**
 * Makes a call to the SQL Database for all entries, and prints them in a 
 * neat format to the screen.
 */
async function displayAll() {
    let entries = [];
    pool.execute("SELECT * FROM accounts", (err, result) => {
        if (err) {
            return;
        } else {
            entries = result;
        }
    });

    // Build a line that contains just dashes.
    var dashes = '';
    for (var i = 0; i < 166; i++) {
        dashes += '-';
    }

    // Build a line that contains just dashes.
    var dashes = '';
    for (var i = 0; i < 166; i++) {
        dashes += '-';
    }

    // Require the sprintf library, then build a header and print it.
    const sprintf = require('sprintf-js').sprintf;
    const header = sprintf('%s | %s | %s | %s |', pad(40, "USERNAME", " "),
        pad(25, "DATE", " "), pad(60, "HASH", " "), pad(30, "SALT", " "));
    console.log(header);
    console.log(dashes);

    // Loop over every element returned from the database and print it.
    for (const jsonObj of entries) {
        const line = sprintf('%s | %s | %s | %s |', pad(40,
            jsonObj.username, " "), pad(25, jsonObj.date, " "), pad(60,
                jsonObj.hash, " "), pad(30, jsonObj.salt, " "));
        console.log(line);
    }

    console.log(dashes);
}

async function retrieveUserData(username) {
    console.log("Retrieving data from user: " + username + " ...");

    try {
        let query_songs = "SELECT * FROM songs WHERE username = ?";
        let songs = await pool.execute(query_songs, [username]);

        let query_friends = "SELECT username FROM accounts WHERE username != ?";
        let friends = await pool.execute(query_friends, [username]);

        let query_pic = "SELECT picture_path FROM accounts WHERE username = ?";
        let pic_path = await pool.execute(query_pic, [username]);

        let jsonReturn = {
            "songs": songs[0],
            "friends": friends,
            "picture_path": pic_path[0][0]["picture_path"]
        };

        console.log("Data retrieval successful...");

        return JSON.stringify(jsonReturn);

    } catch (e) {
        console.log("Error while retrieving data from user...");
        console.log(e);
    }
}

/**
 * 
 * @param {String} username 
 * @param {String} userToFollow 
 */
async function addFollower(username, userToFollow) {
    if (!username || !userToFollow) {
        return false;
    }

    const following_query = "SELECT following FROM accounts WHERE username = ?",
        followers_query = "SELECT followers FROM accounts WHERE username = ?";

    var followingList = await executeQuery(following_query, [username]);
   
    if (followingList != null) {
        followingList = parseList(followingList.following);
    } else {
        followingList = [];
    }

    var followersList = await executeQuery(followers_query, [userToFollow]);
    if (followersList != null) {
        followersList = parseList(followersList.followers);
    } else {
        followersList = [];
    }
    
    console.log('FOLLOWING LIST: ', followingList)
    console.log('FOLLOWERS LIST: ', followersList);

    //Add the userToFollow to the username's following list.
    followingList.push(userToFollow);

    // Add the username to the userToFollows followers list.
    followersList.push(username);

    // Make the changes in the database.
    let following_update = "UPDATE accounts SET following = ? WHERE username = ?";
    let follower_update = "UPDATE accounts SET followers = ? WHERE username = ?";
    
    console.log(followersList.toString())
    console.log(followingList.toString())
    await pool.execute(follower_update, [followersList.toString(), userToFollow]);
    await pool.execute(following_update, [followingList.toString(), username]);

    return true;
}

async function removeFollower(username, followerToRemove) {
    if (!username || !followerToRemove) {
        return false;
    }

    const following_query = "SELECT following FROM accounts WHERE username = ?",
        followers_query = "SELECT followers FROM accounts WHERE username = ?";

    var followingList = await executeQuery(following_query, [username]);
   
    if (followingList != null) {
        followingList = parseList(followingList.following);
    } else {
        followingList = [];
    }

    var followersList = await executeQuery(followers_query, [followerToRemove]);
    if (followersList != null) {
        followersList = parseList(followersList.followers);
    } else {
        followersList = [];
    }

    // Remove the follower from the username's followers list.
    const followingIdx = followingList.indexOf(followerToRemove);
    if (followingIdx > -1) {
        followingList.splice(followingIdx, 1);
    }

    // Remove the username from the followers following list.
    const followerIdx = followersList.indexOf(username);
    if (followerIdx > -1) {
        followersList.splice(followerIdx, 1);
    }

    // Make the changes in the database.
    let following_update = "UPDATE accounts SET following = ? WHERE username = ?";
    let follower_update = "UPDATE accounts SET followers = ? WHERE username = ?";
    
    await pool.execute(follower_update, [followersList.toString(), followerToRemove]);
    await pool.execute(following_update, [followingList.toString(), username]);

    return true;
}

async function getFollowing(username) {
    if (username) {
        let query = 'SELECT following FROM accounts WHERE username = ?';
        let data = await pool.execute(query, [username]);
        if (data[0][0]) {
            return data[0][0].following;
        } else {
            return [];
        }
    } else {
        return null;
    }
}

async function getAllUsers() {
    let query = 'SELECT username FROM accounts';
    return await pool.execute(query);
}

/**
 * 
 * @param {*} data 
 * @returns 
 */
function parseList(data) {
    console.log("Parsing: ", data);
    if (data == null || data == undefined) {
        return null;
    }

    if (data == "") {
        return [];
    } else {
        console.log(data.split(','));
        return data.split(',');
    }
}

async function executeQuery(query, params=null) {
    let returnData = null;
    
    if (params == null) {
        await pool.execute(query).then((data) => {
            if (data[0].length > 0) {
                returnData = data[0][0];
            }
        });
    } else {
        await pool.execute(query, params).then((data) => {
            if (data[0].length > 0) {
                returnData = data[0][0];
            }
        });
    }
    return returnData;
}

module.exports = {
    lookupEntry,
    lookupUsernameEntry,
    insertEntry,
    displayAll,
    retrieveUserData,
    updateProfilePicture,
    addFollower,
    removeFollower,
    getFollowing,
    getAllUsers
};