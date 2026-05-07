const crypto = require('crypto');
const User = require('../models/User');
const Role = require('../models/Role');
const TokenBlacklist = require('../models/TokenBlacklist');
const PasswordReset = require('../models/PasswordReset');
const jwtService = require('./jwtService');
const permissionService = require('./permissionService');
const emailService = require('./emailService');
const auditService = require('./auditService');

/**
 * Registra un nou usuari amb el rol VIEWER per defecte
 */
const register = async ({ email, password, firstName, lastName }) => {
  const existing = await User.findOne({ email });
  if (existing) {
    const err = new Error('Aquest email ja està registrat');
    err.statusCode = 400;
    err.code = 'EMAIL_DUPLICATE';
    throw err;
  }

  // Rol per defecte: viewer (el de nivell més baix)
  const viewerRole = await Role.findOne({ name: 'viewer' });
  if (!viewerRole) throw new Error('Rols no inicialitzats. Executa el seed primer.');

  const user = await User.create({ email, password, firstName, lastName, role: viewerRole._id });
  await user.populate('role');

  await auditService.logAction(user._id, 'auth:register', String(user._id), 'user', null, 'success');
  return user;
};

/**
 * Login: verifica credencials i retorna access + refresh tokens
 */
const login = async (email, password) => {
  const user = await User.findOne({ email, isActive: true }).populate('role');
  if (!user) {
    const err = new Error('Credencials incorrectes');
    err.statusCode = 401;
    throw err;
  }

  const isValid = await user.comparePassword(password);
  if (!isValid) {
    const err = new Error('Credencials incorrectes');
    err.statusCode = 401;
    throw err;
  }

  const permissions = await permissionService.getRolePermissions(user.role._id);
  const delegated = await permissionService.getActiveDelegations(String(user._id));
  const allPerms = [...new Set([...permissions, ...delegated])];

  const accessToken = jwtService.generateAccessToken(user, allPerms);
  const refreshToken = jwtService.generateRefreshToken(user._id);

  user.lastLogin = new Date();
  await user.save();

  await auditService.logAction(user._id, 'auth:login', String(user._id), 'user', null, 'success');

  return { accessToken, refreshToken, expiresIn: 900 };
};

/**
 * Renovació de l'access token usant el refresh token
 */
const refresh = async (refreshToken) => {
  let decoded;
  try {
    decoded = jwtService.verifyRefreshToken(refreshToken);
  } catch {
    const err = new Error('Refresh token invàlid o expirat');
    err.statusCode = 401;
    err.code = 'TOKEN_INVALID';
    throw err;
  }

  if (decoded.tokenType !== 'refresh') {
    const err = new Error('No és un refresh token');
    err.statusCode = 401;
    throw err;
  }

  const blacklisted = await TokenBlacklist.findOne({ token: refreshToken });
  if (blacklisted) {
    const err = new Error('Token revocat');
    err.statusCode = 401;
    err.code = 'TOKEN_REVOKED';
    throw err;
  }

  const user = await User.findById(decoded.userId).populate('role');
  if (!user || !user.isActive) {
    const err = new Error('Usuari no trobat o inactiu');
    err.statusCode = 401;
    throw err;
  }

  const permissions = await permissionService.getRolePermissions(user.role._id);
  const delegated = await permissionService.getActiveDelegations(String(user._id));
  const allPerms = [...new Set([...permissions, ...delegated])];

  const newAccessToken = jwtService.generateAccessToken(user, allPerms);
  return { accessToken: newAccessToken, expiresIn: 900 };
};

/**
 * Logout: afegeix ambdós tokens a la blacklist
 */
const logout = async (accessToken, refreshToken, userId) => {
  const now = new Date();

  const accessExpiry = jwtService.getTokenExpiry(accessToken) || new Date(now.getTime() + 15 * 60 * 1000);
  const refreshExpiry = jwtService.getTokenExpiry(refreshToken) || new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  // Afegim a blacklist si no hi estan ja
  try {
    await TokenBlacklist.create({ token: accessToken, userId, revokedAt: now, expiresAt: accessExpiry });
  } catch {}
  try {
    await TokenBlacklist.create({ token: refreshToken, userId, revokedAt: now, expiresAt: refreshExpiry });
  } catch {}

  await auditService.logAction(userId, 'auth:logout', String(userId), 'user', null, 'success');
};

/**
 * Inicia el flux de recuperació de contrasenya: genera token i envia email
 */
const forgotPassword = async (email) => {
  const user = await User.findOne({ email, isActive: true });
  // Sempre retornem OK per no revelar si l'email existeix
  if (!user) return;

  // Token aleatori de 32 bytes en hex
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

  await PasswordReset.deleteMany({ userId: user._id }); // elimina resets anteriors
  await PasswordReset.create({ userId: user._id, token, expiresAt });

  await emailService.sendPasswordResetEmail(email, token);
  await auditService.logAction(user._id, 'auth:forgot_password', String(user._id), 'user', null, 'success');
};

/**
 * Restableix la contrasenya amb el token rebut per email
 */
const resetPassword = async (token, newPassword) => {
  const resetRecord = await PasswordReset.findOne({
    token,
    expiresAt: { $gt: new Date() },
    usedAt: null,
  });

  if (!resetRecord) {
    const err = new Error('Token de reset invàlid o expirat');
    err.statusCode = 400;
    throw err;
  }

  const user = await User.findById(resetRecord.userId);
  if (!user) {
    const err = new Error('Usuari no trobat');
    err.statusCode = 404;
    throw err;
  }

  user.password = newPassword;
  await user.save();

  resetRecord.usedAt = new Date();
  await resetRecord.save();

  await auditService.logAction(user._id, 'auth:reset_password', String(user._id), 'user', null, 'success');
};

module.exports = { register, login, refresh, logout, forgotPassword, resetPassword };
