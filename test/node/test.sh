rm /tmp/melf-share.sock
node ../../node_modules/melf/server/bin.js --port /tmp/melf-share.sock --log &
SERVER_PID=$!
sleep 1
node alice.js /tmp/melf-share.sock &
sleep 1
node bob.js /tmp/melf-share.sock
kill $SERVER_PID