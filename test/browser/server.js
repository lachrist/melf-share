const Http = require("http");
const Path = require("path");
const Fs = require("fs");
const MelfReceptor = require("melf/lib/receptor");
const receptor = MelfReceptor((origin, recipient, message) => {
  console.log(origin+" >> "+recipient+": "+message);
});
const request_middleware = receptor.RequestMiddleware("__melf_share_traffic__");
const upgrade_middleware = receptor.UpgradeMiddleware("__melf_share_traffic__");
const server = Http.createServer();
server.on("request", (request, response) => {
  if (!request_middleware(request, response)) {
    if (["/alice.html", "/alice-bundle.js", "/bob.html", "/bob-bundle.js"].includes(request.url)) {
      Fs.createReadStream(Path.join(__dirname, request.url)).pipe(response);
    } else {
      response.writeHead(404);
      response.end();
    }
  }
});
server.on("upgrade", (request, socket, head) => {
  if (!upgrade_middleware(request, socket, head)) {
    request.writeHead(400);
    request.end();
  }
});
server.listen(process.argv[process.argv.length-1], () => {
  console.log("Listening on ", server.address());
});