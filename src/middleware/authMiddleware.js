const jwtService = require('../services/jwtService');
const TokenBlacklist = require('../models/TokenBlacklist');
const User = require('../models/User');

/**
 * Middleware d'autenticació: verifica l'access token i comprova la blacklist.
 * Afegeix req.user amb les dades descodificades.
 */
const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token no proporcionat', code: 'NO_TOKEN' });
  }

  const token = authHeader.split(' ')[1];

  // Verifica la signatura i expiració
  let decoded;
  try {
    decoded = jwtService.verifyAccessToken(token);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirat', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ error: 'Token invàlid', code: 'TOKEN_INVALID' });
  }

  // Comprova la blacklist (logout segur)
  const blacklisted = await TokenBlacklist.findOne({ token });
  if (blacklisted) {
    return res.status(401).json({ error: 'Token revocat', code: 'TOKEN_REVOKED' });
  }

  // Carrega l'usuari de la BD per tenir dades actuals
  const user = await User.findById(decoded.userId).populate('role');
  if (!user || !user.isActive) {
    return res.status(401).json({ error: 'Usuari no trobat o inactiu', code: 'USER_INACTIVE' });
  }

  req.user = user;
  req.token = token;
  req.tokenDecoded = decoded;
  next();
};

module.exports = { authenticate };
