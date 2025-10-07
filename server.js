const express = require("express");
const path = require("path");
const app = express();

// Serve static HTML files from /public
app.use(express.static(path.join(__dirname, "public")));

// Default route
app.get("/", (req, res) => {
	res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ✅ Only start server locally
if (require.main === module) {
	const PORT = process.env.PORT || 3000;
	app.listen(PORT, () => {
		console.log(`✅ Server running locally on http://localhost:${PORT}`);
	});
}

module.exports = app; // Keep this for Vercel