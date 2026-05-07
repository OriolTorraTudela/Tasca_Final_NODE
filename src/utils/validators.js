const { body, param, query, validationResult } = require('express-validator');

/**
 * Comprova si hi ha errors de validació i retorna 400 si n'hi ha
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: errors.array()[0].msg,
      code: 'VALIDATION_ERROR',
      details: errors.array(),
    });
  }
  next();
};

// Validadors reutilitzables
const emailValidator = body('email').isEmail().withMessage('Email invàlid').normalizeEmail();
const passwordValidator = body('password')
  .isLength({ min: 8 })
  .withMessage('La contrasenya ha de tenir mínim 8 caràcters')
  .matches(/[A-Z]/)
  .withMessage('La contrasenya ha de tenir almenys una majúscula')
  .matches(/[0-9]/)
  .withMessage('La contrasenya ha de tenir almenys un número');

const registerValidators = [
  emailValidator,
  passwordValidator,
  body('firstName').notEmpty().withMessage('El nom és obligatori').trim(),
  body('lastName').notEmpty().withMessage('El cognom és obligatori').trim(),
];

const loginValidators = [
  body('email').isEmail().withMessage('Email invàlid').normalizeEmail(),
  body('password').notEmpty().withMessage('La contrasenya és obligatòria'),
];

const roleValidators = [
  body('name').notEmpty().withMessage('El nom del rol és obligatori').trim().toLowerCase(),
  body('level').isInt({ min: 1, max: 10 }).withMessage('El nivell ha de ser entre 1 i 10'),
];

const permissionValidators = [
  body('name').notEmpty().withMessage('El nom del permís és obligatori').trim(),
  body('category').notEmpty().withMessage('La categoria és obligatòria').trim(),
];

const taskValidators = [
  body('title').notEmpty().withMessage('El títol de la tasca és obligatori').trim(),
];

const delegationValidators = [
  body('toUserId').notEmpty().withMessage('toUserId és obligatori'),
  body('permission').notEmpty().withMessage('El permís és obligatori').trim(),
  body('reason').notEmpty().withMessage('El motiu és obligatori').trim(),
  body('daysValid').isInt({ min: 1 }).withMessage('daysValid ha de ser un enter positiu'),
];

const mongoIdParam = (name = 'id') =>
  param(name).isMongoId().withMessage(`${name} no és un ID vàlid`);

module.exports = {
  validate,
  registerValidators,
  loginValidators,
  roleValidators,
  permissionValidators,
  taskValidators,
  delegationValidators,
  mongoIdParam,
};
