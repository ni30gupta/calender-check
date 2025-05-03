import { Schema, model } from 'mongoose';

interface ITask {
  date: Date;
  isChecked: boolean;
}

const taskSchema = new Schema<ITask>({
  date: { type: Date, required: true },
  isChecked: { type: Boolean, default: false }
});

// Add index for date field for better query performance
taskSchema.index({ date: 1 });

export default model<ITask>('Task', taskSchema);