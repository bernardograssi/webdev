import React from "react";
import './user.css';

class User extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            username: props.data.user,
            currentUser: props.data.currentUser,
            online: props.data.online,
            followingStatus: props.data.followingStatus
        }
    }

    componentDidMount() {
        // Add function for following user here.
        const followButton = document.getElementById(this.state.username + '-btn');

        (this.state.followingStatus) ? bindUnfollowAction(followButton, this.state.username) : bindFollowAction(followButton, this.state.username);

        async function bindFollowAction(button, username) {
            button.disabled = false;
            console.log('in follow')
            button.textContent = "Follow";
            button.onclick = async () => {
                const requestOptions = {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        'toFollow': username
                    }),
                    credentials: "include"
                }
                await fetch('http://localhost:8080/follow', requestOptions)
                    .then(() => {
                        console.log('IN FOLLOW THEN');
                        button.textContent = "Unfollow";
                        bindUnfollowAction(button, username);
                    });
            }
        }

        async function bindUnfollowAction(button, username) {
            button.disabled = false;
            console.log('in unfollow')
            button.textContent = "Unfollow";
            button.onclick = async () => {
                const requestOptions = {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        'toUnfollow': username
                    }),
                    credentials: "include"
                }
                await fetch('http://localhost:8080/unfollow', requestOptions)
                    .then(() => {
                        console.log('IN UNFOLLOW THEN');
                        button.textContent = "Follow";
                        bindFollowAction(button, username);
                    });
            }
        }

        // Change the color of the status dot based on if the user is online or not.
        const dot = document.getElementById(this.state.username + '-dot');
        (this.state.online) ? dot.style.backgroundColor = "green" : dot.style.backgroundColor = "red";
    }

    render() {
        return (
            <div className="user-div">
                <span className="status-dot" id={this.state.username + '-dot'}></span>
                <h3 className="username">{this.state.username}</h3>
                <div id="button-holder">
                    <button className="follow-button" id={this.state.username + '-btn'}>Follow</button>
                </div>
            </div>
        )
    }
}

export default User;