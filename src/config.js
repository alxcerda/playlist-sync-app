const secrets = require("./secrets");
// in .gitignore

exports.user = {
  spotifyPlaylistName: "Youtube Music Playlist",
  spotifyPlaylistDesc: "Woop woop",
  spotifyUserId: secrets.spotifyUserId,
  spotifyClientId: secrets.spotifyClientId,
  spotifyClientSecret: secrets.spotifyClientSecret,
  spotifyToken: secrets.spotifyToken,
  youtubeClientId: secrets.youtubeClientId,
  youtubeClientSecret: secrets.youtubeClientSecret
};

exports.colours = {
  green: "\u001b[32;1m",
  red: "\u001b[31;1m",
  reset: "\u001b[0m"
};
