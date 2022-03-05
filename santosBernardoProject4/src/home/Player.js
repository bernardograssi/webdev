import React from "react";
import './player.css';
import low_speaker from '../graphics/speaker-small-volume.png';
import high_speaker from '../graphics/speaker-full-volume.png';

class Player extends React.Component {

    constructor(props) {
        super();
        this.state = {
            albumCover: props.items.albumCover,
            title: props.items.title,
            artists: props.items.artists,
            album: props.items.album,
            mp3: props.items.mp3,
            id: props.items.id,
            volume: .5
        }

        this.setCurrentSong = this.setCurrentSong.bind(this);
        this.removeCurrentSong = this.removeCurrentSong.bind(this);
        this.changeVolume = this.changeVolume.bind(this);
    }

    async setCurrentSong() {
        const requestOptions = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 'song': String(this.state.title) }),
            credentials: "include"
        };

        await fetch('http://localhost:8080/setcurrentsong', requestOptions);
    }

    async removeCurrentSong() {
        const requestOptions = {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: "include"
        };

        await fetch('http://localhost:8080/removeCurrentSong', requestOptions);
    }

    changeVolume(volume) {
        this.setState({'volume': volume});
        console.log(volume);
        document.getElementById('music').volume = volume**2;
    }

    componentDidMount() {
        var music = document.getElementById("music");
        var playButton = document.getElementById("play-" + this.state.id);
        var pauseButton = document.getElementById("pause-" + this.state.id);
        var playhead = document.getElementById("elapsed");
        var timeline = document.getElementById("slider");
        var timer = document.getElementById("timer");
        var duration;
        pauseButton.style.visibility = "hidden";

        var timelineWidth = timeline.offsetWidth - playhead.offsetWidth;

        music.addEventListener("timeupdate", timeUpdate, false);

        function timeUpdate() {
            var playPercent = timelineWidth * (music.currentTime / duration);
            playhead.style.width = playPercent + "px";

            var secondsIn = Math.floor(((music.currentTime / duration) / 3.5) * 100);
            if (secondsIn <= 9) {
                timer.innerHTML = "0:0" + secondsIn;
            } else {
                timer.innerHTML = "0:" + secondsIn;
            }
        }

        playButton.onclick = function () {
            music.play();
            playButton.style.visibility = "hidden";
            pauseButton.style.visibility = "visible";
        }

        pauseButton.onclick = function () {
            music.pause();
            playButton.style.visibility = "visible";
            pauseButton.style.visibility = "hidden";
        }

        music.addEventListener("canplaythrough", function () {
            duration = music.duration;
        }, false);

        const observer = new MutationObserver((mutations) => {
            mutations.forEach((record) => {
                if (record.target.style.visibility === "hidden") {
                    this.setCurrentSong();
                } else {
                    this.removeCurrentSong();
                }
            })
        });

        observer.observe(playButton, { attributes: true, attributeFilter: ['style'] });
    }

    render() {
        return (
            <div className="player" id={"player-" + this.state.id}>
                <ul>
                    <li className="cover">
                        <img src={this.state.albumCover} alt="" /></li>
                    <li className="info">
                        <h1 id="h1">{this.state.artists}</h1>
                        <h4 id="h4">{this.state.album}</h4>
                        <h2 id="h2">{this.state.title}</h2>

                        <div className="button-items">
                            <audio id="music" preload="auto" loop={false}>
                                <source src={this.state.mp3} type="audio/mp3" />
                            </audio>
                            <div id="slider">
                                <div id="elapsed"></div>
                            </div>
                            <p id="timer">0:00</p>
                            <div className="controls">
                                <svg className="play" id={"play-" + this.state.id} viewBox="0 0 25 25" xmlSpace="preserve">
                                    <defs><rect x="-49.5" y="-132.9" width="446.4" height="366.4" /></defs>
                                    <g><circle fill="none" cx="12.5" cy="12.5" r="10.8" />
                                        <path fillRule="evenodd" clipRule="evenodd" d="M8.7,6.9V18c0,0,0.2,1.4,1.8,0l8.1-4.8c0,0,1.2-1.1-1-2L9.8,6.5 C9.8,6.5,9.1,6,8.7,6.9z" />
                                    </g>
                                </svg>
                                <svg className="pause" id={"pause-" + this.state.id} viewBox="0 0 25 25" xmlSpace="preserve">
                                    <g>
                                        <rect x="6" y="4.6" width="3.8" height="15.7" />
                                        <rect x="14" y="4.6" width="3.9" height="15.7" />
                                    </g>
                                </svg>
                            </div>
                            <div>
                                <h5 className="volume-header"></h5>
                                <section>
                                    <div className='volume-slider-container'>
                                        <img className='volume-images' src={low_speaker} alt={''}></img>
                                        <input className='volume-slider' type="range" min={0.000} max={1.000} step={.001} value={this.state.volume} onChange={event => {this.changeVolume(event.target.valueAsNumber)}}/>
                                        <img className='volume-images' src={high_speaker} alt={''}></img>
                                    </div>
                                </section>
                            </div>
                        </div>
                    </li>
                </ul>
            </div>
        )
    }
}

export default Player;