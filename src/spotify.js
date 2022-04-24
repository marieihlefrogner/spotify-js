import { post, get } from 'request-promise-native';
import moment from 'moment';

const tokenRefreshEndpoint = 'https://accounts.spotify.com/api/token';
const apiEndpoint = 'https://api.spotify.com/v1/me/player';


export default class SpotifyConnector {

  constructor(credentials) {
    this.credentials = credentials;
    this.tokenExpiresAt = moment();
  }

  retrieveCurrentlyPlaying() {
    if (moment().isBefore(this.tokenExpiresAt)) {
      return this.getSpotifyData();
    }
    
    return this.refreshAccessToken()
      .then((response) => {
        // console.log('Refreshed access token because it has expired. Expired at: %s now is: %s',
        // this.tokenExpiresAt.format('HH:mm:ss'), moment().format('HH:mm:ss'));

        this.credentials.accessToken = response.access_token;
        this.tokenExpiresAt = moment().add(response.expires_in, 'seconds');

        return this.getSpotifyData();
      })
      .catch((err) => {
        // console.error(err);
        console.error("Unable to authenticate:", err.message);
      });
  }

  refreshAccessToken() {
    let client_id = this.credentials.clientID;
    let client_secret = this.credentials.clientSecret;

    let options = {
      url: tokenRefreshEndpoint,
      headers: { 'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64')) },
      form: {
        grant_type: 'refresh_token',
        refresh_token: this.credentials.refreshToken
      },
      json: true
    };

    return post(options);
  }

  getSpotifyData() {
    let options = {
      url: apiEndpoint,
      headers: {'Authorization': 'Bearer ' + this.credentials.accessToken},
      json: true
    };

    return get(options);
  }

  async getCurrentSong() {
    const data = await this.retrieveCurrentlyPlaying();
    
    if (!data || !data.item) {
      return;
    }

    const song = {};

    song.name = data.item.name;
    song.progress_ms = data.progress_ms;
    song.shuffle = data.shuffle_state;
    song.repeat = data.repeat_state !== "off";
    song.type = data.currently_playing_type;
    song.duration_ms = data.item.duration_ms;
    song.is_playing = data.is_playing;    
    song.duration_percent = song.progress_ms / song.duration_ms * 100;

    if (data.item.artists && data.item.artists.length) {
      song.artist = data.item.artists[0].name;
    }

    if (data.item.album) {
      song.album = data.item.album.name;
    }

    return song;
  }
};
