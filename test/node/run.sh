rm /tmp/melf-share.sock
node server.js /tmp/melf-share.sock &
SERVER_PID=$!
sleep 1
node alice.js /tmp/melf-share.sock &
sleep 1
node bob.js /tmp/melf-share.sock
sleep 5
kill $SERVER_PID