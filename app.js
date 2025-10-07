const express = require("express");
const path = require("path");
const cors = require("cors");

const app = express();

// Serve static files
app.use(express.static(path.join(__dirname, "public")));

// Default route
app.get("/", (req, res) => {
	res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

const { ROOT } = require("./utils/config").ROUTES;

// All routes that don’t require login
app.use(ROOT, require("./api/routes/config_lists"));
app.use(ROOT, require("./api/routes/view_products"));
app.use(ROOT, require("./api/routes/invoice"));
app.use(ROOT, require("./api/routes/trader_finances"));
app.use(ROOT, require("./api/routes/product_crud"));
app.use(ROOT, require("./api/routes/trader_finances_logs"));

// Export app for both local + Vercel use
module.exports = app;