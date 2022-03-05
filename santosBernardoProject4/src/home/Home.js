import React from 'react';
import './home.css';
import logo from '../graphics/Buttons/Play btn/play-reg.png';
import Player from './Player';
import Card from './Card';
import Friend from './Friend';
import uuid from "uuid";
import User from './User';

const sleep = (milliseconds) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
}

function b64toBlob(b64Data, contentType = '', sliceSize = 512) {
    const byteCharacters = atob(decodeURIComponent(b64Data));
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
        const slice = byteCharacters.slice(offset, offset + sliceSize);

        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
        }

        const byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
    }

    const blob = new Blob(byteArrays, { type: contentType });
    return blob;
}

async function saveBase64(theFile, theType) {
    var reader = new FileReader();
    reader.readAsDataURL(theFile);
    reader.onload = function () {
        var image = reader.result;
        var base64ImageContent = image.replace(/^data:(image|audio)\/(png|jpg|jpeg|mpeg);base64,/, "");

        // Save .mp3 file from user input
        if (theType.includes("mpeg")) {
            let blob = b64toBlob(base64ImageContent, 'audio/mpeg');
            let formData = new FormData();
            formData.append('song', blob);

            fetch("http://localhost:8080/addsong", {
                method: "POST",
                body: formData,
                credentials: "include"
            }).then(
                alert('.mp3 file has been successfully uploaded!')
            );

            reader.onerror = function (error) {
                console.log('Error: ', error);
            };
        }

        // Save .png, .jpg, or .jpeg from user input
        else {
            let blob = b64toBlob(base64ImageContent, 'image/png');
            let formData = new FormData();
            formData.append('picture', blob);


            fetch("http://localhost:8080/upload", {
                method: "POST",
                body: formData,
                credentials: "include"
            }).then(
                alert('Profile picture has been successfully updated!')
            );

            reader.onerror = function (error) {
                console.log('Error: ', error);
            };
        }
    }
}

function uploadPicture() {
    document.getElementById("fileinput").click();
}

function handleFileUpload(e) {

    // Read file
    var reader = new FileReader();
    reader.onload = function () {
        var output = document.getElementById('profile-pic');
        output.src = reader.result;
    };

    // Read file as URL
    reader.readAsDataURL(e.target.files[0]);

    // Upload file to server
    const file = e.target.files[0];
    var type_ = String(file["type"]).split("/")[1];
    saveBase64(file, type_);
}

async function handleSongUpload(e, currentUser) {
    // Read file
    var reader = new FileReader();
    reader.onload = function () {
        console.log("Successful upload");
    };

    // Read file as URL
    reader.readAsDataURL(e.target.files[0]);

    // Upload file to server
    const file = e.target.files[0];
    var type_ = String(file["type"]).split("/")[1];

    // Get ID3 info from current file
    await saveBase64(file, type_);

    // Sleep for .5 seconds
    await sleep(500);
    await window.helloComponent.fetchUserData();
    e.target.value = null;
}

function addSong(e) {
    e.preventDefault();
    document.getElementById("songinput").click();
}

function logout(e) {
    console.log("Logging out...")
    localStorage.clear();
    window.location.replace('/');
}

class Home extends React.Component {

    constructor(props) {
        super(props);
        this.elements = {};
        this.state = {
            error: null,
            isPlay: false,
            isLoaded: false,
            isLoadedAfter: false,
            isUpdate: false,
            picture: "",
            items: {},
            player: {},
            allUsersPresent: false,
            allUsers: [],
            friendsSongsPresent: false,
            friendsSongs: []
        };

        this.getAllUsers = this.getAllUsers.bind(this);
        this.getCurrentSongs = this.getCurrentSongs.bind(this);
    }

    async fetchUserData() {
        console.log("fetching...");
        await fetch("http://localhost:8080/currentUser", {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            credentials: "include"
        })
            .then(res => res.json())
            .then(
                async (result) => {
                    console.log("started to set the state...")
                    this.setState({
                        isLoaded: true,
                        items: {
                            "currUser": result.currUser,
                            "songs": JSON.parse(JSON.stringify(result.songs)),
                            "friends": result.friends,
                            "path": result.path
                        }
                    });

                    console.log("setting the state...");

                    if (result.songs.length > 0) {
                        this.setState({
                            isLoadedAfter: true
                        });
                    }

                },
                (error) => {
                    this.setState({
                        isLoaded: false,
                        error
                    });
                }
            )

        console.log("finished setting the state.")
    }

    async getAllUsers() {
        await fetch('http://localhost:8080/allusers', {
            headers: {
                'Accept': 'application/json'
            },
            credentials: "include"
        }).then(res => res.json()).then(async (result) => {
            if (result.length > 0) {
                this.setState({
                    allUsersPresent: true,
                    allUsers: result
                })
            }

        })
    }

    async getCurrentSongs(){
        await fetch('http://localhost:8080/getcurrentsongs', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            credentials: 'include'
        })
        .then(res => res.json())
        .then(async (result) => {
            console.log(result);

            // If there is any song currently being played by one of the user's friends
            if(result.length > 0){
                this.setState({
                    friendsSongsPresent: true,
                    friendsSongs: result
                })
            }

        })

    }

    async componentDidMount() {
        var origin = undefined;
        const self = this;
        var dropTarget = document.getElementById("play-container");

        window.addEventListener("dragstart", function (e) {
            origin = e.target;
        });

        window.addEventListener("dragend", function (e) {
            
        });

        window.addEventListener("dragover", function (e) {
            e.preventDefault();
        })

        window.addEventListener("drop", async (e) => {
            var target = e.target;
            // If origin exists.
            if (origin !== undefined) {

                // If the drag comes from the draggable area and the drop target contains the target area.
                if (origin.className === "draggable-song" && dropTarget.contains(target)) {

                    // If there is any song being currently played.
                    if (self.state.isPlay === true) {

                        // If we are updating the player for at least the 2nd time.
                        if (self.state.isUpdate === true) {
                            self.setState({
                                isPlay: true,
                                isUpdate: false,
                                player: {
                                    albumCover: document.getElementById("img-cover-" + origin.id).src,
                                    title: document.getElementById("h4-card-" + origin.id).innerHTML,
                                    artists: document.getElementById("h1-card-" + origin.id).innerHTML,
                                    album: document.getElementById("h2-card-" + origin.id).innerHTML,
                                    mp3: origin.getAttribute("datainfo"),
                                    id: origin.getAttribute("id")
                                }
                            })
                        } 
                        
                        // If it is the first time we update the player (i.e.: the first time we replace a song in the player with another).
                        else {
                            self.setState({
                                isPlay: true,
                                isUpdate: true,
                                player: {
                                    albumCover: document.getElementById("img-cover-" + origin.id).src,
                                    title: document.getElementById("h4-card-" + origin.id).innerHTML,
                                    artists: document.getElementById("h1-card-" + origin.id).innerHTML,
                                    album: document.getElementById("h2-card-" + origin.id).innerHTML,
                                    mp3: origin.getAttribute("datainfo"),
                                    id: origin.getAttribute("id")
                                }
                            })
                        }
                    } 
                    
                    // If this is the first time we DROP a song into the player.
                    else {
                        self.setState({
                            isPlay: true,
                            isUpdate: false,
                            player: {
                                albumCover: document.getElementById("img-cover-" + origin.id).src,
                                title: document.getElementById("h4-card-" + origin.id).innerHTML,
                                artists: document.getElementById("h1-card-" + origin.id).innerHTML,
                                album: document.getElementById("h2-card-" + origin.id).innerHTML,
                                mp3: origin.getAttribute("datainfo"),
                                id: origin.getAttribute("id")
                            }
                        })
                    }

                    // Update universal map where the songs currently playing are stored.
                    // const requestOptions = {
                    //     method: 'POST',
                    //     headers: {'Content-Type': 'application/json'},
                    //     body: JSON.stringify({'song': String(self.state.player.title)}),
                    //     credentials: "include"
                    // };

                    // await fetch('http://localhost:8080/setcurrentsong', requestOptions)
                    //     .then(console.log("Just added the current song to the map!"))
                }
            }
        });

        this.fetchUserData();
    }

    handler = async (id) => {
        let confirm = window.confirm("Are you sure you want to delete this song? You will not be able to recover it.");
        // If user confirms that he wants to delete the song
        if (confirm) {
            // Update state so that page gets rerendered and Card will disappear from page
            await this.elements[id].changeState(); // Deletes the song from database and renders an empty string from Card
            this.fetchUserData(); // Get up-to-date data from user

            // Change the state of the player so that the song is also removed from the player
            if (document.getElementById("player-" + id)) {
                if (document.getElementById("player-" + id).getAttribute("id").substring(7) === id) {
                    this.setState({
                        isPlay: false
                    });


                }
            }

            // Update the current list of songs to reflect the change made from the removal
            if (this.state.items.songs !== undefined) {
                if (this.state.items.songs.length > 0) {
                    let updtodateSongs = [];
                    for (var i = 0; i < this.state.items.songs.length; i++) {
                        if (this.state.items.songs[i]["id"] !== id) {
                            updtodateSongs.push(this.state.items.songs[i]);
                        }
                    }

                    let afterFlag = this.state.isLoadedAfter;
                    // If there are no songs in the list, set isLoadedAfter to false so that the warning "You have not added any songs yet" shows up to user
                    if (updtodateSongs.length === 0) {
                        afterFlag = false;
                    }

                    // Change the state of the current Component so that it gets re-rendered with the right information
                    this.setState({
                        isLoadedAfter: afterFlag,
                        items: {
                            "currUser": this.state.items.currUser,
                            "songs": updtodateSongs,
                            "friends": this.state.items.friends,
                            "path": this.state.items.path
                        }
                    })
                }

                // If there are no songs in the list, set isLoadedAfter to false so that the warning "You have not added any songs yet" shows up to user

                else {
                    this.setState({
                        isLoadedAfter: false
                    })
                }
            }

            // If there are no songs in the list, set isLoadedAfter to false so that the warning "You have not added any songs yet" shows up to user
            else {
                this.setState({
                    isLoadedAfter: false
                })
            }

            // Force re-render
            this.forceUpdate();
        }

        // If user does not wish to move forward with the song removal
        else {
            // Do nothing
        }

        // Force re-render
        this.forceUpdate();


    }

    render() {
        return (
            <div className="home">
                <div id='home-page'>
                    <div id='home-header'>
                        <div id='logo-container'>
                            <img width="360" height="108" src='BeatDropLogoLarge.png' alt=""></img>
                        </div>
                        <div id='add-song-container'>
                            <button type='button' onClick={addSong} id='add-song-btn'>Add Song</button>
                            <input type="file" id="songinput" name="file" accept="audio/mp3" onChange={(e) => handleSongUpload(e, this.state.items.currUser)} />
                        </div>
                        <div id='profile-pic-container' onClick={uploadPicture}>
                            <input type="file" id="fileinput" name="file" accept="image/*" onChange={handleFileUpload} />
                            <img id='profile-pic' width="90" height="80" src={this.state.items.path} alt=""></img>
                            <img id='profile-arrow' width="90" height="80" src='https://www.healthandcare.co.uk/user/products/large/Social-distancing-arrow-floor-sticker-blue.png' alt="" />
                        </div>
                        <div id='profile-info-container'>
                            <button type='button' onClick={logout} id='logout-btn'>Logout</button>
                        </div>
                    </div>
                    <div id='home-body'>
                        <div id='song-list-container' className='float-left'>
                            {this.state.isLoadedAfter ? this.state.items.songs.map(element => {
                                return (<Card key={element["title"] + (element.id)} items={element} handler={() => this.handler(element.id)} ref={el => this.elements[element.id] = el} />)
                            }) : <h1 id="song-warning">You have not added any songs yet!</h1>}
                        </div>
                        <div id='play-container' className='float-child'>
                            {this.state.isPlay === true && this.state.isUpdate === false ? <Player key={this.state.player.title + uuid.v4()} items={this.state.player} /> : [this.state.isPlay === false ? <img key="wat" id='play-btn' src={logo} alt='Play'></img> : ""]}
                            {this.state.isUpdate === true && this.state.isPlay === true ? <Player key={this.state.player.title + uuid.v4()} items={this.state.player} /> : ""}
                        </div>
                        <div id='friends-container'>
                        </div>
                    </div>
                </div>
                <div id='home-footer'>
                    <div id='all-users-list-container'>
                        <input type='checkbox' id='all-users-toggle' onClick={this.getAllUsers}></input>
                        <label htmlFor='all-users-toggle' className='all-users-list-label'>ALL USERS</label>
                        <div id='all-users-list'>
                            {this.state.allUsersPresent ? this.state.allUsers.map((e) => { return (<User key={e.username + "-" + uuid.v4()} data={e} />)}) : <h3>No users found :(</h3>}
                        </div>
                    </div>

                    {
                    /*
                    
                    <div id='volume-control-container'>
                        <div id='volume-control'>
                            <input class="range" type="range" name ="" value="300" min="0" max="1000" onChange="rangeSlide(this.value)" onmousemove="rangeSlide(this.value)"></input>
                        </div>
                    </div>
                    
                    /*
                    <div id='friend-song-list-container'>
                        <input type='checkbox' id='friend-song-list-toggle'></input>
                        <label htmlFor='friend-song-list-toggle'>USER</label>
                        <div id='friend-song-list'>
                            Friend Song List
                        </div>
                    </div>
                    */
                    }
                    <div id='friends-list-container'>
                        <input type='checkbox' id='friend-list-toggle' onClick={this.getCurrentSongs}></input>
                        <label htmlFor='friend-list-toggle'>FRIENDS</label>
                        <div id='friends-list'>
                            {this.state.friendsSongsPresent ? this.state.friendsSongs.map((e) => {return (
                                <Friend key={e.user + "-" + uuid.v4()} data={e}/>
                            )}) : <h3>No songs currently being played :(</h3>}
                        </div>
                    </div>
                </div>
            </div>

        );
    }
}

export default Home;