// Task creation/editing dialog
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Box,
  Chip,
  OutlinedInput,
  Alert,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ru } from 'date-fns/locale';
import type { TaskCreateInput, TaskUpdateInput, TaskWithTags, Tag, TaskPriority, TaskStatus } from '../../../worker/db-types';

interface TaskDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: TaskCreateInput | TaskUpdateInput) => Promise<void>;
  task?: TaskWithTags | null;
  tags: Tag[];
}

const priorityOptions: { value: TaskPriority; label: string; color: string }[] = [
  { value: 'low', label: 'Низкий', color: '#4caf50' },
  { value: 'medium', label: 'Средний', color: '#ff9800' },
  { value: 'high', label: 'Высокий', color: '#f44336' },
  { value: 'critical', label: 'Критический', color: '#9c27b0' },
];

const statusOptions: { value: TaskStatus; label: string }[] = [
  { value: 'planned', label: 'Запланировано' },
  { value: 'in_progress', label: 'В процессе' },
  { value: 'done', label: 'Выполнено' },
  { value: 'skipped', label: 'Пропущено' },
  { value: 'canceled', label: 'Отменено' },
];

export default function TaskDialog({ open, onClose, onSave, task, tags }: TaskDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDatetime, setStartDatetime] = useState<Date | null>(new Date());
  const [deadlineDatetime, setDeadlineDatetime] = useState<Date | null>(null);
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [status, setStatus] = useState<TaskStatus>('planned');
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      if (task) {
        // Edit mode
        setTitle(task.title);
        setDescription(task.description || '');
        setStartDatetime(new Date(task.start_datetime));
        setDeadlineDatetime(task.deadline_datetime ? new Date(task.deadline_datetime) : null);
        setPriority(task.priority);
        setStatus(task.status);
        setSelectedTags(task.tags.map(t => t.id));
      } else {
        // Create mode
        setTitle('');
        setDescription('');
        setStartDatetime(new Date());
        setDeadlineDatetime(null);
        setPriority('medium');
        setStatus('planned');
        setSelectedTags([]);
      }
      setError(null);
    }
  }, [open, task]);

  const handleTagChange = (event: SelectChangeEvent<number[]>) => {
    const value = event.target.value;
    setSelectedTags(typeof value === 'string' ? [] : value);
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError('Название задачи обязательно');
      return;
    }

    if (!startDatetime) {
      setError('Дата и время начала обязательны');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data: TaskCreateInput | TaskUpdateInput = {
        title: title.trim(),
        description: description.trim() || undefined,
        start_datetime: startDatetime.toISOString(),
        deadline_datetime: deadlineDatetime?.toISOString(),
        priority,
        status,
        tag_ids: selectedTags,
      };

      await onSave(data);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ru}>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>{task ? 'Редактировать задачу' : 'Создать задачу'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}

            <TextField
              label="Название"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              fullWidth
              required
              autoFocus
            />

            <TextField
              label="Описание"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              fullWidth
              multiline
              rows={3}
            />

            <DateTimePicker
              label="Дата и время начала"
              value={startDatetime}
              onChange={(newValue) => setStartDatetime(newValue)}
              slotProps={{
                textField: {
                  fullWidth: true,
                  required: true,
                },
              }}
            />

            <DateTimePicker
              label="Дедлайн (опционально)"
              value={deadlineDatetime}
              onChange={(newValue) => setDeadlineDatetime(newValue)}
              slotProps={{
                textField: {
                  fullWidth: true,
                },
              }}
            />

            <FormControl fullWidth>
              <InputLabel>Приоритет</InputLabel>
              <Select
                value={priority}
                label="Приоритет"
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
              >
                {priorityOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          backgroundColor: option.color,
                        }}
                      />
                      {option.label}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Статус</InputLabel>
              <Select
                value={status}
                label="Статус"
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
              >
                {statusOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Теги</InputLabel>
              <Select
                multiple
                value={selectedTags}
                onChange={handleTagChange}
                input={<OutlinedInput label="Теги" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((tagId) => {
                      const tag = tags.find((t) => t.id === tagId);
                      return tag ? (
                        <Chip
                          key={tag.id}
                          label={tag.name}
                          size="small"
                          sx={{
                            backgroundColor: tag.color,
                            color: '#fff',
                          }}
                        />
                      ) : null;
                    })}
                  </Box>
                )}
              >
                {tags.map((tag) => (
                  <MenuItem key={tag.id} value={tag.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          backgroundColor: tag.color,
                        }}
                      />
                      {tag.name}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={loading}>
            Отмена
          </Button>
          <Button onClick={handleSubmit} variant="contained" disabled={loading}>
            {loading ? 'Сохранение...' : 'Сохранить'}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
}

