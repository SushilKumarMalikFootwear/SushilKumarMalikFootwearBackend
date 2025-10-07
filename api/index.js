const serverless = require("serverless-http");
const app = require("../app");

app.get("/api", (req, res) => {
  res.json({ message: "Welcome to the main API endpoint" });
});

module.exports = app;
module.exports.handler = serverless(app);