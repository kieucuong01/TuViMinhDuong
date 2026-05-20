const http = require("http");
const next = require("next");

const port = Number(process.env.PORT || process.argv[2] || 4000);
const hostname = process.env.HOSTNAME || "0.0.0.0";
const app = next({ dev: false, dir: process.cwd(), hostname, port });
const handle = app.getRequestHandler();

process.on("uncaughtException", (error) => {
  console.error("[server] uncaughtException", error);
});

process.on("unhandledRejection", (error) => {
  console.error("[server] unhandledRejection", error);
});

app.prepare().then(() => {
  const server = http.createServer((request, response) => {
    handle(request, response);
  });

  server.keepAliveTimeout = 65_000;
  server.headersTimeout = 66_000;

  server.listen(port, hostname, () => {
    console.log(`[server] ready on http://${hostname}:${port}`);
  });
});
