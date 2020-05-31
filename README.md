# Project Title

A program to sync a Youtube playlist called "Music" with one on Spotify called "Youtube Music Playlist". It will create a new playlist if one with this name doesn't exist. If it does exist, it will ensure items in "Music" match items in "Youtube Music Playlist".

## Prerequisites

Install node.js https://nodejs.org/en/download/
Install homebrew https://brew.sh/
Install yarn https://classic.yarnpkg.com/en/docs/install/#mac-stable

## Getting Started

1. Run yarn to install dependencies
2. Register the app on Spotify (see docs at https://developer.spotify.com/documentation/general/guides/app-settings/). Add userId, clientId and clientSecret into spotify_secrets_template.js See https://developer.spotify.com/documentation/general/guides/authorization-guide/#authorization-code-flow on how to get an Oauth token and paste it into spotify_secrets_template.js. Rename file to spotify_secrets.js
3. Register the app on Youtube by following Step 1 at https://developers.google.com/youtube/v3/quickstart/nodejs but instead rename downloaded file to youtube_secrets.js and add to src directory.
4. Run node main.js on command line by following Step 4 at https://developers.google.com/youtube/v3/quickstart/nodejs on first run of sample to authorize YouTube access.

## Authors

- **Alex-Cerda** - (https://github.com/acerda96)

## Acknowledgments

Code provided by Youtube Data API to generate token and access API found at: https://developers.google.com/youtube/v3/quickstart/nodejs
