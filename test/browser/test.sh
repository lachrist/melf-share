browserify alice.js > alice-bundle.js
browserify bob.js > bob-bundle.js
node ./server.js
rm alice-bundle.js bob-bundle.js