// At the top of the liri.js file, add code to read and set any environment variables with the dotenv package:
const dotenv = require("dotenv").config();

if (dotenv.error) {
    throw dotenv.error
}

//console.log(dotenv.parsed);

//Add the code required to import the keys.js file and store it in a variable.
let keys = require('./keys');

//console.log(keys);

// You should then be able to access your keys information like so..
let Spotify = require('node-spotify-api');
let Twitter = require('twitter');
let request = require('request');

let spotify = new Spotify(keys.spotify);
let client = new Twitter(keys.twitter);

// fs is a core Node package for reading and writing files
var fs = require("fs");

/*
Make it so liri.js can take in one of the following commands:

* `my-tweets`

* `spotify-this-song`

* `movie-this`

* `do-what-it-says`

*/

const userCommand = process.argv[2];

function init(command, extra) {
    extra = (extra ? extra : "");
    myLog(`*** ${command} ${extra}`);
    switch (command) {
        case "n":
        case "new-tweet":
            tweet(extra);
            break;
        case "t":
        case "my-tweets":
            getLast20Tweets();
            break;
        case "s":
        case "spotify-this-song":
            spotifySong(extra);
            break;
        case "m":
        case "movie-this":
            getMovieInfo(extra);
            break;
        case "d":
        case "do-what-it-says":
            doRandomShit();
            break;
        case "h":
        case "help":
        default:
            console.log("**********");
            console.log("Options:");
            console.log("t or my-tweets: Get 20 last tweets.");
            console.log("n or new-tweet: Send a new tweet.");
            console.log("s or spotify-this-song: Get song info.");
            console.log("m or movie-this: Get movie info.");
            console.log("d or do-what-it-says: Reads the random text file.");
            console.log("h or help: List the possible options.");
            console.log("**********");
    }
}

function getRemainingInput() {
    // get the message from the command line
    let input = process.argv[3];
    for (let i = 4; i < process.argv.length; i++) {
        input += " " + process.argv[i];
    }
    return input;
}

init(userCommand, getRemainingInput());


function tweet(message) {
    if (message) {
        client.post('statuses/update', { status: message }, function (error, tweet, response) {
            if (!error) {
                myLog(`Tweeted: ${message}`);
            }
            else {
                myLog(error);
            }
        });
    }
    else {
        myLog("Include a message to send a tweet.");
    }
}

function getLast20Tweets() {
    client.get('statuses/user_timeline', {}, function (error, tweets, response) {
        if (!error) {
            for (let i = 0; i < tweets.length; i++) {
                myLog(`${tweets[i].created_at}: ${tweets[i].text}`);
            }
        }
        else {
            myLog(error);
        }
    });

}

function spotifySong(song) {
    if (!song) {
        song = "The Sign Ace of Base";
    }
    spotify.search({ type: 'track', query: song }, function (err, data) {
        if (err) {
            return myLog('Error occurred: ' + err);
        }
        else if (data.tracks.items.length <= 0) {
            myLog(`Song "${song}" not found.`);
        }
        else {
            // only display the first result
            myLog(data.tracks.items[0].name + " by " +
                data.tracks.items[0].artists[0].name);
            myLog("Album: " + data.tracks.items[0].album.name);
            if (data.tracks.items[0].preview_url) {
                myLog("Link: " + data.tracks.items[0].preview_url);
            }  // some songs don't have previews ie. bullet with butterfly wings
        }
    });
}

function getMovieInfo(title) {
    if (!title) {
        title = "Mr. Nobody";
    }
    let encodedTitle = encodeURIComponent(title);
    // a request to the OMDB API with the movie specified
    request(`http://www.omdbapi.com/?t=${encodedTitle}&y=&plot=short&apikey=trilogy`, function (error, response, body) {

        // If the request is successful (i.e. if the response status code is 200)
        if (!error && response.statusCode === 200) {

            // Parse the body of the site and recover just the imdbRating
            // (Note: The syntax below for parsing isn't obvious. Just spend a few moments dissecting it).
            let m = JSON.parse(body);
            if (m.Response != 'False') {
                myLog(`${m.Title} - ${m.Year}`);
                myLog(`${m.Plot}`);
                myLog(`Actors: ${m.Actors}`);
                myLog(`Country: ${m.Country}`);
                myLog(`Language: ${m.Language}`);
                if (m.Ratings[0] && m.Ratings[1]) {
                    myLog(`IMDB Rating: ${m.Ratings[0].Value} - Rotten Tomatoes: ${m.Ratings[1].Value}`);
                }
            }
            else {
                myLog(m.Error);  // usually movie not found
            }
        }
        else {
            myLog(`${response.statusCode} - ${error}`);
        }
    });

}

function doRandomShit() {
    fs.readFile("random.txt", "utf8", function (error, data) {

        // If the code experiences any errors it will log the error to the console.
        if (error) {
            return myLog(error);
        }
        //console.log(data);

        // Then split it by commas
        var dataArr = data.split(",");
        //console.log(dataArr);
        if (dataArr[0] && dataArr[1]) {
            init(dataArr[0], dataArr[1]);
        }
    });
}

function myLog(stuffToLog) {
    console.log(stuffToLog);
    fs.appendFile("log.txt", `${stuffToLog}\n`, function (err) {
        // If an error was experienced we say it.
        if (err) {
            console.log(err);
        }
    });
}