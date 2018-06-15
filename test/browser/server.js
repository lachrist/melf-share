const Http = require("http");
const Fs = require("fs");
const Ws = require("ws");
const MelfPool = require("melf/server/pool");
const pool = MelfPool(console.log.bind(console));
const server = Http.createServer();
const splitter = "foobar";
const wss = new Ws.Server({noServer:true});
server.on("request", (request, response) => {
  if (request.url.startsWith("/"+splitter)) {
    pool.request(request.url.substring(splitter.length+1), response);
  } else if (request.url === "/close") {
    process.exit(0);
  } else if (["/alice.html", "/alice-bundle.js", "/bob.html", "/bob-bundle.js"].includes(request.url)) {
    const readable = Fs.createReadStream("."+request.url);
    readable.on("error", (error) => {
      response.writeHead(404, "Not found");
      response.end(error.message);
    });
    readable.pipe(response);
  }
});
server.on("upgrade", (request, socket, head) => {
  if (request.url.startsWith("/"+splitter)) {
    wss.handleUpgrade(request, socket, head, (websocket) => {
      pool.connect(request.url.substring(splitter.length+1), websocket);
    });
  }
});
server.listen(8080);