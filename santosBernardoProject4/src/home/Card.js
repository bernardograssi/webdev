import React from "react";
import './card.css';

class Card extends React.Component {
    // Build constructor here with the arguments being the song information
    constructor(props) {
        super();
        this.state = {
            name: props.name,
            songs: props.items,
            path: props.items.path,
            id: props.items.id,
            showMe: true
        }
    }

    async getState(){
        return "";
    }

    async changeState() {
        this.setState({
            showMe: false
        });

        // Update database
        await fetch("http://localhost:8080/deletesong", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            credentials: "include",
            body: JSON.stringify({ "songPath": this.state.path })
        }).then(res => {
            if (res) {
                console.log("Succesfully deleted song from MySQL")
            } else {
                console.log("Error while deleting song from MySQL")
            }
        })
    }

    delta() {
        let confirm = window.confirm("Are you sure you want to delete this song? You will not be able to recover it.");

        // If user confirms that he wants to delete the song
        if (confirm) {

            // Update state so that page gets rerendered and Card will disappear from page
            this.setState({
                showMe: false
            })

            // Update database
            fetch("http://localhost:8080/deletesong", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                credentials: "include",
                body: JSON.stringify({ "songPath": this.state.path })
            }).then(res => {
                if (res) {
                    console.log("Succesfully deleted song from MySQL")
                } else {
                    console.log("Error while deleting song from MySQL")
                }
            })

        } else {
            // Do nothing
        }
    }

    render() {

        // If Card has not been deleted
        if (this.state.showMe) {
            return (
                <div className='draggable-song' draggable='true' id={this.state.id} datainfo={this.state.path.substring(8)}>
                    <div className="player-card">
                        <ul>
                            <li className="cover-card">
                                <img id={"img-cover-" + this.state.id} src={(this.state.songs["albumCover"])} alt="" /></li>
                            <li className="info-card">
                                <h1 id={"h1-card-" + this.state.id}>{this.state.songs["artist"]}</h1>
                                <h4 id={"h4-card-" + this.state.id}>{this.state.songs["title"]}</h4>
                                <h2 id={"h2-card-" + this.state.id}>{this.state.songs["album"]}</h2>
                                <div className="button-items-card">
                                    <div className="controls-card">
                                        <div className="delete-btn">
                                            <button className="btn" onClick={this.props.handler}>
                                                <i className="fa fa-trash"></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </li>
                        </ul>
                    </div>
                    <br></br>
                    <br></br>
                    <br></br>
                    <br></br>
                    <br></br>
                    <br></br>
                    <br></br>
                    <br></br>
                    <br></br>
                    <br></br>
                    <br></br>
                    <br></br>
                </div>
            )
        }

        // If user deleted Card, then return nothing
        else {
            return ("");
        }
    }
}

export default Card;