import express from 'express';
import {
  getAllItems,
  getItem,
  createItem,
  updateItem,
  deleteItem
} from '../controllers/itemController.js';

const router = express.Router();

router.get('/', getAllItems);
router.post('/', createItem);

router.get('/:id', getItem);
router.patch('/:id', updateItem);
router.delete('/:id', deleteItem);

export default router;