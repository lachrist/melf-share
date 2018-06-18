browserify alice.js > alice-bundle.js
browserify bob.js > bob-bundle.js
node ./server.js 8080
rm alice-bundle.js bob-bundle.js