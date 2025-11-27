// Task detail page with history
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  Chip,
  Button,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Edit as EditIcon,
  Archive as ArchiveIcon,
  ContentCopy as CopyIcon,
  Repeat as RepeatIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { taskApi } from '../services/taskService';
import { tagApi } from '../services/tagService';
import { recurrenceApi } from '../services/recurrenceService';
import TaskDialog from '../components/Tasks/TaskDialog';
import RecurrenceDialog from '../components/Tasks/RecurrenceDialog';
import type {
  TaskWithTags,
  Tag,
  TaskUpdateInput,
  TaskRecurrence,
  RecurrenceCreateInput,
  RecurrenceUpdateInput,
  TaskInstance,
} from '../../worker/db-types';

export default function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [task, setTask] = useState<TaskWithTags | null>(null);
  const [tags, setTags] = useState<Tag[]>([]);
  const [recurrence, setRecurrence] = useState<TaskRecurrence | null>(null);
  const [instances, setInstances] = useState<TaskInstance[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [recurrenceDialogOpen, setRecurrenceDialogOpen] = useState(false);

  useEffect(() => {
    loadTask();
    loadTags();
  }, [id]);

  useEffect(() => {
    if (tabValue === 1) {
      loadHistory();
    } else if (tabValue === 2) {
      loadRecurrence();
    }
  }, [tabValue]);

  const loadTask = async () => {
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      const loadedTask = await taskApi.getTask(parseInt(id));
      setTask(loadedTask);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load task');
    } finally {
      setLoading(false);
    }
  };

  const loadTags = async () => {
    try {
      const loadedTags = await tagApi.getTags();
      setTags(loadedTags);
    } catch (err) {
      console.error('Failed to load tags:', err);
    }
  };

  const loadHistory = async () => {
    if (!id) return;

    try {
      const loadedHistory = await taskApi.getTaskHistory(parseInt(id));
      setHistory(loadedHistory);
    } catch (err) {
      console.error('Failed to load history:', err);
    }
  };

  const loadRecurrence = async () => {
    if (!id) return;

    try {
      const loadedRecurrence = await recurrenceApi.getRecurrence(parseInt(id));
      setRecurrence(loadedRecurrence);

      const loadedInstances = await recurrenceApi.getInstances(parseInt(id));
      setInstances(loadedInstances);
    } catch (err) {
      // No recurrence found is not an error
      setRecurrence(null);
      setInstances([]);
    }
  };

  const handleEdit = () => {
    setEditDialogOpen(true);
  };

  const handleSaveTask = async (data: TaskUpdateInput) => {
    if (!task) return;

    try {
      await taskApi.updateTask(task.id, data);
      await loadTask();
      setEditDialogOpen(false);
    } catch (err) {
      throw err;
    }
  };

  const handleArchive = async () => {
    if (!task || !confirm('Переместить задачу в архив?')) return;

    try {
      await taskApi.deleteTask(task.id);
      navigate('/tasks');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to archive task');
    }
  };

  const handleDuplicate = async () => {
    if (!task) return;

    try {
      const duplicated = await taskApi.duplicateTask(task.id);
      navigate(`/tasks/${duplicated.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to duplicate task');
    }
  };

  const handleSaveRecurrence = async (data: RecurrenceCreateInput | RecurrenceUpdateInput) => {
    if (!task) return;

    try {
      if (recurrence) {
        await recurrenceApi.updateRecurrence(task.id, data as RecurrenceUpdateInput);
      } else {
        await recurrenceApi.createRecurrence(task.id, data as RecurrenceCreateInput);
      }
      await loadRecurrence();
      setRecurrenceDialogOpen(false);
    } catch (err) {
      throw err;
    }
  };

  const handleDeleteRecurrence = async () => {
    if (!task || !recurrence || !confirm('Удалить правило повторения?')) return;

    try {
      await recurrenceApi.deleteRecurrence(task.id);
      setRecurrence(null);
      setInstances([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete recurrence');
    }
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error || !task) {
    return (
      <Container maxWidth="md" sx={{ mt: 3 }}>
        <Alert severity="error">{error || 'Task not found'}</Alert>
        <Button startIcon={<BackIcon />} onClick={() => navigate(-1)} sx={{ mt: 2 }}>
          Назад
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 3, mb: 10 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <IconButton onClick={() => navigate(-1)}>
          <BackIcon />
        </IconButton>
        <Typography variant="h4" component="h1" sx={{ flex: 1 }}>
          {task.title}
        </Typography>
        <IconButton onClick={handleEdit}>
          <EditIcon />
        </IconButton>
        <IconButton onClick={handleDuplicate}>
          <CopyIcon />
        </IconButton>
        <IconButton onClick={handleArchive} color="warning">
          <ArchiveIcon />
        </IconButton>
      </Box>

      <Paper sx={{ p: 3, mb: 2 }}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            Описание
          </Typography>
          <Typography variant="body1">
            {task.description || 'Нет описания'}
          </Typography>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Начало
            </Typography>
            <Typography variant="body2">
              {format(new Date(task.start_datetime), 'dd MMM yyyy, HH:mm', { locale: ru })}
            </Typography>
          </Box>
          {task.deadline_datetime && (
            <Box>
              <Typography variant="caption" color="text.secondary">
                Дедлайн
              </Typography>
              <Typography variant="body2">
                {format(new Date(task.deadline_datetime), 'dd MMM yyyy, HH:mm', { locale: ru })}
              </Typography>
            </Box>
          )}
          <Box>
            <Typography variant="caption" color="text.secondary">
              Приоритет
            </Typography>
            <Typography variant="body2">{task.priority}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Статус
            </Typography>
            <Typography variant="body2">{task.status}</Typography>
          </Box>
        </Box>

        {task.tags.length > 0 && (
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {task.tags.map((tag) => (
              <Chip
                key={tag.id}
                label={tag.name}
                size="small"
                sx={{ backgroundColor: tag.color, color: '#fff' }}
              />
            ))}
          </Box>
        )}
      </Paper>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
          <Tab label="Основная информация" />
          <Tab label="История изменений" />
          <Tab label="Повторение" />
        </Tabs>
      </Box>

      {tabValue === 0 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="body1">Основная информация о задаче</Typography>
        </Paper>
      )}

      {tabValue === 1 && (
        <Paper sx={{ p: 3 }}>
          {history.length === 0 ? (
            <Typography color="text.secondary">Нет истории изменений</Typography>
          ) : (
            <List>
              {history.map((item: any, index: number) => (
                <ListItem key={index}>
                  <ListItemText
                    primary={`${item.action} - ${item.email || 'Unknown'}`}
                    secondary={format(new Date(item.created_at), 'dd MMM yyyy, HH:mm', {
                      locale: ru,
                    })}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Paper>
      )}

      {tabValue === 2 && (
        <Paper sx={{ p: 3 }}>
          {recurrence ? (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">Правило повторения</Typography>
                <Box>
                  <Button
                    startIcon={<EditIcon />}
                    onClick={() => setRecurrenceDialogOpen(true)}
                    sx={{ mr: 1 }}
                  >
                    Изменить
                  </Button>
                  <Button color="error" onClick={handleDeleteRecurrence}>
                    Удалить
                  </Button>
                </Box>
              </Box>
              <Typography>Тип: {recurrence.recurrence_type}</Typography>
              <Typography>Интервал: {recurrence.interval_value}</Typography>
              <Typography>Окончание: {recurrence.end_type}</Typography>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="h6" gutterBottom>
                Инстансы ({instances.length})
              </Typography>
              <List>
                {instances.slice(0, 10).map((instance) => (
                  <ListItem key={instance.id}>
                    <ListItemText
                      primary={instance.title}
                      secondary={`${format(
                        new Date(instance.scheduled_datetime),
                        'dd MMM yyyy, HH:mm',
                        { locale: ru }
                      )} - ${instance.status}`}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center' }}>
              <Typography color="text.secondary" gutterBottom>
                Задача не повторяется
              </Typography>
              <Button
                variant="contained"
                startIcon={<RepeatIcon />}
                onClick={() => setRecurrenceDialogOpen(true)}
                sx={{ mt: 2 }}
              >
                Настроить повторение
              </Button>
            </Box>
          )}
        </Paper>
      )}

      <TaskDialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        onSave={handleSaveTask}
        task={task}
        tags={tags}
      />

      <RecurrenceDialog
        open={recurrenceDialogOpen}
        onClose={() => setRecurrenceDialogOpen(false)}
        onSave={handleSaveRecurrence}
        recurrence={recurrence}
      />
    </Container>
  );
}


