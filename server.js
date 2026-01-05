const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  let filePath = path.join(__dirname, req.url === "/" ? "index.html" : req.url);
  let ext = path.extname(filePath);

  let contentType = "text/html";
  if (ext === ".css") contentType = "text/css";
  if (ext === ".js") contentType = "application/javascript";
  if (ext === ".png") contentType = "image/png";
  if (ext === ".jpg" || ext === ".jpeg") contentType = "image/jpeg";
  if (ext === ".svg") contentType = "image/svg+xml";

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404);
      res.end("404 Not Found");
    } else {
      res.writeHead(200, { "Content-Type": contentType });
      res.end(content);
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
