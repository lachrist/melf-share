const Http = require("http");
const Fs = require("fs");
const MelfServerHandlers = require("melf/server/handlers");
const handlers = MelfServerHandlers(console);
const server = Http.createServer();
const splitter = "foobar";
server.on("request", (request, response) => {
  if (request.url.startsWith("/"+splitter)) {
    request.url = request.url.substring(splitter.length+1);
    handlers.request(request, response);
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
    request.url = request.url.substring(splitter.length+1);
    handlers.upgrade(request, socket, head);
  }
});
server.listen(process.argv[2], function () {
  console.log("1) Visit: http://localhost:"+this.address().port+"/alice.html");
  console.log("2) Visit: http://localhost:"+this.address().port+"/bob.html");
});