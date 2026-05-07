const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * Model d'Usuari amb rol jeràrquic i permisos delegats
 */
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  password: { type: String, required: true, minlength: 6 },
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  role: { type: mongoose.Schema.Types.ObjectId, ref: 'Role', required: true },
  // Permisos delegats temporalment per altres usuaris
  permissions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Permission' }],
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date, default: null },
}, { timestamps: true });


// Hash de la contrasenya abans de desar
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

/**
 * Compara una contrasenya en text pla amb el hash
 * @param {string} candidatePassword
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// No exposar la contrasenya en les respostes JSON
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
