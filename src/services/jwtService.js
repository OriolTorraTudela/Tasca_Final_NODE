const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');

/**
 * Servei JWT: genera i verifica access tokens (15m) i refresh tokens (7d)
 */

/**
 * Genera un access token amb userId, email, rol i permisos
 * @param {object} user - document User de MongoDB
 * @param {string[]} permissions - array de noms de permisos resolts
 */
const generateAccessToken = (user, permissions = []) => {
  return jwt.sign(
    {
      userId: user._id,
      email: user.email,
      role: user.role?.name || user.role,
      permissions,
    },
    jwtConfig.accessSecret,
    { expiresIn: jwtConfig.accessExpires }
  );
};

/**
 * Genera un refresh token amb només userId i tokenType
 * @param {string} userId
 */
const generateRefreshToken = (userId) => {
  return jwt.sign(
    { userId, tokenType: 'refresh' },
    jwtConfig.refreshSecret,
    { expiresIn: jwtConfig.refreshExpires }
  );
};

/**
 * Verifica i decodifica un access token
 * @param {string} token
 */
const verifyAccessToken = (token) => {
  return jwt.verify(token, jwtConfig.accessSecret);
};

/**
 * Verifica i decodifica un refresh token
 * @param {string} token
 */
const verifyRefreshToken = (token) => {
  return jwt.verify(token, jwtConfig.refreshSecret);
};

/**
 * Decodifica sense verificar (per llegir expiresAt)
 * @param {string} token
 */
const decodeToken = (token) => {
  return jwt.decode(token);
};

/**
 * Retorna la data d'expiració d'un token en format Date
 * @param {string} token
 */
const getTokenExpiry = (token) => {
  const decoded = decodeToken(token);
  return decoded ? new Date(decoded.exp * 1000) : null;
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  decodeToken,
  getTokenExpiry,
};
