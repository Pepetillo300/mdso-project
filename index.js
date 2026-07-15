// Minimal custom web application for Azure App Service (Linux, Node.js).
// App Service injects the port to listen on via the PORT env var — you MUST use it.
const http = require("http");

const port = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  res.end(
    "<html><head><title>Custom Web App</title></head>" +
      "<body style='font-family:sans-serif;text-align:center;margin-top:15%'>" +
      "<h1>Hello from Azure App Service</h1>" +
      "<p>Deployed with Terraform, source pulled from GitHub.</p>" +
      "</body></html>"
  );
});

server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
