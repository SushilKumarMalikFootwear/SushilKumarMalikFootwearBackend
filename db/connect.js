const mongoose = require('mongoose');
const dbOptions = {
    maxPoolSize:5
}
// The connection string (including the database password) comes from the
// MONGODB_URI environment variable: Vercel > Project Settings > Environment
// Variables in production, or your shell/.env locally. Never commit it.
if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not set. Add it in Vercel > Project Settings > Environment Variables.');
}
mongoose.connect(process.env.MONGODB_URI, dbOptions);
module.exports = mongoose;
