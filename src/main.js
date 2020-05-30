const spotify = require("./spotify_funcs");
var fs = require("fs");
const configs = require("./config.js");
var readline = require("readline");
var { google } = require("googleapis");
var OAuth2 = google.auth.OAuth2;

// Prerequisites
// 1. node.js
// 2. yarn
// 3. Must have registered app with both Spotify and Youtube, get client ID's and SECRETS from there (see docs on how to do this).
//  - For Spotify, paste client_id and server_id in a spotify_secrets file to import into config
//    Generate an Oauth token here (1h expiry) and paste into same spotify_secrets file- https://developer.spotify.com/console/post-playlists/?user_id=aic205&body=%7B%22name%22%3A%22Test%22%2C%22description%22%3A%22hi%22%2C%22public%22%3Atrue%7D
//  - For Youtube, see docs for how to generate client_secret.json (I have renamed to youtube_secrets) - download and add to src

// Run node.main.js on command line
// It will generate youtube auth token and then sync a "Music" playlist on your channel with a playlist you can name in config

// DISCLAIMER: Uses code provided by Youtube Data API to generate token/get channel or playlist

// Outline of program
// DONE Login to youtube
// Get likes
// DONE Create playlist
// DONE add to if already exists
// DONE Get spotify uri
// DONE Add song to playlist

// If modifying these scopes, delete your previously saved credentials at ~/.credentials/youtube-nodejs-quickstart.json
var SCOPES = ["https://www.googleapis.com/auth/youtube.readonly"];
var TOKEN_DIR =
  (process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE) +
  "/.credentials/";
var TOKEN_PATH = TOKEN_DIR + "youtube-nodejs-quickstart.json";

// Load client secrets from a local file
fs.readFile("youtube_secrets.json", function processClientSecrets(
  err,
  content
) {
  if (err) {
    console.log(
      `${configs.colours.red}Status ${err.response.status}: ${err.response.data.error} Error loading client secret file :( ${configs.colours.reset}`
    );
    return;
  }
  // Authorize a client with the loaded credentials, then call the YouTube API to get songs in music playlist
  authorize(JSON.parse(content), getSongs);
});

function authorize(credentials, callback) {
  var clientSecret = credentials.installed.client_secret;
  var clientId = credentials.installed.client_id;
  var redirectUrl = credentials.installed.redirect_uris[0];
  var oauth2Client = new OAuth2(clientId, clientSecret, redirectUrl);

  // Check if we have previously stored a token
  fs.readFile(TOKEN_PATH, function(err, token) {
    if (err) {
      getNewToken(oauth2Client, callback);
    } else {
      oauth2Client.credentials = JSON.parse(token);
      callback(oauth2Client);
    }
  });
}

// Gets and stores new token after prompting for user authorization, and then
// execute the given callback with the authorized OAuth2 client.
// oauth2Client is the OAuth2 client to get token for
function getNewToken(oauth2Client, callback) {
  var authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES
  });
  console.log("Authorize this app by visiting this url: ", authUrl);
  var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  // Copy the code from the url into the console
  rl.question("Enter the code from that page here: ", function(code) {
    rl.close();
    oauth2Client.getToken(code, function(err, token) {
      if (err) {
        console.log("TOKEN", token);
        console.log(
          `${configs.colours.red} Status ${err.response.status} Error while trying to retrieve access token :( ${configs.colours.reset}`
        );
        return;
      }
      oauth2Client.credentials = token;
      storeToken(token);
      callback(oauth2Client);
    });
  });
}

// Store token to disk
function storeToken(token) {
  try {
    fs.mkdirSync(TOKEN_DIR);
  } catch (err) {
    if (err.code != "EEXIST") {
      throw err;
    }
  }
  fs.writeFile(TOKEN_PATH, JSON.stringify(token), err => {
    if (err) throw err;
    console.log("Token stored to " + TOKEN_PATH);
  });
}

// auth is an authorized OAuth2 client
function getSongs(auth) {
  var service = google.youtube("v3");
  service.channels.list(
    {
      auth: auth,
      part: "snippet,contentDetails,statistics",
      forUsername: "GoogleDevelopers"
    },
    function(err, response) {
      if (err) {
        console.log("The API returned an error: " + err);
        return;
      }
      var channels = response.data.items;
      if (channels.length == 0) {
        console.log("No channel found.");
      } else {
        console.log(
          "This channel's ID is %s. Its title is '%s', and " +
            "it has %s views.",
          channels[0].id,
          channels[0].snippet.title,
          channels[0].statistics.viewCount
        );
      }
    }
  );
}

async function mainMethod() {
  // Auth
  // Get yt likes, song names

  let playlistId = await spotify.searchForPlaylist();
  if (playlistId) {
    let songUri = await spotify.searchForTrack("veteran bou");
    console.log(playlistId);
    console.log(songUri);
    spotify.addToPlaylist(playlistId, songUri);
  } else {
    playlistId = await spotify.createPlaylist();
    let songUri = await spotify.searchForTrack("breathe bou");
    spotify.addToPlaylist(playlistId, songUri);
  }
}
