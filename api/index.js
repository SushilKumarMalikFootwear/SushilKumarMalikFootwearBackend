const serverless = require("serverless-http");
const app = require("../app");

// Example endpoint (optional)
app.get("/api", (req, res) => {
	res.json({ message: "Welcome to the main API endpoint" });
});

// Export for Vercel
module.exports = app;
module.exports.handler = serverless(app);