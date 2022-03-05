/**
 * @author Jared Rathbun
 * @author Bernardo Santos
 * @author Allen Westgate
 * 
 * Some code referenced via: https://www.digitalocean.com/community/tutorials/how-to-add-login-authentication-to-react-applications
 * 
 * Handles all endpoints and communication with databases.
 */

const express = require('express');
const app = express();
const crypto = require('crypto');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const pwdManager = require('./pwd-manager');
const songManager = require('./songs-manager');
const multer = require("multer");
const path = require("path");
const upload = multer({
    dest: path.join(__dirname, '.\\users\\tmpFiles')
});
const uuid = require("uuid");
const fs = require("fs");
const { getSystemErrorMap } = require('util');
const { map } = require('jquery');
const { type } = require('os');
const currentSongsMap = new Map();
const onlineMap = new Map();

// Set CORS information, cookieParser and the limit of a .mp3 file
app.use(cors({
    origin: 'http://localhost:3000',
    methods: ['POST', 'PUT', 'GET', 'OPTIONS', 'HEAD'],
    credentials: true
}));
app.use(cookieParser());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb' }));

// Use sessions
app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, httpOnly: false, sameSite: true },
    rolling: true
}));

// Define parsers for JSON objects and request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('trust proxy', true);

// Allow React app to make requests to the NodeJS server with credentials
app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
});

// Remove the possibility of user logging out and coming back to the application without loggin back in
app.use(function (req, res, next) {
    if (!req.user)
        res.header('Cache-Control',
            'private, no-cache, no-store, must-revalidate');
    next();
});

// Allow React app to make requests to the NodeJS server with credentials


/**
 * Default endpoint. Redirects to the /login 
 */
app.get('/', (req, res) => {
    return res.status(200).redirect('/login');
});

app.get('/login', (req, res) => {
    return res.send("").end();
})

app.post('/login', (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    var credentialsValid = pwdManager.lookupEntry(username, password);

    // Make connection to SQL Database, and check for credentials.
    credentialsValid.then(function (response) {
        if (response) {
            req.session.loggedin = true;
            req.session.username = username;
            res.send({
                token: crypto.randomUUID()
            });
            res.end()
            onlineMap.set(username, username);
        } else {
            return res.send({ token: undefined }).end();
        }
    })
});

app.post('/register', (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    var usernameExists = pwdManager.lookupUsernameEntry(username);

    // Make connection to SQL Database, and check for credentials.
    usernameExists.then(function (response) {
        if (response) {
            console.log("Username " + username + " is already in use");
            res.send({ token: undefined });
        } else {
            console.log("No username has been found that matches " + username);
            let insertion = pwdManager.insertEntry(username, password);

            insertion.then(function (r) {
                if (r) {
                    console.log("Insertion successfully performed...");

                    req.session.loggedin = true;
                    req.session.username = username;

                    res.send({
                        token: crypto.randomUUID()
                    });
                } else {
                    console.log("Issues when inserting...")
                    res.send({ token: undefined });
                }
            });

        }
    });

});

/**
 * Logout endpoint. Destroys the session.
 * 
 * NOTE: The username of the person who is being logged out must be specified.
 */
app.get('/logout', function (req, res) {
    const username = req.session.username;
    if (username) {
        currentSongsMap.delete(username);
        onlineMap.delete(username);
        localStorage.clear();
        req.session.destroy((err) => {
            if (err) {
                console.log('Failure to destroy session for user ' + username);
            }

            res.redirect('/');
        });
        return res.status(200);
    } else {
        return res.redirect('/');
    }
});

app.get('/currentUser', async (req, res) => {
    if (req.session.loggedin) {
        console.log(req.session.username + " is logged in!");
        let user = req.session.username;
        let userData = await pwdManager.retrieveUserData(user);
        let parsedUserData = JSON.parse(userData);
        let songsData = await songManager.getSongs(user);

        console.log("returning data from user " + req.session.username)
        let currUser = JSON.stringify({
            "currUser": user,
            "songs": songsData,
            "friends": parsedUserData["friends"],
            "path": parsedUserData["picture_path"]
        });

        res.send(currUser);
        res.end();
    } else {
        res.redirect('/');
    }
});

/**
 * Adds a new song to the user's library. 
 * 
 * NOTE: The .mp3 file must be sent in the body of the request, along with it's
 * file name. The username must be sent in the body as well.
 */
app.post("/addsong", upload.single("song"),
    (req, res) => {

        if (req.session.loggedin) {
            console.log("Saving mp3...");

            const tempPath = req.file.path;
            const fileName = "audio-" + uuid.v4() + ".mp3";
            const userPath = path.join(".\\public\\users\\", req.session.username, "\\songs\\");
            const targetPath = path.join(".\\public\\users\\", req.session.username, "\\songs\\", fileName);
            const targetPathDB = ".\\public\\users\\" + req.session.username + "\\songs\\" + fileName;

            if (!fs.existsSync(userPath)) {
                fs.mkdirSync(userPath, { recursive: true });
            }

            fs.rename(tempPath, targetPath, err => {
                if (err) {
                    console.log("ERROR -> " + err);
                    return this.handleError(err, res);
                }

                // Add the new song to the database for this user.
                if (songManager.addSong(req.session.username, targetPathDB)) {
                    return res.status(200);
                }
                return res.status(500).send('Error while adding file.');
            });
        } else {
            res.status(400).send("User is not logged in").end();
        }


    }
);

app.post("/upload", upload.single("picture"),
    (req, res) => {

        if (req.session.loggedin) {
            let u = req.session.username;

            if (true) {
                const tempPath = req.file.path;
                const fileName = "image-" + uuid.v4() + ".png";
                const userPath = path.join("..\\..\\public\\users\\", u, "\\profile\\");
                const targetPath = path.join("..\\..\\public\\users\\", u, "\\profile\\", fileName);
                const relativeTargetPath = "..\\..\\users\\" + u + "\\profile\\" + fileName;

                if (!fs.existsSync(userPath)) {
                    fs.mkdirSync(userPath, { recursive: true });
                }

                fs.rename(tempPath, targetPath, err => {
                    if (err) {
                        console.log("ERROR -> " + err);
                        return this.handleError(err, res);
                    }
                    res.status(200).end();
                });

                // Update database
                let updateSuccessful = pwdManager.updateProfilePicture(u, relativeTargetPath);

                if (updateSuccessful) {
                    console.log("Successful operation to upload profile picture!");
                } else {
                    console.log("Error while updating profile picture in NodeJS!")
                }
            }
        } else {
            res.send(400).send("User is not logged in").end();
        }
    }
);

/**
 * Deletes a song from the database given the username and path of the song.
 * 
 * NOTE: The username and songPath must be specified in the body of the request.
 */
app.post('/deletesong', (req, res) => {
    if (req.session.loggedin) {
        const username = req.session.username;
        const songPath = req.body.songPath;

        console.log(username, songPath)

        if (username && songPath) {
            return (songManager.deleteSong(username, songPath)) ? res.status(200).send().end() : res.status(500).send().end();
        } else {
            return res.status(400).send('Username and Song Path must be provided with request.');
        }
    } else {
        return res.redirect('/');
    }

});

/**
 * Deletes the specified user's account.
 * 
 * NOTE: The password must be passed in the body of this request.
 */
app.delete('/deleteaccount', (req, res) => {
    if (req.session.loggedin) {
        const username = req.session.username;
        const password = req.body.password;

        if (!password) {
            return res.status(400).send('Password must be sent with request.');
        }

        currentSongsMap.delete(username);
        localStorage.clear();
        req.session.destroy((err) => {
            if (err) {
                console.log('Failure to destroy session for user ' + username);
            }
        });

        return (pwdManager.deleteEntry(username, password)) ? res.status(200).redirect('/') : res.status(400);

    }

});

/**
 * Follows a user.
 * 
 * NOTE: The userToFollow must be specified in the body.
 */
app.post('/follow', async (req, res) => {
    let username = req.session.username;
    let userToFollow = req.body.toFollow;
    if (userToFollow && username) {
        let result = await pwdManager.addFollower(username, userToFollow);
        console.log(result);
        if (result) {
            return res.status(200).end();
        } else {
            return res.status(400).send('Cannot follow that user.').end();
        }
    } else {
        return res.status(400).send('User to Follow must be specified.');
    }
});

/**
 * Unfollows a user.
 * 
 * NOTE: The toUnfollow must be specified in the body.
 */
app.post('/unfollow', (req, res) => {
    let username = req.session.username;
    let userToUnfollow = req.body.toUnfollow;
    if (userToUnfollow && username) {
        if (pwdManager.removeFollower(username, userToUnfollow)) {
            return res.status(200).end();
        } else {
            return res.status(400).end();
        }
    } else {
        res.send('User to unfollow must be specified.').end();
    }
});

app.get('/allusers', (req, res) => {
    pwdManager.getAllUsers().then(async (data) => {
        let allUsers = data[0];
        let json = [];
        let followingList = await pwdManager.getFollowing(req.session.username);
        console.log(req.session.username, followingList);
        for (const user of allUsers) {
            if (user.username != req.session.username) {
                let isOnline = false;
                let isFollowing = false;
                if (onlineMap.has(user.username)) {
                    isOnline = true;
                }

                if (followingList.includes(user.username)) {
                    isFollowing = true;
                }

                json.push({
                    user: user.username,
                    online: isOnline,
                    followingStatus: isFollowing
                });
            }
        }

        console.log(JSON.stringify(json));
        res.send(JSON.stringify(json)).end();
    });
});

app.get('/songData', (req, res) => {
    if (req.body.username) {
        console.log({ 'song': currentSongsMap.get(req.body.username) });
        return res.status(200).send({ 'song': currentSongsMap.get(req.body.username) }).end();
    } else {
        return res.status(400).send('Username must be provided.').end();
    }
});

/**
 * Sets the current song for the user. 
 * 
 * NOTE: The current song must be specified in the body of the PUT
 * request.
 */
app.post('/setcurrentsong', async (req, res) => {
    const username = req.session.username;
    const song = req.body.song;

    if (username && song) {
        currentSongsMap.set(username, song);
        console.log(currentSongsMap);
        res.send().end();
    } else {
        return res.redirect('/');
    }

});

app.get('/getcurrentsongs', async (req, res) => {
    if (req.session.username) {
        let followingList = await pwdManager.getFollowing(req.session.username);
        let followingAsList = String(followingList).split(",");
        let responseList = [];
        console.log('followingList: ', followingAsList)

        // Get song/username for each song currently being played by another user
        for(const [key, value] of currentSongsMap.entries()){
            if(followingAsList.includes(key)){
                responseList.push({
                    "user": key,
                    "title": value
                });
            }
        }

        res.send(JSON.stringify(responseList)).end();
    } else {
        res.send().end();
    }
});

app.put('/removeCurrentSong', (req, res) => {
    const username = req.session.username;

    if (req.session.username) {
        if (currentSongsMap.has(username)) {
            currentSongsMap.delete(username);
            return res.status(200).end("Successful");
        } else {
            return res.status(400).end("User is not in current songs map.");
        }
    } else {
        return res.status(401).send('User not logged in');
    }    
})

const port = 8080;
app.listen(port, () => console.log('API is running on port ' + port));