const fs = require("fs");
const path = require("path");
const http = require("http");
const https = require("https");
const app = require("./app");

const certDir = path.resolve(__dirname, ".cert");
const keyPath = path.join(certDir, "key.pem");
const certPath = path.join(certDir, "cert.pem");

let useHttps = false;
let httpsOptions = {};
try {
  if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
    httpsOptions = {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath),
    };
    useHttps = true;
  }
} catch (err) {
  console.warn("Could not load HTTPS certs:", err);
}

const server = useHttps
  ? https.createServer(httpsOptions, app)
  : http.createServer(app);

if (!useHttps) {
  console.warn("Running without HTTPS!");
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on ${useHttps ? "https" : "http"}://localhost:${PORT}`);
});
