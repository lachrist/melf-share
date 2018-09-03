const Net = require("net");
const MelfOrchestrator = require("melf/orchestrator");
const orchestrator = MelfOrchestrator((origin, ricipient, message) => {
  console.log(origin+" >> "+ricipient+": "+message);
});
const server = Net.createServer();
server.on("connection", orchestrator.ConnectionListener());
server.listen(process.argv[2]);