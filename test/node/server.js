const Net = require("net");
const Distributor = require("melf/lib/distributor");
const distributor = Distributor((origin, ricipient, message) => {
  console.log(origin+" >> "+ricipient+": "+message);
});
const server = Net.createServer();
server.on("connection", distributor.ConnectionListener());
server.listen(process.argv[2]);
setTimeout(() => { server.close() }, 2000);
