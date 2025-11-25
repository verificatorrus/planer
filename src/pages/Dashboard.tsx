// Dashboard Page
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Fab,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import { Add as AddIcon, CalendarMonth, ViewDay, ViewWeek } from '@mui/icons-material';
import { format, startOfToday, startOfWeek, startOfMonth, endOfDay, endOfWeek, endOfMonth } from 'date-fns';
import { ru } from 'date-fns/locale';
import { taskApi } from '../services/taskService';
import { tagApi } from '../services/tagService';
import TaskDialog from '../components/Tasks/TaskDialog';
import TaskList from '../components/Tasks/TaskList';
import type { TaskWithTags, TaskCreateInput, TaskUpdateInput, Tag, TaskStatus } from '../../worker/db-types';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [view, setView] = useState<'day' | 'week' | 'month'>('day');
  const [tasks, setTasks] = useState<TaskWithTags[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskWithTags | null>(null);
  
  const today = startOfToday();

  // Load tags
  useEffect(() => {
    loadTags();
  }, []);

  // Load tasks when view changes
  useEffect(() => {
    if (user) {
      loadTasks();
    }
  }, [view, user]);

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
      let dateFrom: Date;
      let dateTo: Date;

      if (view === 'day') {
        dateFrom = today;
        dateTo = endOfDay(today);
      } else if (view === 'week') {
        dateFrom = startOfWeek(today, { weekStartsOn: 1 });
        dateTo = endOfWeek(today, { weekStartsOn: 1 });
      } else {
        dateFrom = startOfMonth(today);
        dateTo = endOfMonth(today);
      }

      const loadedTasks = await taskApi.getTasks({
        date_from: dateFrom.toISOString(),
        date_to: dateTo.toISOString(),
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

  const handleTaskClick = (task: TaskWithTags) => {
    navigate(`/tasks/${task.id}`);
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

  const handleDeleteTask = async (taskId: number) => {
    try {
      await taskApi.deleteTask(taskId);
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

  const getViewTitle = () => {
    if (view === 'day') {
      return format(today, 'EEEE, d MMMM yyyy', { locale: ru });
    } else if (view === 'week') {
      const weekStart = startOfWeek(today, { weekStartsOn: 1 });
      return `Неделя с ${format(weekStart, 'd MMM', { locale: ru })}`;
    } else {
      return format(startOfMonth(today), 'LLLL yyyy', { locale: ru });
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 3, mb: 10 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Мои задачи
        </Typography>
        
        <ToggleButtonGroup
          value={view}
          exclusive
          onChange={(_, newView) => newView && setView(newView)}
          size="small"
        >
          <ToggleButton value="day">
            <ViewDay sx={{ mr: 0.5 }} /> День
          </ToggleButton>
          <ToggleButton value="week">
            <ViewWeek sx={{ mr: 0.5 }} /> Неделя
          </ToggleButton>
          <ToggleButton value="month">
            <CalendarMonth sx={{ mr: 0.5 }} /> Месяц
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <Typography variant="h6" color="text.secondary" gutterBottom>
        {getViewTitle()}
      </Typography>

      <TaskList
        tasks={tasks}
        loading={loading}
        error={error}
        onEdit={handleEditTask}
        onDelete={handleDeleteTask}
        onDuplicate={handleDuplicateTask}
        onStatusChange={handleStatusChange}
        onTaskClick={handleTaskClick}
        emptyMessage={`Нет задач на ${view === 'day' ? 'сегодня' : view === 'week' ? 'эту неделю' : 'этот месяц'}`}
      />

      <TaskDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleSaveTask}
        task={editingTask}
        tags={tags}
      />

      {/* FAB для быстрого добавления задачи */}
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
    </Container>
  );
}

