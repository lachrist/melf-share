const Net = require("net");
const MelfReceptor = require("melf/receptor");
const receptor = MelfReceptor((origin, ricipient, message) => {
  console.log(origin+" >> "+ricipient+": "+message);
});
const server = Net.createServer();
server.on("connection", receptor.ConnectionListener());
server.listen(process.argv[2]);