const mongoose = require('mongoose');

/**
 * Model de Permís: unitat atòmica de control d'accés (ex: tasks:create)
 */
const permissionSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  description: { type: String, default: '' },
  category: { type: String, required: true, trim: true },
}, { timestamps: { createdAt: 'createdAt', updatedAt: false } });

permissionSchema.index({ category: 1 });

module.exports = mongoose.model('Permission', permissionSchema);
