// Task list component
import { Box, Typography, CircularProgress, Alert } from '@mui/material';
import TaskCard from './TaskCard';
import type { TaskWithTags, TaskStatus } from '../../../worker/db-types';

interface TaskListProps {
  tasks: TaskWithTags[];
  loading?: boolean;
  error?: string | null;
  onEdit: (task: TaskWithTags) => void;
  onDelete: (taskId: number) => void;
  onDuplicate: (taskId: number) => void;
  onStatusChange: (taskId: number, status: TaskStatus) => void;
  onTaskClick?: (task: TaskWithTags) => void;
  emptyMessage?: string;
}

export default function TaskList({
  tasks,
  loading = false,
  error = null,
  onEdit,
  onDelete,
  onDuplicate,
  onStatusChange,
  onTaskClick,
  emptyMessage = 'Нет задач',
}: TaskListProps) {
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ my: 2 }}>
        {error}
      </Alert>
    );
  }

  if (tasks.length === 0) {
    return (
      <Box sx={{ py: 4, textAlign: 'center' }}>
        <Typography color="text.secondary">{emptyMessage}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          onEdit={onEdit}
          onDelete={onDelete}
          onDuplicate={onDuplicate}
          onStatusChange={onStatusChange}
          onClick={onTaskClick}
        />
      ))}
    </Box>
  );
}

