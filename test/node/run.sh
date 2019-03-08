rm /tmp/melf-share.sock
node server.js /tmp/melf-share.sock &
sleep 2
node alice.js /tmp/melf-share.sock &
node bob.js /tmp/melf-share.sock