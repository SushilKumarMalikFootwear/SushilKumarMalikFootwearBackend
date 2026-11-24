require("dotenv").config({ quiet: true });
require("../utils/env").checkEnv();
const mongoose = require("mongoose");

// Some Windows networks can't resolve MongoDB Atlas "mongodb+srv" addresses
// (querySrv ECONNREFUSED). Locally, set DNS_SERVERS=8.8.8.8,1.1.1.1 in .env.
if (process.env.DNS_SERVERS) {
  require("dns").setServers(process.env.DNS_SERVERS.split(",").map((s) => s.trim()).filter(Boolean));
}

const dbOptions = {
  maxPoolSize: 5,
};

// The connection string (with the database password) must come from the
// environment: a local .env file in development, or Vercel's Environment
// Variables in production. Never commit it to the repository.
mongoose.connect(process.env.MONGODB_URI, dbOptions);
module.exports = mongoose;
