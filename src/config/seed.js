require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const Role = require('../models/Role');
const Permission = require('../models/Permission');
const User = require('../models/User');

/**
 * Script de seed: crea la jerarquia de rols, permisos inicials i un usuari admin per defecte.
 * Executa: node src/config/seed.js
 */
const seed = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connectat a MongoDB');

  // Esborrem dades anteriors per fer un seed net
  await Permission.deleteMany({});
  await Role.deleteMany({});
  await User.deleteMany({});
  console.log('Dades anteriors eliminades');

  // --- PERMISOS ---
  const perms = await Permission.insertMany([
    { name: 'tasks:read', description: 'Llegir totes les tasques', category: 'tasks' },
    { name: 'tasks:read_own', description: 'Llegir les pròpies tasques', category: 'tasks' },
    { name: 'tasks:create', description: 'Crear tasques', category: 'tasks' },
    { name: 'tasks:update_own', description: 'Actualitzar les pròpies tasques', category: 'tasks' },
    { name: 'tasks:update', description: 'Actualitzar qualsevol tasca', category: 'tasks' },
    { name: 'tasks:delete', description: 'Eliminar tasques', category: 'tasks' },
    { name: 'tasks:assign', description: 'Assignar tasques a usuaris', category: 'tasks' },
    { name: 'tasks:review', description: 'Revisar tasques', category: 'tasks' },
    { name: 'users:view', description: 'Veure usuaris', category: 'users' },
    { name: 'users:manage', description: 'Gestionar usuaris', category: 'users' },
    { name: 'roles:manage', description: 'Gestionar rols', category: 'roles' },
    { name: 'audit:view', description: 'Veure logs d\'auditoria', category: 'audit' },
    { name: 'system:configure', description: 'Configurar el sistema', category: 'system' },
    { name: 'system:backup', description: 'Fer còpies de seguretat', category: 'system' },
  ]);

  const perm = (name) => perms.find(p => p.name === name)._id;

  // --- ROLS JERÀRQUICS ---
  // VIEWER (Level 1) - base, sense pare
  const viewer = await Role.create({
    name: 'viewer', level: 1, parentRole: null,
    permissions: [perm('tasks:read'), perm('tasks:read_own')],
    description: 'Pot només llegir tasques',
  });

  // USER (Level 2) hereta de VIEWER
  const user = await Role.create({
    name: 'user', level: 2, parentRole: viewer._id,
    permissions: [perm('tasks:create'), perm('tasks:update_own')],
    description: 'Pot crear i modificar les seves tasques',
  });

  // MANAGER (Level 3) hereta de USER
  const manager = await Role.create({
    name: 'manager', level: 3, parentRole: user._id,
    permissions: [perm('tasks:assign'), perm('tasks:review'), perm('users:view')],
    description: 'Manager de projectes',
  });

  // ADMIN (Level 4) hereta de MANAGER
  const admin = await Role.create({
    name: 'admin', level: 4, parentRole: manager._id,
    permissions: [perm('users:manage'), perm('roles:manage'), perm('audit:view'), perm('tasks:delete'), perm('tasks:update')],
    description: 'Administrador del sistema',
  });

  // SUPER_ADMIN (Level 5) hereta de ADMIN
  await Role.create({
    name: 'super_admin', level: 5, parentRole: admin._id,
    permissions: [perm('system:configure'), perm('system:backup')],
    description: 'Superadministrador amb accés total',
  });

  console.log('Rols creats: viewer, user, manager, admin, super_admin');

  // --- USUARIS PER DEFECTE ---
  await User.create([
    { email: 'superadmin@example.com', password: 'Password123!', firstName: 'Super', lastName: 'Admin', role: (await Role.findOne({ name: 'super_admin' }))._id },
    { email: 'admin@example.com', password: 'Password123!', firstName: 'Admin', lastName: 'User', role: admin._id },
    { email: 'manager@example.com', password: 'Password123!', firstName: 'Manager', lastName: 'User', role: manager._id },
    { email: 'user@example.com', password: 'Password123!', firstName: 'Regular', lastName: 'User', role: user._id },
    { email: 'viewer@example.com', password: 'Password123!', firstName: 'Viewer', lastName: 'User', role: viewer._id },
  ]);

  console.log('Usuaris creats: superadmin@, admin@, manager@, user@, viewer@example.com (Password123!)');
  await mongoose.disconnect();
  console.log('Seed completat!');
};

seed().catch(err => { console.error(err); process.exit(1); });
