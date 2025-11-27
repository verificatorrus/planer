// Task filters component
import {
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Chip,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Button,
  Switch,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  FilterList as FilterIcon,
  Archive as ArchiveIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ru } from 'date-fns/locale';
import type { TaskFilters, Tag, TaskPriority, TaskStatus } from '../../../worker/db-types';

interface TaskFiltersProps {
  filters: TaskFilters;
  tags: Tag[];
  onChange: (filters: TaskFilters) => void;
}

const priorityOptions: { value: TaskPriority; label: string }[] = [
  { value: 'low', label: 'Низкий' },
  { value: 'medium', label: 'Средний' },
  { value: 'high', label: 'Высокий' },
  { value: 'critical', label: 'Критический' },
];

const statusOptions: { value: TaskStatus; label: string }[] = [
  { value: 'planned', label: 'Запланировано' },
  { value: 'in_progress', label: 'В процессе' },
  { value: 'done', label: 'Выполнено' },
  { value: 'skipped', label: 'Пропущено' },
  { value: 'canceled', label: 'Отменено' },
];

export default function TaskFilters({ filters, tags, onChange }: TaskFiltersProps) {
  const dateFromValue = filters.date_from ? new Date(filters.date_from) : null;
  const dateToValue = filters.date_to ? new Date(filters.date_to) : null;

  const handleStatusChange = (status: TaskStatus) => {
    const currentStatuses = Array.isArray(filters.status)
      ? filters.status
      : filters.status
      ? [filters.status]
      : [];

    const newStatuses = currentStatuses.includes(status)
      ? currentStatuses.filter((s) => s !== status)
      : [...currentStatuses, status];

    onChange({
      ...filters,
      status: newStatuses.length > 0 ? newStatuses : undefined,
    });
  };

  const handlePriorityChange = (priority: TaskPriority) => {
    const currentPriorities = Array.isArray(filters.priority)
      ? filters.priority
      : filters.priority
      ? [filters.priority]
      : [];

    const newPriorities = currentPriorities.includes(priority)
      ? currentPriorities.filter((p) => p !== priority)
      : [...currentPriorities, priority];

    onChange({
      ...filters,
      priority: newPriorities.length > 0 ? newPriorities : undefined,
    });
  };

  const handleTagChange = (tagId: number) => {
    const currentTags = filters.tag_ids || [];
    const newTags = currentTags.includes(tagId)
      ? currentTags.filter((id) => id !== tagId)
      : [...currentTags, tagId];

    onChange({
      ...filters,
      tag_ids: newTags.length > 0 ? newTags : undefined,
    });
  };

  const handleDateFromChange = (date: string) => {
    onChange({
      ...filters,
      date_from: date || undefined,
    });
  };

  const handleDateToChange = (date: string) => {
    onChange({
      ...filters,
      date_to: date || undefined,
    });
  };

  const handleClearFilters = () => {
    onChange({});
  };

  const isStatusChecked = (status: TaskStatus) => {
    if (!filters.status) return false;
    return Array.isArray(filters.status)
      ? filters.status.includes(status)
      : filters.status === status;
  };

  const isPriorityChecked = (priority: TaskPriority) => {
    if (!filters.priority) return false;
    return Array.isArray(filters.priority)
      ? filters.priority.includes(priority)
      : filters.priority === priority;
  };

  const isTagChecked = (tagId: number) => {
    return filters.tag_ids?.includes(tagId) || false;
  };

  const handleArchiveToggle = () => {
    onChange({
      ...filters,
      include_archived: !filters.include_archived,
    });
  };

  const hasActiveFilters = !!(
    filters.status ||
    filters.priority ||
    (filters.tag_ids && filters.tag_ids.length > 0) ||
    filters.date_from ||
    filters.date_to
  );

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ru}>
      {/* Archive toggle */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 2,
          p: 2,
          borderRadius: 1,
          backgroundColor: filters.include_archived ? 'action.selected' : 'background.paper',
          border: 1,
          borderColor: filters.include_archived ? 'warning.main' : 'divider',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ArchiveIcon color={filters.include_archived ? 'warning' : 'action'} />
          <Typography>
            {filters.include_archived ? 'Архив' : 'Активные задачи'}
          </Typography>
        </Box>
        <Switch
          checked={!!filters.include_archived}
          onChange={handleArchiveToggle}
          color="warning"
        />
      </Box>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FilterIcon />
            <Typography>Фильтры</Typography>
            {hasActiveFilters && (
              <Chip label="Активны" size="small" color="primary" />
            )}
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Date range filter */}
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Период
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <DatePicker
                  label="С"
                  value={dateFromValue}
                  onChange={(newValue) => {
                    if (newValue) {
                      const date = new Date(newValue);
                      date.setHours(0, 0, 0, 0);
                      handleDateFromChange(date.toISOString());
                    } else {
                      handleDateFromChange('');
                    }
                  }}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      size: 'small',
                    },
                  }}
                />
                <DatePicker
                  label="До"
                  value={dateToValue}
                  onChange={(newValue) => {
                    if (newValue) {
                      const date = new Date(newValue);
                      date.setHours(23, 59, 59, 999);
                      handleDateToChange(date.toISOString());
                    } else {
                      handleDateToChange('');
                    }
                  }}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      size: 'small',
                    },
                  }}
                />
              </Box>
            </Box>

            {/* Status filter */}
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Статус
              </Typography>
              <FormGroup>
                {statusOptions.map((option) => (
                  <FormControlLabel
                    key={option.value}
                    control={
                      <Checkbox
                        checked={isStatusChecked(option.value)}
                        onChange={() => handleStatusChange(option.value)}
                      />
                    }
                    label={option.label}
                  />
                ))}
              </FormGroup>
            </Box>

            {/* Priority filter */}
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Приоритет
              </Typography>
              <FormGroup>
                {priorityOptions.map((option) => (
                  <FormControlLabel
                    key={option.value}
                    control={
                      <Checkbox
                        checked={isPriorityChecked(option.value)}
                        onChange={() => handlePriorityChange(option.value)}
                      />
                    }
                    label={option.label}
                  />
                ))}
              </FormGroup>
            </Box>

            {/* Tags filter */}
            {tags.length > 0 && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Теги
                </Typography>
                <FormGroup>
                  {tags.map((tag) => (
                    <FormControlLabel
                      key={tag.id}
                      control={
                        <Checkbox
                          checked={isTagChecked(tag.id)}
                          onChange={() => handleTagChange(tag.id)}
                        />
                      }
                      label={
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
                      }
                    />
                  ))}
                </FormGroup>
              </Box>
            )}

            {/* Clear filters button */}
            {hasActiveFilters && (
              <Button variant="outlined" onClick={handleClearFilters} size="small">
                Сбросить фильтры
              </Button>
            )}
          </Box>
        </AccordionDetails>
      </Accordion>
    </LocalizationProvider>
  );
}


