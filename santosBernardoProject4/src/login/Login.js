import React, { useState } from 'react';
import PropTypes from 'prop-types';
import './login.css';

async function loginUser(credentials) {
    return fetch('http://localhost:8080/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(credentials),
        credentials: "include"
    })
        .then(data => data.json())
}

async function registerUser(credentials) {
    
    return fetch('http://localhost:8080/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Cache': 'no-cache'
        },
        body: JSON.stringify(credentials),
        credentials: "include"
    }).then(data => data.json())
}

export default function Login({ setToken }) {
    const [username, setUserName] = useState();
    const [password, setPassword] = useState();

    const handleSignInSubmit = async e => {
        e.preventDefault();
        const token = await loginUser({
            username,
            password
        });

        console.log("Login Token => " + token);
        console.log(token);

        if (Object.keys(token).length === 0) {
            document.getElementById("signInWarning").style.visibility = "visible";
            document.getElementById("signInWarning").style.backgroundColor = "red";
            document.getElementById("signInWarning").innerHTML = "Incorrect Username/Password!";
        } else {
            document.getElementById("signInWarning").style.visibility = "visible";
            document.getElementById("signInWarning").style.backgroundColor = "green";
            document.getElementById("signInWarning").innerHTML = "Login successful!";

            setToken(token);
        }
    }

    const handleSignUpSubmit = async e => {
        e.preventDefault();
        const token = await registerUser({
            username,
            password
        });

        console.log("Register Token => " + token);

        if (Object.keys(token).length === 0) {
            document.getElementById("signUpWarning").style.visibility = "visible";
            document.getElementById("signUpWarning").style.backgroundColor = "red";
            document.getElementById("signUpWarning").innerHTML = "Username already in use!";
        } else {
            document.getElementById("signUpWarning").style.visibility = "visible";
            document.getElementById("signUpWarning").style.backgroundColor = "green";
            document.getElementById("signUpWarning").innerHTML = "Register successful!";

            setToken(token);
        }
    }

    const handleSignUpAnimation = async e => {
        const container = document.getElementById('container');
        container.classList.add("right-panel-active");

        document.getElementById("userSignUp").setAttribute("required", "true");
        document.getElementById("pwdSignUp").setAttribute("required", "true");

        document.getElementById("userSignIn").setAttribute("required", "false");
        document.getElementById("pwdSignIn").setAttribute("required", "false");
    }

    const handleSignInAnimation = async e => {
        const container = document.getElementById('container');
        container.classList.remove("right-panel-active");

        document.getElementById("userSignUp").setAttribute("required", "false");
        document.getElementById("pwdSignUp").setAttribute("required", "false");

        document.getElementById("userSignIn").setAttribute("required", "true");
        document.getElementById("pwdSignIn").setAttribute("required", "true");
    }

    return (
        <div className="Login">
            <h2>BeatDrop Login/Register Page</h2>
            <div className="container" id="container">
                <div className="form-container sign-up-container">
                    <form onSubmit={handleSignUpSubmit}>
                        <h1>Create Account</h1>
                        <span>or use your email for registration</span>
                        <input id="userSignUp" type="text" placeholder="Name" onChange={e => setUserName(e.target.value)} />
                        <input id="pwdSignUp" type="password" placeholder="Password" onChange={e => setPassword(e.target.value)} />
                        <br></br>
                        <div id="signUpWarning">
                        </div>
                        <br></br>
                        <button>Sign Up</button>
                    </form>
                </div>
                <div className="form-container sign-in-container">
                    <form onSubmit={handleSignInSubmit}>
                        <h1>Sign in</h1>
                        <br></br>
                        <input id="userSignIn" type="text" placeholder="Username" onChange={e => setUserName(e.target.value)} required />
                        <input id="pwdSignIn" type="password" placeholder="Password" onChange={e => setPassword(e.target.value)} required />
                        <br></br>
                        <div id="signInWarning">
                        </div>
                        <br></br>
                        <button type="submit">Sign In</button>
                    </form>
                </div>
                <div className="overlay-container">
                    <div className="overlay">
                        <div className="overlay-panel overlay-left">
                            <h1>Welcome Back!</h1>
                            <p>Click here to start listening again!</p>
                            <button className="ghost" id="signIn" onClick={handleSignInAnimation}>Sign In</button>
                        </div>
                        <div className="overlay-panel overlay-right">
                            <h1>Don't have an account yet?</h1>
                            <p>Click Here to Sign Up and start Listening!</p>
                            <button className="ghost" id="signUp" onClick={handleSignUpAnimation}>Sign Up</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

Login.propTypes = {
    setToken: PropTypes.func.isRequired
};