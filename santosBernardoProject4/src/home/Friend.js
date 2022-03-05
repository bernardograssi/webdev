import React from "react";
import './friend.css';

class Friend extends React.Component{
    constructor(props){
        super(props);
        this.state = {
            song: props.data.title,
            user: props.data.user
        }
    }

    componentDidMount(){

    }

    render(){
        return(
            <div className="friend-div">
                <i className="fas fa-music"></i> 
                <div className="username-friend">
                    <h4>{this.state.user}</h4>
                    <p>{this.state.song}</p>
                </div>
            </div>
        )
    }

}

export default Friend;