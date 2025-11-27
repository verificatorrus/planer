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
  IconButton,
  Button,
} from '@mui/material';
import { 
  Add as AddIcon, 
  CalendarMonth, 
  ViewDay, 
  ViewWeek,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';
import { 
  format, 
  startOfToday, 
  startOfWeek, 
  startOfMonth, 
  endOfDay, 
  endOfWeek, 
  endOfMonth,
  addDays,
  addWeeks,
  addMonths,
  subDays,
  subWeeks,
  subMonths,
  isSameDay,
} from 'date-fns';
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
  const [currentDate, setCurrentDate] = useState<Date>(startOfToday());
  const [tasks, setTasks] = useState<TaskWithTags[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskWithTags | null>(null);

  // Load tags
  useEffect(() => {
    loadTags();
  }, []);

  // Load tasks when view or date changes
  useEffect(() => {
    if (user) {
      loadTasks();
    }
  }, [view, currentDate, user]);

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
        dateFrom = currentDate;
        dateTo = endOfDay(currentDate);
      } else if (view === 'week') {
        dateFrom = startOfWeek(currentDate, { weekStartsOn: 1 });
        dateTo = endOfWeek(currentDate, { weekStartsOn: 1 });
      } else {
        dateFrom = startOfMonth(currentDate);
        dateTo = endOfMonth(currentDate);
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

  const handleArchiveTask = async (taskId: number) => {
    try {
      await taskApi.deleteTask(taskId);
      await loadTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to archive task');
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

  // Navigation functions
  const handlePreviousPeriod = () => {
    if (view === 'day') {
      setCurrentDate(subDays(currentDate, 1));
    } else if (view === 'week') {
      setCurrentDate(subWeeks(currentDate, 1));
    } else {
      setCurrentDate(subMonths(currentDate, 1));
    }
  };

  const handleNextPeriod = () => {
    if (view === 'day') {
      setCurrentDate(addDays(currentDate, 1));
    } else if (view === 'week') {
      setCurrentDate(addWeeks(currentDate, 1));
    } else {
      setCurrentDate(addMonths(currentDate, 1));
    }
  };

  const handleToday = () => {
    setCurrentDate(startOfToday());
  };

  const isToday = isSameDay(currentDate, startOfToday());

  const getViewTitle = () => {
    if (view === 'day') {
      return format(currentDate, 'EEEE, d MMMM yyyy', { locale: ru });
    } else if (view === 'week') {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
      return `Неделя: ${format(weekStart, 'd MMM', { locale: ru })} - ${format(weekEnd, 'd MMM yyyy', { locale: ru })}`;
    } else {
      return format(currentDate, 'LLLL yyyy', { locale: ru });
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 3, mb: 10 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
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

      {/* Date navigation */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        mb: 2,
        gap: 2,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton 
            onClick={handlePreviousPeriod}
            size="small"
            aria-label="previous period"
          >
            <ChevronLeftIcon />
          </IconButton>
          
          <Typography 
            variant="h6" 
            color="text.secondary"
            sx={{ minWidth: { xs: 'auto', sm: '300px' }, textAlign: 'center' }}
          >
            {getViewTitle()}
          </Typography>
          
          <IconButton 
            onClick={handleNextPeriod}
            size="small"
            aria-label="next period"
          >
            <ChevronRightIcon />
          </IconButton>
        </Box>

        {!isToday && (
          <Button
            variant="outlined"
            size="small"
            onClick={handleToday}
          >
            Сегодня
          </Button>
        )}
      </Box>

      <TaskList
        tasks={tasks}
        loading={loading}
        error={error}
        onEdit={handleEditTask}
        onArchive={handleArchiveTask}
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

