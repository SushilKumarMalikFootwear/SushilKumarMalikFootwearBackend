require("dotenv").config({ quiet: true });
const express = require("express");
const path = require("path");
const cors = require("cors");
const { legacyAdminGuard } = require("./utils/auth");

const app = express();
// Vercel sits in front of the app; trust its forwarded client IP.
app.set("trust proxy", 1);

// Serve static files
app.use(express.static(path.join(__dirname, "public")));

// Default route
app.get("/", (req, res) => {
	res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cors());

const { ROOT } = require("./utils/config").ROUTES;

// Customer website, accounts and admin order endpoints (each route sets its own protection).
app.use(ROOT, require("./api/routes/website"));

// Existing app endpoints. Open until ADMIN_AUTH_ENFORCED=true, then admin login is required.
app.use(ROOT, legacyAdminGuard);
app.use(ROOT, require("./api/routes/config_lists"));
app.use(ROOT, require("./api/routes/view_products"));
app.use(ROOT, require("./api/routes/invoice"));
app.use(ROOT, require("./api/routes/trader_finances"));
app.use(ROOT, require("./api/routes/product_crud"));
app.use(ROOT, require("./api/routes/trader_finances_logs"));

// Errors: log details on the server, send a plain message to the client.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
	console.error(err);
	res.status(err.status || 500).json({ message: "Something went wrong. Please try again." });
});

// Tests start their own server.
if (process.env.NODE_ENV !== "test") {
	const PORT = process.env.PORT || 3000;
	app.listen(PORT, () => {
		console.log(`✅ Server running locally on http://localhost:${PORT}`);
	});
}
// Export app for both local + Vercel use
module.exports = app;
