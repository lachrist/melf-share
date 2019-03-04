rm /tmp/melf-share.sock
node server.js /tmp/melf-share.sock &
SERVER_PID=$!
sleep 2
node alice.js /tmp/melf-share.sock &
node bob.js /tmp/melf-share.sock
kill $SERVER_PID