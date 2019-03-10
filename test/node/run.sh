rm /tmp/melf-share.sock
node server.js /tmp/melf-share.sock &
PID=$!
sleep 1
node alice.js /tmp/melf-share.sock &
node bob.js /tmp/melf-share.sock
wait $PID