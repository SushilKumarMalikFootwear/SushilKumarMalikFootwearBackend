require("dotenv").config({ quiet: true });
const mongoose = require("mongoose");

const dbOptions = {
  maxPoolSize: 5,
};

// The connection string (with the database password) must come from the
// environment: a local .env file in development, or Vercel's Environment
// Variables in production. Never commit it to the repository.
const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error(
    "MONGODB_URI is not set. Add it to .env (local) or to the Vercel project's Environment Variables."
  );
}
mongoose.connect(uri, dbOptions);
module.exports = mongoose;
