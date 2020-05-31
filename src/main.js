var fs = require("fs");
const configs = require("./config.js");
var readline = require("readline");
var { google } = require("googleapis");
var OAuth2 = google.auth.OAuth2;
const axios = require("axios");

// Prerequisites
// 1. node.js
// 2. yarn
// 3. Must have registered app with both Spotify and Youtube, get client ID's and SECRETS from there (see docs on how to do this).
//  - For Spotify, paste client_id and server_id in a spotify_secrets file to import into config
//    Generate an Oauth token here (1h expiry) and paste into same spotify_secrets file- https://developer.spotify.com/console/post-playlists/?user_id=aic205&body=%7B%22name%22%3A%22Test%22%2C%22description%22%3A%22hi%22%2C%22public%22%3Atrue%7D
//  - For Youtube, see docs for how to generate client_secret.json (I have renamed to youtube_secrets) - download and add to src

// 4. Run node.main.js on command line
// It will generate youtube auth token and then sync a "Music" playlist on your channel with a playlist you can name in config

// DISCLAIMER: Uses code provided by Youtube Data API to generate token/get channel or playlist

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
      `${configs.colours.red}Status ${err.response.status}: ${err.response.data.error} Error loading client secret file  ${configs.colours.reset}`
    );
    return;
  }
  // Authorize a client with the loaded credentials, then call the YouTube API to get songs in music playlist
  authorize(JSON.parse(content), getYoutubePlaylist);
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
  console.log(
    `${configs.colours.magenta} Authorize this app by visiting this url: ${configs.colours.reset} `,
    authUrl
  );
  var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  // Copy the code from the url into the console
  rl.question(
    `${configs.colours.magenta} Enter the code from that page here: ${configs.colours.reset}`,
    function(code) {
      rl.close();
      oauth2Client.getToken(code, function(err, token) {
        if (err) {
          console.log(
            `${configs.colours.red} Status ${err.response.data.error.code} : ${err.response.data.error.message} - Error while trying to retrieve access token  ${configs.colours.reset}`
          );
          return;
        }
        oauth2Client.credentials = token;
        storeToken(token);
        callback(oauth2Client);
      });
    }
  );
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
    console.log(
      `${configs.colours.magenta} Token stored to ${configs.colours.reset}` +
        TOKEN_PATH
    );
  });
}

// auth is an authorized OAuth2 client
function getYoutubePlaylist(auth) {
  var service = google.youtube("v3");
  // Make api call to get playlists
  service.playlists.list(
    {
      auth: auth,
      part: "snippet,contentDetails",
      mine: true
    },
    function(err, response) {
      if (err) {
        console.log(
          `${configs.colours.red} Status ${err.response.data.error.code}: ${err.response.data.error.message} -  Playlists could not be retrieved ${configs.colours.reset}`
        );
        return;
      }
      var playlists = response.data.items;
      if (playlists.length == 0) {
        console.log(
          `${configs.colours.red} No playlists found ${configs.colours.reset}`
        );
      } else {
        // Gets the first playlistId that has the title "Music"
        let id = playlists.find(playlist => playlist.snippet.title == "Music")
          .id;

        if (id) {
          console.log(
            `${configs.colours.green} "Music" playlist successfully retrieved for ${playlists[0].snippet.channelTitle} ${configs.colours.reset}`
          );
          getYoutubePlaylistItems(service, auth, id);
        } else {
          console.log(
            `${configs.colours.red} "Music" playlist could not be found ${configs.colours.reset}`
          );
        }
      }
    }
  );
}

function getYoutubePlaylistItems(service, auth, id) {
  service.playlistItems.list(
    {
      auth: auth,
      part: "snippet,contentDetails",
      playlistId: id,
      mine: true
    },
    function(err, response) {
      if (err) {
        console.log(
          `${configs.colours.red} Status ${err.response.data.error.code}: ${err.response.data.error.message} -  Playlist items could not be retrieved ${configs.colours.reset}`
        );
        return;
      }
      var items = response.data.items;

      syncTracks(items);
    }
  );
}

// Get array of song titles w/o special characters
async function syncTracks(items) {
  let trackTitles = [];
  items.forEach(item => {
    trackTitles.push(item.snippet.title.replace(/[^\w\s]/gi, ""));
  });
  if (trackTitles.length == 0) {
    console.log(
      `${configs.colours.red} Song titles array could not be retrieved ${configs.colours.reset}`
    );
  } else {
    searchForSpotifyPlaylist(trackTitles);
  }
}

async function searchForSpotifyPlaylist(trackTitles) {
  let playlistObj = await axios
    .get(
      `https://api.spotify.com/v1/users/${configs.user.spotifyUserId}/playlists`,
      {
        headers: {
          Authorization: `Bearer ${configs.user.spotifyToken}`,
          "Content-Type": "application/json"
        }
      }
    )
    .then(async function(res) {
      console.log(
        `${configs.colours.green}Playlist has successfully been searched for${configs.colours.reset}`
      );
      let items = res.data.items;
      let id;
      let uris;
      if (items.some(item => item.name == configs.user.spotifyPlaylistName)) {
        id = items.find(item => item.name == configs.user.spotifyPlaylistName)
          .id;
        uris = await getExistingUris(id);
      }
      return {
        id: id,
        uris: uris
      };
    })
    .catch(function(err) {
      console.log(
        `${configs.colours.red}Status ${err.response.data.error.status}: ${err.response.data.error.message} - Failed to search for existing playlist${configs.colours.reset}`
      );
    });
  if (playlistObj.id) {
    addToSpotifyPlaylist(playlistObj, trackTitles);
  } else {
    createSpotifyPlaylist(trackTitles);
  }
}

function getExistingUris(id) {
  return axios
    .get(`https://api.spotify.com/v1/playlists/${id}/tracks`, {
      headers: {
        Authorization: `Bearer ${configs.user.spotifyToken}`,
        "Content-Type": "application/json"
      }
    })
    .then(function(res) {
      console.log(
        `${configs.colours.green}Existing uris have been retrieved${configs.colours.reset}`
      );
      let items = res.data.items;
      return items.map(item => item.track.uri);
    })
    .catch(function(err) {
      console.log(
        `${configs.colours.red}Status ${err.response.data.error.status}: ${err.response.data.error.message} - Failed to get existing uris in playlist ${configs.colours.reset}`
      );
    });
}

async function createSpotifyPlaylist(trackTitles) {
  let requestBody = {
    name: configs.user.spotifyPlaylistName,
    description: configs.user.spotifyPlaylistDesc,
    public: true
  };

  let id = await axios
    .post(
      `https://api.spotify.com/v1/users/${configs.user.spotifyUserId}/playlists`,
      requestBody,
      {
        headers: {
          Authorization: `Bearer ${configs.user.spotifyToken}`,
          "Content-Type": "application/json"
        }
      }
    )
    .then(function(res) {
      console.log(
        `${configs.colours.green}New playlist ${configs.user.spotifyPlaylistName} has successfully been created${configs.colours.reset}`
      );
      return res.data.id;
    })
    .catch(function(err) {
      console.log(
        `${configs.colours.red}Status ${err.response.data.error.status}: ${err.response.data.error.message} - Playlist failed to create ${configs.colours.reset}`
      );
    });
  addToSpotifyPlaylist({ id: id, uris: [] }, trackTitles);
}

async function getUris(trackTitles) {
  let trackUris = [];
  for (let title of trackTitles) {
    let uri = await axios
      .get(
        `https://api.spotify.com/v1/search?query=${title}&type=track&offset=0&limit=20`,
        {
          headers: {
            Authorization: `Bearer ${configs.user.spotifyToken}`,
            "Content-Type": "application/json"
          }
        }
      )
      .then(function(res) {
        console.log(
          `${configs.colours.green}Song has successfully been searched for${configs.colours.reset}`
        );
        return res.data.tracks.items[0].uri;
      })
      .catch(function(err) {
        console.log(
          `${configs.colours.red}Status ${err.response.data.error.status}: ${err.response.data.error.message} - Failed to search for song ${configs.colours.reset}`
        );
      });
    trackUris.push(uri);
  }
  return trackUris;
}

// If the playlist has tracks in it, must do a sync not direct add so there are no duplicates
async function addToSpotifyPlaylist(playlistObj, trackTitles) {
  let uris = await getUris(trackTitles);
  if (playlistObj.uris && playlistObj.uris.length > 0) {
    uris = uris.filter(uri => {
      !playlistObj.uris.includes(uri);
    });
  }
  if (uris.length > 0) {
    axios
      .post(
        `https://api.spotify.com/v1/playlists/${
          playlistObj.id
        }/tracks?uris=${uris.join(",")}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${configs.user.spotifyToken}`,
            "Content-Type": "application/json",
            Accept: "application/json"
          }
        }
      )
      .then(function(res) {
        console.log(
          `${configs.colours.green}Tracks successfully added to ${configs.user.spotifyPlaylistName}"${configs.colours.reset}`
        );
      })
      .catch(function(err) {
        console.log(
          `${configs.colours.red}Status ${err.response.data.error.status}: ${err.response.data.error.message} - Failed to add song ${configs.colours.reset}`
        );
      });
  } else {
    console.log(
      `${configs.colours.green}Tracks already in sync${configs.colours.reset}`
    );
  }
}
