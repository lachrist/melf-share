browserify alice.js > alice-bundle.js
browserify bob.js > bob-bundle.js
node ./server.js 8080 &
sleep 2
open "http://localhost:8080/alice.html"
open "http://localhost:8080/bob.html"
sleep 4
rm alice-bundle.js bob-bundle.js