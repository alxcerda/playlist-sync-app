const spotify = require("./spotify-funcs");

// Prerequisites
// 1. node.js
// 2. yarn

// 1. Generate spotifyToken here for ease
// 2. https://developer.spotify.com/console/post-playlists/?user_id=aic205&body=%7B%22name%22%3A%22Test%22%2C%22description%22%3A%22hi%22%2C%22public%22%3Atrue%7D
// and paste here

// run node.main.js on command line

// Steps of program
// Login to youtube
// Get likes
// DONE Create playlist
// DONE add to if already exists
// DONE Get spotify uri
// DONE Add song to playlist

mainMethod();

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
