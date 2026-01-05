const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;

http.createServer((req, res) => {
  let file = req.url === "/" ? "index.html" : req.url;
  let filePath = path.join(ROOT, file);

  if (!fs.existsSync(filePath)) {
    filePath = path.join(ROOT, "index.html");
  }

  const ext = path.extname(filePath);
  const types = {
    ".html": "text/html",
    ".css": "text/css",
    ".js": "application/javascript",
    ".png": "image/png",
    ".jpg": "image/jpeg"
  };

  res.writeHead(200, { "Content-Type": types[ext] || "text/plain" });
  fs.createReadStream(filePath).pipe(res);
}).listen(PORT, "0.0.0.0", () => {
  console.log("Server running on port", PORT);
});
