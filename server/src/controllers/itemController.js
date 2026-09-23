import Joi from 'joi';
import { Item } from '../models/Item.js';

const createSchema = Joi.object({
  title: Joi.string().min(1).max(100).required(),
  description: Joi.string().allow('', null),
  category: Joi.string().valid(
    'electronics',
    'clothing',
    'documents',
    'accessories',
    'other'
  ),
  status: Joi.string().valid('lost', 'found', 'claimed'),
  location: Joi.string().allow('', null),
  reportedBy: Joi.string()
});

const updateSchema = Joi.object({
  title: Joi.string().min(1).max(100),
  description: Joi.string().allow('', null),
  category: Joi.string().valid(
    'electronics',
    'clothing',
    'documents',
    'accessories',
    'other'
  ),
  status: Joi.string().valid('lost', 'found', 'claimed'),
  location: Joi.string().allow('', null),
  reportedBy: Joi.string()
}).min(1);

// GET /api/items
export async function getAllItems(req, res, next) {
  try {
    const filter = {};

    // Filter by status
    if (req.query.status) {
      filter.status = req.query.status;
    }

    // Filter by category
    if (req.query.category) {
      filter.category = req.query.category;
    }

    // Filter by location
    if (req.query.location) {
      filter.location = {
        $regex: req.query.location,
        $options: 'i'
      };
    }

    const items = await Item.find(filter)
      .populate('reportedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({ items });
  } catch (err) {
    next(err);
  }
}

// GET /api/items/:id
export async function getItem(req, res, next) {
  try {
    const item = await Item.findById(req.params.id)
      .populate('reportedBy', 'name email');

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    res.json({ item });
  } catch (err) {
    next(err);
  }
}

// POST /api/items
export async function createItem(req, res, next) {
  try {
    const { value, error } = createSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    const item = await Item.create(value);

    await item.populate('reportedBy', 'name email');

    res.status(201).json({ item });
  } catch (err) {
    // Duplicate title + location
    if (err.code === 11000) {
      return res.status(409).json({
        message: 'An item with this title already exists at this location'
      });
    }

    next(err);
  }
}

// PATCH /api/items/:id
export async function updateItem(req, res, next) {
  try {
    const { value, error } = updateSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    const item = await Item.findByIdAndUpdate(
      req.params.id,
      { $set: value },
      {
        new: true,
        runValidators: true
      }
    ).populate('reportedBy', 'name email');

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    res.json({ item });
  } catch (err) {
    // Duplicate title + location
    if (err.code === 11000) {
      return res.status(409).json({
        message: 'An item with this title already exists at this location'
      });
    }

    next(err);
  }
}

// DELETE /api/items/:id
export async function deleteItem(req, res, next) {
  try {
    const item = await Item.findByIdAndDelete(req.params.id);

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}