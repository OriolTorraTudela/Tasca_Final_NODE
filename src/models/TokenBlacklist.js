const mongoose = require('mongoose');

/**
 * Blacklist de tokens revocats (logout segur).
 * TTL index: MongoDB esborra automàticament els documents expirats.
 */
const tokenBlacklistSchema = new mongoose.Schema({
  token: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  revokedAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
});

// TTL index: elimina automàticament el document quan expira el token
tokenBlacklistSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('TokenBlacklist', tokenBlacklistSchema);
