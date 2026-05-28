import logger from "./utils/logger";
import { createServer } from "http";
import { initSocket } from "./services/socket";

const server = createServer((req, res) => {
  if (req.url == "/")
    res.writeHead(200, { "content-type": "text/plain" }).end("Bun is running");
});
initSocket(server);

server.listen(8888, () => logger.info("running"));
