import { Router, Request, Response, RequestHandler } from 'express';
import Task from '../models/Task';

const router = Router();

interface TaskQuery {
  month?: string;
  year?: string;
}

// Get tasks with optional month/year filter
const getTasks: RequestHandler<{}, {}, {}, TaskQuery> = async (req, res) => {
  try {
    const { month, year } = req.query;
    
    if (month && year) {
      // Create date range for the specified month
      const startDate = new Date(Number(year), Number(month), 1);
      const endDate = new Date(Number(year), Number(month) + 1, 0);

      const tasks = await Task.find({
        date: {
          $gte: startDate,
          $lte: endDate
        }
      });
      res.json(tasks);
    } else {
      const tasks = await Task.find();
      res.json(tasks);
    }
  } catch (error: any) {
    res.status(500).json({ message: error?.message || 'An unknown error occurred' });
  }
};

interface TaskBody {
  date: string;
  isChecked: boolean;
}

// Create a task
const createTask: RequestHandler<{}, {}, TaskBody> = async (req, res) => {
  try {
    const task = new Task({
      date: req.body.date,
      isChecked: true
    });

    const newTask = await task.save();
    res.status(201).json(newTask);
  } catch (error: any) {
    res.status(400).json({ message: error?.message || 'Failed to create task' });
  }
};

interface TaskParams {
  id: string;
}

// Update task status
const updateTask: RequestHandler<TaskParams, {}, Partial<TaskBody>> = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }
    
    task.isChecked = req.body.isChecked ?? task.isChecked;
    const updatedTask = await task.save();
    res.json(updatedTask);
  } catch (error: any) {
    res.status(400).json({ message: error?.message || 'Failed to update task' });
  }
};

router.get('/', getTasks);
router.post('/', createTask);
router.patch('/:id', updateTask);

export default router;