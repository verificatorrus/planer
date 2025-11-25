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
} from '@mui/material';
import { ExpandMore as ExpandMoreIcon, FilterList as FilterIcon } from '@mui/icons-material';
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

  const hasActiveFilters = !!(
    filters.status ||
    filters.priority ||
    (filters.tag_ids && filters.tag_ids.length > 0)
  );

  return (
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
  );
}

