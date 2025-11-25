// Recurrence settings component
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Box,
  Typography,
  FormGroup,
  FormControlLabel,
  Checkbox,
  RadioGroup,
  Radio,
  Alert,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ru } from 'date-fns/locale';
import type { RecurrenceCreateInput, RecurrenceUpdateInput, TaskRecurrence, RecurrenceType, RecurrenceEndType } from '../../../worker/db-types';

interface RecurrenceDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: RecurrenceCreateInput | RecurrenceUpdateInput) => Promise<void>;
  recurrence?: TaskRecurrence | null;
}

const recurrenceTypeOptions: { value: RecurrenceType; label: string }[] = [
  { value: 'daily', label: 'Ежедневно' },
  { value: 'weekly', label: 'Еженедельно' },
  { value: 'monthly', label: 'Ежемесячно' },
  { value: 'yearly', label: 'Ежегодно' },
  { value: 'workdays', label: 'По рабочим дням (Пн-Пт)' },
  { value: 'weekends', label: 'По выходным (Сб-Вс)' },
  { value: 'custom', label: 'Кастомный интервал' },
];

const weekDays = [
  { value: 1, label: 'Пн' },
  { value: 2, label: 'Вт' },
  { value: 3, label: 'Ср' },
  { value: 4, label: 'Чт' },
  { value: 5, label: 'Пт' },
  { value: 6, label: 'Сб' },
  { value: 0, label: 'Вс' },
];

export default function RecurrenceDialog({
  open,
  onClose,
  onSave,
  recurrence,
}: RecurrenceDialogProps) {
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>('daily');
  const [intervalValue, setIntervalValue] = useState(1);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [dayOfMonth, setDayOfMonth] = useState(1);
  const [endType, setEndType] = useState<RecurrenceEndType>('never');
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [endCount, setEndCount] = useState(10);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      if (recurrence) {
        setRecurrenceType(recurrence.recurrence_type);
        setIntervalValue(recurrence.interval_value);
        setSelectedDays(
          recurrence.days_of_week ? JSON.parse(recurrence.days_of_week) : []
        );
        setDayOfMonth(recurrence.day_of_month || 1);
        setEndType(recurrence.end_type);
        setEndDate(recurrence.end_date ? new Date(recurrence.end_date) : null);
        setEndCount(recurrence.end_count || 10);
      } else {
        setRecurrenceType('daily');
        setIntervalValue(1);
        setSelectedDays([]);
        setDayOfMonth(1);
        setEndType('never');
        setEndDate(null);
        setEndCount(10);
      }
      setError(null);
    }
  }, [open, recurrence]);

  const handleDayToggle = (day: number) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSubmit = async () => {
    // Validation
    if (recurrenceType === 'weekly' && selectedDays.length === 0) {
      setError('Выберите хотя бы один день недели');
      return;
    }

    if (endType === 'date' && !endDate) {
      setError('Укажите дату окончания');
      return;
    }

    if (endType === 'count' && endCount < 1) {
      setError('Количество повторений должно быть больше 0');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data: RecurrenceCreateInput | RecurrenceUpdateInput = {
        recurrence_type: recurrenceType,
        interval_value: intervalValue,
        days_of_week: recurrenceType === 'weekly' ? selectedDays : undefined,
        day_of_month: recurrenceType === 'monthly' ? dayOfMonth : undefined,
        end_type: endType,
        end_date: endType === 'date' && endDate ? endDate.toISOString() : undefined,
        end_count: endType === 'count' ? endCount : undefined,
      };

      await onSave(data);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save recurrence');
    } finally {
      setLoading(false);
    }
  };

  const needsInterval =
    recurrenceType === 'daily' ||
    recurrenceType === 'weekly' ||
    recurrenceType === 'monthly' ||
    recurrenceType === 'yearly' ||
    recurrenceType === 'custom';

  const needsDaysOfWeek = recurrenceType === 'weekly';
  const needsDayOfMonth = recurrenceType === 'monthly';

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ru}>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {recurrence ? 'Редактировать повторение' : 'Настроить повторение'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}

            <FormControl fullWidth>
              <InputLabel>Тип повторения</InputLabel>
              <Select
                value={recurrenceType}
                label="Тип повторения"
                onChange={(e) => setRecurrenceType(e.target.value as RecurrenceType)}
              >
                {recurrenceTypeOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {needsInterval && (
              <TextField
                label={
                  recurrenceType === 'daily'
                    ? 'Каждые N дней'
                    : recurrenceType === 'weekly'
                    ? 'Каждые N недель'
                    : recurrenceType === 'monthly'
                    ? 'Каждые N месяцев'
                    : recurrenceType === 'yearly'
                    ? 'Каждые N лет'
                    : 'Интервал (дни)'
                }
                type="number"
                value={intervalValue}
                onChange={(e) => setIntervalValue(Math.max(1, parseInt(e.target.value) || 1))}
                fullWidth
                inputProps={{ min: 1 }}
              />
            )}

            {needsDaysOfWeek && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Дни недели
                </Typography>
                <FormGroup row>
                  {weekDays.map((day) => (
                    <FormControlLabel
                      key={day.value}
                      control={
                        <Checkbox
                          checked={selectedDays.includes(day.value)}
                          onChange={() => handleDayToggle(day.value)}
                        />
                      }
                      label={day.label}
                    />
                  ))}
                </FormGroup>
              </Box>
            )}

            {needsDayOfMonth && (
              <TextField
                label="День месяца"
                type="number"
                value={dayOfMonth}
                onChange={(e) =>
                  setDayOfMonth(Math.min(31, Math.max(1, parseInt(e.target.value) || 1)))
                }
                fullWidth
                inputProps={{ min: 1, max: 31 }}
                helperText="От 1 до 31. Если в месяце меньше дней, будет использован последний день."
              />
            )}

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Окончание повторений
              </Typography>
              <RadioGroup
                value={endType}
                onChange={(e) => setEndType(e.target.value as RecurrenceEndType)}
              >
                <FormControlLabel value="never" control={<Radio />} label="Никогда" />
                <FormControlLabel value="date" control={<Radio />} label="До даты" />
                <FormControlLabel value="count" control={<Radio />} label="После N повторений" />
              </RadioGroup>

              {endType === 'date' && (
                <DatePicker
                  label="Дата окончания"
                  value={endDate}
                  onChange={(newValue) => setEndDate(newValue)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      sx: { mt: 1 },
                    },
                  }}
                />
              )}

              {endType === 'count' && (
                <TextField
                  label="Количество повторений"
                  type="number"
                  value={endCount}
                  onChange={(e) => setEndCount(Math.max(1, parseInt(e.target.value) || 1))}
                  fullWidth
                  sx={{ mt: 1 }}
                  inputProps={{ min: 1 }}
                />
              )}
            </Box>
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

