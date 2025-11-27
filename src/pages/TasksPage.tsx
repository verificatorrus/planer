// Tasks Page - All tasks view with filters
import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Fab,
  TextField,
  InputAdornment,
} from '@mui/material';
import { Add as AddIcon, Search as SearchIcon } from '@mui/icons-material';
import { taskApi } from '../services/taskService';
import { tagApi } from '../services/tagService';
import TaskDialog from '../components/Tasks/TaskDialog';
import TaskList from '../components/Tasks/TaskList';
import TaskFilters from '../components/Tasks/TaskFilters';
import type { TaskWithTags, TaskCreateInput, TaskUpdateInput, Tag, TaskStatus, TaskFilters as Filters } from '../../worker/db-types';
import { useAuth } from '../context/AuthContext';

export default function TasksPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<TaskWithTags[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskWithTags | null>(null);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Filters>({});

  // Load tags
  useEffect(() => {
    loadTags();
  }, []);

  // Load tasks when filters change
  useEffect(() => {
    if (user) {
      loadTasks();
    }
  }, [filters, search, user]);

  const loadTags = async () => {
    try {
      const loadedTags = await tagApi.getTags();
      setTags(loadedTags);
    } catch (err) {
      console.error('Failed to load tags:', err);
    }
  };

  const loadTasks = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const loadedTasks = await taskApi.getTasks({
        ...filters,
        search: search || undefined,
      });

      setTasks(loadedTasks);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = () => {
    setEditingTask(null);
    setDialogOpen(true);
  };

  const handleEditTask = (task: TaskWithTags) => {
    setEditingTask(task);
    setDialogOpen(true);
  };

  const handleSaveTask = async (data: TaskCreateInput | TaskUpdateInput) => {
    try {
      if (editingTask) {
        await taskApi.updateTask(editingTask.id, data as TaskUpdateInput);
      } else {
        await taskApi.createTask(data as TaskCreateInput);
      }
      await loadTasks();
      setDialogOpen(false);
    } catch (err) {
      throw err;
    }
  };

  const handleArchiveTask = async (taskId: number) => {
    try {
      await taskApi.deleteTask(taskId);
      await loadTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to archive task');
    }
  };

  const handleRestoreTask = async (taskId: number) => {
    try {
      await taskApi.restoreTask(taskId);
      await loadTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to restore task');
    }
  };

  const handleHardDeleteTask = async (taskId: number) => {
    try {
      await taskApi.hardDeleteTask(taskId);
      await loadTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete task');
    }
  };

  const handleDuplicateTask = async (taskId: number) => {
    try {
      await taskApi.duplicateTask(taskId);
      await loadTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to duplicate task');
    }
  };

  const handleStatusChange = async (taskId: number, status: TaskStatus) => {
    try {
      await taskApi.updateTaskStatus(taskId, status);
      await loadTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update task status');
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 3, mb: 10 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        {filters.include_archived ? 'Архив задач' : 'Все задачи'}
      </Typography>
      
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Поиск задач..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 2 }}
        />

        <TaskFilters
          filters={filters}
          tags={tags}
          onChange={setFilters}
        />
      </Box>

      <TaskList
        tasks={tasks}
        loading={loading}
        error={error}
        onEdit={handleEditTask}
        onArchive={handleArchiveTask}
        onRestore={handleRestoreTask}
        onHardDelete={handleHardDeleteTask}
        onDuplicate={handleDuplicateTask}
        onStatusChange={handleStatusChange}
        emptyMessage={filters.include_archived ? 'Архив пуст' : 'Задачи не найдены'}
        isArchiveView={!!filters.include_archived}
      />

      <TaskDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleSaveTask}
        task={editingTask}
        tags={tags}
      />

      {!filters.include_archived && (
        <Fab
          color="primary"
          aria-label="add task"
          sx={{
            position: 'fixed',
            bottom: { xs: 72, md: 16 },
            right: 16,
          }}
          onClick={handleCreateTask}
        >
          <AddIcon />
        </Fab>
      )}
    </Container>
  );
}

