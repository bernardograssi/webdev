const express = require('express');
const fs = require("fs");
const path = require("path");
const bodyParser = require("body-parser");
const session = require('express-session');
const multer = require("multer");
const uuid = require("uuid");
const dbPath = path.join(__dirname, '\\public\\data\\users.json');
const upload = multer({
    dest: path.join(__dirname, '\\public\\uploaded')
});
const crypto = require("crypto");
const pbkdf2 = require("pbkdf2");

const app = express();

app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: false
}));
app.use(function (req, res, next) {
    if (!req.user)
        res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    next();
});
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '\\public')));

function hashPassword(password) {
    var salt = crypto.randomBytes(128).toString('base64');
    var iterations = 10000;
    var hash = crypto.pbkdf2Sync(password, salt, iterations, 32, 'sha512');

    return {
        salt: salt,
        hash: hash.toString('hex')
    };
}

app.get('', function (req, res) {
    if (req.session.loggedin) {
        res.redirect(200, '/home');
    } else {
        res.render('login.ejs');
    }
});

app.get('/index', function (req, res) {
    if (req.session.loggedin) {
        res.redirect(200, '/home');
    } else {
        res.render('login.ejs');
    }
});

app.get('/logout', function (req, res) {
    req.session.destroy((err) => {
        if (err) {
            return console.log(err);
        }
        res.redirect('/index');
    });
});

app.get('/accounts', function (req, res) {
    let rawData = fs.readFileSync(dbPath);
    let users = JSON.parse(rawData)["users"];

    // If login attempt.
    if (req.query.login == "1") {
        var userReceived = req.query.user;
        var pwdReceived = req.query.password;
        var searchResult = '';
        var found = false;

        for (var k = 0; k < users.length; k++) {
            if (users[k]["username"] == userReceived) {
                let hashedPwdData = {
                    "password": users[k]["password"],
                    "salt": users[k]["salt"]
                };

                if (crypto.pbkdf2Sync(pwdReceived, hashedPwdData["salt"], 10000, 32, 'sha512').toString('hex') == hashedPwdData["password"]) {
                    found = true;
                    searchResult = { "ID": users[k]["id"] };
                    break;
                }

            }
        }

        res.send(searchResult);
        res.end();

    }
    // If registration attempt.
    else {
        var userReceived = req.query.user;
        var pwdReceived = req.query.password;
        var searchResult = '';
        var found = false;
        var hashedPwdData = hashPassword(pwdReceived);

        for (var k = 0; k < users.length; k++) {
            if (String(users[k]["username"]).toLowerCase() == String(userReceived).toLowerCase()) {
                found = true;
                searchResult = { "ID": users[k]["id"] };
                break;
            }
        }

        if (found == false) {
            users.push(
                {
                    "id": users.length + 1,
                    "username": userReceived,
                    "password": hashedPwdData.hash.toString('hex'),
                    "salt": hashedPwdData.salt,
                    "friends": [
                        {
                            "id": 1,
                            "user": "bernardo"
                        },
                        {
                            "id": 2,
                            "user": "mari"
                        },
                        {
                            "id": 3,
                            "user": "matteo"
                        },
                        {
                            "id": 4,
                            "user": "mike"
                        },
                        {
                            "id": 5,
                            "user": "matt"
                        },
                        {
                            "id": 6,
                            "user": "will"
                        },
                        {
                            "id": 7,
                            "user": "senna"
                        },
                        {
                            "id": 8,
                            "user": "ben"
                        }
                    ],
                    "picture": ".\\images\\profiles\\default\\" + fs.readdirSync(".\\public\\images\\profiles\\default")[Math.floor(Math.random() * 14)],
                    "header": ".\\images\\headers\\default\\" + fs.readdirSync(".\\public\\images\\headers\\default")[Math.floor(Math.random() * 14)],
                    "bio": "Edit your bio!",
                    "posts": []
                }
            )
            var json = JSON.stringify({ "users": users });
            fs.writeFile(dbPath, json, (err) => {
                if (err) {
                    console.log(err);
                }
            });
        }

        res.send(searchResult);
        res.end();

    }

});

app.post('/accounts', function (req, res) {
    let rawData = fs.readFileSync(dbPath);
    let users = JSON.parse(rawData)["users"];
    var username = req.body['user'];
    var password = req.body['password'];

    if (username && password) {
        var searchResult = '';
        for (var k = 0; k < users.length; k++) {
            if (String(users[k]["username"]).toLowerCase() == String(username).toLowerCase()) {
                found = true;
                searchResult = { "ID": users[k]["id"] };
                break;
            }
        }
    }

    if (found == true) {
        req.session.loggedin = true;
        req.session.username = username;

        res.redirect(200, '/home');
    } else {
        res.send('An error occured while registering!');
        res.end();
    }
});

app.get('/home', function (req, res) {
    if (req.session.loggedin) {
        res.render('homepage.ejs', { "user": req.session.username });
    } else {
        res.render('login.ejs');
    }

});

app.post('/delete', function (req, res) {
    var userReceived = req.body['user'];

    if (req.session.loggedin) {
        req.session.destroy((err) => {
            if (err) {
                return console.log(err);
            }

            let rawData = fs.readFileSync(dbPath);
            let users = JSON.parse(rawData)["users"];

            for (var k = 0; k < users.length; k++) {
                if (users[k]["username"] == userReceived) {
                    users.splice(k, 1);
                }
            }

            let json = JSON.stringify({ "users": users });
            fs.writeFile(dbPath, json, (err) => {
                if (err) {
                    console.log(err);
                }
            });
            res.redirect('/index');
        });
    }
});

app.get('/profile', function (req, res) {
    if (req.session.loggedin) {
        res.render('profile.ejs',
            {
                "user": req.session.username
            }
        );
    } else {
        res.redirect('/index');
    }
});

app.get('/userprofile', function (req, res) {
    if (req.session.loggedin) {

        if (req.session.username == req.query.name) {
            res.render('profile.ejs',
                {
                    "user": req.session.username
                })
        } else {
            res.render('userprofile.ejs',
                {
                    "user": req.session.username,
                    "profile": req.query.name
                }
            );
        }
    } else {
        res.redirect('/index');
    }
});

app.get('/friends', function (req, res) {
    if (req.session.loggedin) {
        res.render('friends.ejs',
            {
                "user": req.session.username
            }
        );
    } else {
        res.redirect('/index');
    }
});

app.get('/discover', function (req, res) {
    if (req.session.loggedin) {
        res.render('discover.ejs',
            {
                "user": req.session.username
            }
        );
    } else {
        res.redirect('/index');
    }
});

app.post('/savePost', function (req, res) {
    var dataReceived = req.body['data'];
    if (req.session.loggedin) {
        let json = JSON.stringify({ "users": dataReceived });
        fs.writeFile(dbPath, json, (err) => {
            if (err) {
                console.log(err);
            } else {
                console.log("SUCCESSFUL INSERTING POST!");
            }
        });
    }
});

app.post('/saveComment', function (req, res) {
    var dataReceived = req.body['data'];
    if (req.session.loggedin) {
        let json = JSON.stringify({ "users": dataReceived });
        fs.writeFile(dbPath, json, (err) => {
            if (err) {
                console.log(err);
            } else {
                console.log("SUCCESSFUL INSERTING COMMENT!");
            }
        });
    }
});

app.post('/saveBio', function (req, res) {
    var dataReceived = req.body['data'];
    if (req.session.loggedin) {
        let json = JSON.stringify({ "users": dataReceived });
        fs.writeFile(dbPath, json, (err) => {
            if (err) {
                console.log(err);
            } else {
                console.log("SUCCESSFUL INSERTING BIO!");
            }
        });
    }
});

app.post('/follow', function (req, res) {
    var dataReceived = req.body['data'];

    if (req.session.loggedin) {
        let json = JSON.stringify({ "users": dataReceived });
        fs.writeFile(dbPath, json, (err) => {
            if (err) {
                console.log(err);
            } else {
                console.log("SUCCESSFUL FOLLOW!");
            }
        });
    }
});

app.post('/unfollow', function (req, res) {
    var dataReceived = req.body['data'];

    if (req.session.loggedin) {
        let json = JSON.stringify({ "users": dataReceived });
        fs.writeFile(dbPath, json, (err) => {
            if (err) {
                console.log(err);
            } else {
                console.log("SUCCESSFUL UNFOLLOW!");
            }
        });
    }
});

app.post("/upload", upload.single("picture"),
    (req, res) => {

        if (req.session.loggedin) {
            const tempPath = req.file.path;
            const fileName = "image-" + uuid.v4() + ".png";
            const targetPath = path.join(__dirname, "\\public\\images\\profiles\\uploaded\\" + fileName);
            const relativeTargetPath = ".\\images\\profiles\\uploaded\\" + fileName;

            fs.rename(tempPath, targetPath, err => {
                if (err) return handleError(err, res);

                res
                    .status(200)
                    .end();
            });

            // Update database
            let rawData = fs.readFileSync(dbPath);
            let users = JSON.parse(rawData)["users"];
            let currUser = req.session.username;

            for (var k = 0; k < users.length; k++) {
                if (users[k]["username"] == currUser) {
                    users[k]["picture"] = relativeTargetPath;
                    for (var j = 0; j < users[k]["posts"].length; j++) {
                        users[k]["posts"][j]["pic"] = relativeTargetPath;
                    }
                }
            }

            var json = JSON.stringify({ "users": users });
            fs.writeFile(dbPath, json, (err) => {
                if (err) {
                    console.log(err);
                }
            });

        }
    }
);

app.post("/uploadHeader", upload.single("picture"),
    (req, res) => {

        if (req.session.loggedin) {
            const tempPath = req.file.path;
            const fileName = "image-" + uuid.v4() + ".png";
            const targetPath = path.join(__dirname, "\\public\\images\\headers\\uploaded\\" + fileName);
            const relativeTargetPath = ".\\images\\headers\\uploaded\\" + fileName;

            fs.rename(tempPath, targetPath, err => {
                if (err) return handleError(err, res);

                res
                    .status(200)
                    .end();
            });

            // Update database
            let rawData = fs.readFileSync(dbPath);
            let users = JSON.parse(rawData)["users"];
            let currUser = req.session.username;

            for (var k = 0; k < users.length; k++) {
                if (users[k]["username"] == currUser) {
                    users[k]["header"] = relativeTargetPath;
                }
            }

            var json = JSON.stringify({ "users": users });
            fs.writeFile(dbPath, json, (err) => {
                if (err) {
                    console.log(err);
                }
            });

        }
    }
);

const PORT = process.env.PORT || 8080;
app.listen(PORT, function () {
    if (process.env.NODE_ENV == "development") {
        console.log("Node Server is running smoothly in development mode :)");
    } else {
        console.log("Node Server is running smoothly in production mode :)");
    }
})