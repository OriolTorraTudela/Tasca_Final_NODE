const mongoose = require('mongoose');

/**
 * Model de Rol jeràrquic: hereta permisos del parentRole recursivament
 */
const roleSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true, lowercase: true },
  level: { type: Number, required: true, min: 1, max: 10 },
  parentRole: { type: mongoose.Schema.Types.ObjectId, ref: 'Role', default: null },
  permissions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Permission' }],
  description: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

roleSchema.index({ level: 1 });

module.exports = mongoose.model('Role', roleSchema);
