// Calendar Page with react-big-calendar
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Typography, Box, Fab } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { ru } from 'date-fns/locale';
import { taskApi } from '../services/taskService';
import { tagApi } from '../services/tagService';
import TaskDialog from '../components/Tasks/TaskDialog';
import type { TaskWithTags, TaskCreateInput, TaskUpdateInput, Tag } from '../../worker/db-types';
import { useAuth } from '../context/AuthContext';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = {
  'ru': ru,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface CalendarEvent {
  id: number;
  title: string;
  start: Date;
  end: Date;
  resource: TaskWithTags;
}

export default function CalendarPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tasks, setTasks] = useState<TaskWithTags[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    loadTags();
    if (user) {
      loadTasks();
    }
  }, [user]);

  const loadTags = async () => {
    try {
      const loadedTags = await tagApi.getTags();
      setTags(loadedTags);
    } catch (err) {
      console.error('Failed to load tags:', err);
    }
  };

  const loadTasks = async () => {    
    try {
      // Load tasks for current month +/- 1 month for better navigation
      const start = new Date();
      start.setMonth(start.getMonth() - 1);
      start.setDate(1);
      
      const end = new Date();
      end.setMonth(end.getMonth() + 2);
      end.setDate(0);

      const loadedTasks = await taskApi.getTasks({
        date_from: start.toISOString(),
        date_to: end.toISOString(),
      });

      setTasks(loadedTasks);
    } catch (err) {
      console.error('Failed to load tasks:', err);
    }
  };

  const events = useMemo<CalendarEvent[]>(() => {
    return tasks.map((task) => ({
      id: task.id,
      title: task.title,
      start: new Date(task.start_datetime),
      end: task.deadline_datetime ? new Date(task.deadline_datetime) : new Date(task.start_datetime),
      resource: task,
    }));
  }, [tasks]);

  const handleSelectSlot = useCallback(({ start }: { start: Date }) => {
    setSelectedDate(start);
    setDialogOpen(true);
  }, []);

  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    navigate(`/tasks/${event.id}`);
  }, [navigate]);

  const handleSaveTask = async (data: TaskCreateInput | TaskUpdateInput) => {
    try {
      // If we have a selected date, use it
      if (selectedDate && !('title' in data && data.title === undefined)) {
        const taskData = data as TaskCreateInput;
        const enhancedData = {
          ...taskData,
          start_datetime: selectedDate.toISOString(),
        };
        await taskApi.createTask(enhancedData);
      } else {
        await taskApi.createTask(data as TaskCreateInput);
      }
      await loadTasks();
      setDialogOpen(false);
      setSelectedDate(null);
    } catch (err) {
      throw err;
    }
  };

  const eventStyleGetter = (event: CalendarEvent) => {
    const task = event.resource;
    const priorityColors: Record<string, string> = {
      low: '#4caf50',
      medium: '#ff9800',
      high: '#f44336',
      critical: '#9c27b0',
    };

    const statusOpacity: Record<string, number> = {
      planned: 1,
      in_progress: 0.9,
      done: 0.5,
      skipped: 0.3,
      canceled: 0.3,
    };

    return {
      style: {
        backgroundColor: priorityColors[task.priority] || '#2196f3',
        opacity: statusOpacity[task.status] || 1,
        borderRadius: '4px',
        border: 'none',
        color: '#fff',
        display: 'block',
        textDecoration: task.status === 'done' ? 'line-through' : 'none',
      },
    };
  };

  const messages = {
    today: 'Сегодня',
    previous: 'Назад',
    next: 'Вперёд',
    month: 'Месяц',
    week: 'Неделя',
    day: 'День',
    agenda: 'Список',
    date: 'Дата',
    time: 'Время',
    event: 'Событие',
    noEventsInRange: 'Нет задач в этом диапазоне',
    showMore: (total: number) => `+ еще ${total}`,
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 3, mb: 10 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Календарь
      </Typography>

      <Box sx={{ height: 'calc(100vh - 200px)', minHeight: 600 }}>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%' }}
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleSelectEvent}
          selectable
          popup
          views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
          defaultView={Views.MONTH}
          eventPropGetter={eventStyleGetter}
          messages={messages}
          culture="ru"
        />
      </Box>

      <TaskDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setSelectedDate(null);
        }}
        onSave={handleSaveTask}
        task={null}
        tags={tags}
      />

      <Fab
        color="primary"
        aria-label="add task"
        sx={{
          position: 'fixed',
          bottom: { xs: 72, md: 16 },
          right: 16,
        }}
        onClick={() => {
          setSelectedDate(null);
          setDialogOpen(true);
        }}
      >
        <AddIcon />
      </Fab>
    </Container>
  );
}

