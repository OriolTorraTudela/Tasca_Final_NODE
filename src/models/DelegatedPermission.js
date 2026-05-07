const mongoose = require('mongoose');
const { DELEGATION_STATUS } = require('../config/constants');

/**
 * Delegació temporal de permisos entre usuaris
 */
const delegatedPermissionSchema = new mongoose.Schema({
  fromUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  toUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  permission: { type: String, required: true }, // nom del permís (ex: "tasks:assign")
  reason: { type: String, required: true, trim: true },
  delegatedAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
  revokedAt: { type: Date, default: null },
  status: { type: String, enum: DELEGATION_STATUS, default: 'active' },
}, { timestamps: true });

delegatedPermissionSchema.index({ toUserId: 1, status: 1 });
delegatedPermissionSchema.index({ fromUserId: 1 });
delegatedPermissionSchema.index({ expiresAt: 1 });

module.exports = mongoose.model('DelegatedPermission', delegatedPermissionSchema);
