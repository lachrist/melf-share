rm /tmp/melf-sharing.sock
node ../node_modules/melf/server/bin.js /tmp/melf-sharing.sock &
SERVER_PID=$!
sleep 1
node alice.js /tmp/melf-sharing.sock &
sleep 1
node bob.js /tmp/melf-sharing.sock
kill $SERVER_PID