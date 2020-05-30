const configs = require("./config.js");
const axios = require("axios");

module.exports = {
  searchForTrack: function(info) {
    return axios
      .get(
        `https://api.spotify.com/v1/search?query=${info}&type=track&offset=0&limit=20`,
        {
          headers: {
            Authorization: `Bearer ${configs.user.spotifyToken}`,
            "Content-Type": "application/json"
          }
        }
      )
      .then(function(res) {
        console.log(
          `${configs.colours.green}Song has successfully been searched for!"${configs.colours.reset}`
        );
        return res.data.tracks.items[0].uri;
      })
      .catch(function(err) {
        console.log(
          `${configs.colours.red}Status ${err.response.data.error.status}: ${err.response.data.error.message} - Failed to search for song :(${configs.colours.reset}`
        );
      });
  },
  searchForPlaylist: function() {
    return axios
      .get(
        `https://api.spotify.com/v1/users/${configs.user.spotifyUserId}/playlists`,
        {
          headers: {
            Authorization: `Bearer ${configs.user.spotifyToken}`,
            "Content-Type": "application/json"
          }
        }
      )
      .then(function(res) {
        console.log(
          `${configs.colours.green}Playlist has successfully been searched for!"${configs.colours.reset}`
        );
        let items = res.data.items;
        return (
          items.find(item => item.name == configs.user.spotifyPlaylistName) &&
          items.find(item => item.name == configs.user.spotifyPlaylistName).id
        );
      })
      .catch(function(err) {
        console.log(
          `${configs.colours.red}Status ${err.response.data.error.status}: ${err.response.data.error.message} - Failed to search for existing playlist:(${configs.colours.reset}`
        );
      });
  },
  createPlaylist: function() {
    let requestBody = {
      name: configs.user.spotifyPlaylistName,
      description: configs.user.spotifyPlaylistDesc,
      public: true
    };

    return axios
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
          `${configs.colours.green}New playlist ${configs.user.spotifyPlaylistName} has successfully been created!${configs.colours.reset}`
        );
        return res.data.id;
      })
      .catch(function(err) {
        console.log(
          `${configs.colours.red}Status ${err.response.data.error.status}: ${err.response.data.error.message} - Playlist failed to create :(${configs.colours.reset}`
        );
      });
  },
  addToPlaylist: function(playlistId, songUris) {
    axios
      .post(
        `https://api.spotify.com/v1/playlists/${playlistId}/tracks?uris=${songUris}`,
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
          `${configs.colours.green}Songs successfully added to ${configs.user.spotifyPlaylistName}"${configs.colours.reset}`
        );
      })
      .catch(function(err) {
        console.log(
          `${configs.colours.red}Status ${err.response.data.error.status}: ${err.response.data.error.message} - Failed to add song :(${configs.colours.reset}`
        );
      });
  }
};
