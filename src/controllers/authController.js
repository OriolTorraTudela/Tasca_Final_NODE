const authService = require('../services/authService');

/**
 * POST /api/auth/register
 */
const register = async (req, res, next) => {
  try {
    const user = await authService.register(req.body);
    res.status(201).json({
      message: 'Usuari registrat correctament',
      user: { _id: user._id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role?.name },
    });
  } catch (err) { next(err); }
};

/**
 * POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const tokens = await authService.login(email, password);
    res.json(tokens);
  } catch (err) { next(err); }
};

/**
 * POST /api/auth/refresh
 */
const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: 'refreshToken és obligatori' });
    const result = await authService.refresh(refreshToken);
    res.json(result);
  } catch (err) { next(err); }
};

/**
 * POST /api/auth/logout
 */
const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: 'refreshToken és obligatori' });
    await authService.logout(req.token, refreshToken, req.user._id);
    res.json({ message: 'Sessió tancada correctament' });
  } catch (err) { next(err); }
};

/**
 * POST /api/auth/forgot-password
 */
const forgotPassword = async (req, res, next) => {
  try {
    await authService.forgotPassword(req.body.email);
    res.json({ message: 'Si l\'email existeix, rebràs les instruccions per recuperar la contrasenya.' });
  } catch (err) { next(err); }
};

/**
 * POST /api/auth/reset-password/:token
 */
const resetPassword = async (req, res, next) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword) return res.status(400).json({ error: 'newPassword és obligatori' });
    await authService.resetPassword(req.params.token, newPassword);
    res.json({ message: 'Contrasenya actualitzada correctament' });
  } catch (err) { next(err); }
};

module.exports = { register, login, refresh, logout, forgotPassword, resetPassword };
