const Task = require('../models/Task');
const auditService = require('../services/auditService');

/**
 * POST /api/tasks
 */
const createTask = async (req, res, next) => {
  try {
    const startTime = Date.now();
    const { title, description, status, priority, assignedTo, dueDate } = req.body;
    const task = await Task.create({ title, description, status, priority, assignedTo, dueDate, createdBy: req.user._id });

    await auditService.logAction(req.user._id, 'tasks:create', String(task._id), 'task', { title, status, priority }, 'success',
      { ...auditService.extractMeta(req), duration: Date.now() - startTime });

    res.status(201).json(task);
  } catch (err) { next(err); }
};

/**
 * GET /api/tasks
 */
const getTasks = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.priority) filter.priority = req.query.priority;

    const [tasks, total] = await Promise.all([
      Task.find(filter).populate('createdBy', 'email firstName').populate('assignedTo', 'email firstName').skip(skip).limit(limit).sort('-createdAt'),
      Task.countDocuments(filter),
    ]);

    res.json({ tasks, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
};

/**
 * GET /api/tasks/:id
 */
const getTaskById = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id).populate('createdBy', 'email firstName').populate('assignedTo', 'email firstName');
    if (!task) return res.status(404).json({ error: 'Tasca no trobada', code: 'NOT_FOUND' });
    res.json(task);
  } catch (err) { next(err); }
};

/**
 * PUT /api/tasks/:id
 */
const updateTask = async (req, res, next) => {
  try {
    const startTime = Date.now();
    const existing = await Task.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Tasca no trobada', code: 'NOT_FOUND' });

    const allowedFields = ['title', 'description', 'status', 'priority', 'assignedTo', 'dueDate'];
    const updates = {};
    const changes = {};

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined && String(existing[field]) !== String(req.body[field])) {
        changes[field] = { old: existing[field], new: req.body[field] };
        updates[field] = req.body[field];
      }
    });

    const task = await Task.findByIdAndUpdate(req.params.id, updates, { new: true });

    await auditService.logAction(req.user._id, 'tasks:update', req.params.id, 'task', changes, 'success',
      { ...auditService.extractMeta(req), duration: Date.now() - startTime });

    res.json(task);
  } catch (err) { next(err); }
};

/**
 * DELETE /api/tasks/:id
 */
const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ error: 'Tasca no trobada', code: 'NOT_FOUND' });

    await auditService.logAction(req.user._id, 'tasks:delete', req.params.id, 'task', { title: task.title }, 'success', auditService.extractMeta(req));
    res.json({ message: 'Tasca eliminada correctament' });
  } catch (err) { next(err); }
};

module.exports = { createTask, getTasks, getTaskById, updateTask, deleteTask };
