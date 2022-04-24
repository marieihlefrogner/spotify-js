import Spotify from "./spotify";
import config from "./config";

const spotify = new Spotify(config);

export const currentlyPlaying = async () => {
    const song = await spotify.getCurrentSong();

    if (!song) return;

    console.log(song);
    
    console.log(`${song.name} - ${song.artist} :: ${song.album}`);
}

currentlyPlaying();