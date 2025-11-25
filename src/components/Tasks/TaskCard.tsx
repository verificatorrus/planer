// Task card component
import { useState } from 'react';
import type { ReactElement } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
} from '@mui/material';
import {
  MoreVert as MoreIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ContentCopy as CopyIcon,
  CheckCircle as DoneIcon,
  PlayArrow as InProgressIcon,
  Cancel as CancelIcon,
  Circle as PlannedIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import type { TaskWithTags, TaskStatus, TaskPriority } from '../../../worker/db-types';

interface TaskCardProps {
  task: TaskWithTags;
  onEdit: (task: TaskWithTags) => void;
  onDelete: (taskId: number) => void;
  onDuplicate: (taskId: number) => void;
  onStatusChange: (taskId: number, status: TaskStatus) => void;
  onClick?: (task: TaskWithTags) => void;
}

const priorityColors: Record<TaskPriority, string> = {
  low: '#4caf50',
  medium: '#ff9800',
  high: '#f44336',
  critical: '#9c27b0',
};

const priorityLabels: Record<TaskPriority, string> = {
  low: 'Низкий',
  medium: 'Средний',
  high: 'Высокий',
  critical: 'Критический',
};

const statusIcons: Record<TaskStatus, ReactElement> = {
  planned: <PlannedIcon fontSize="small" />,
  in_progress: <InProgressIcon fontSize="small" />,
  done: <DoneIcon fontSize="small" />,
  skipped: <CancelIcon fontSize="small" />,
  canceled: <CancelIcon fontSize="small" />,
};

const statusLabels: Record<TaskStatus, string> = {
  planned: 'Запланировано',
  in_progress: 'В процессе',
  done: 'Выполнено',
  skipped: 'Пропущено',
  canceled: 'Отменено',
};

const statusColors: Record<TaskStatus, string> = {
  planned: '#2196f3',
  in_progress: '#ff9800',
  done: '#4caf50',
  skipped: '#757575',
  canceled: '#f44336',
};

export default function TaskCard({
  task,
  onEdit,
  onDelete,
  onDuplicate,
  onStatusChange,
  onClick,
}: TaskCardProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleMenuClose();
    onEdit(task);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleMenuClose();
    if (confirm('Вы уверены, что хотите удалить эту задачу?')) {
      onDelete(task.id);
    }
  };

  const handleDuplicate = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleMenuClose();
    onDuplicate(task.id);
  };

  const handleCardClick = () => {
    if (onClick) {
      onClick(task);
    }
  };

  const isOverdue = task.deadline_datetime && new Date(task.deadline_datetime) < new Date() && task.status !== 'done';

  return (
    <Card
      sx={{
        cursor: onClick ? 'pointer' : 'default',
        borderLeft: `4px solid ${priorityColors[task.priority]}`,
        opacity: task.status === 'done' || task.status === 'canceled' ? 0.7 : 1,
        '&:hover': {
          boxShadow: 3,
        },
      }}
      onClick={handleCardClick}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="h6"
              component="h3"
              sx={{
                textDecoration: task.status === 'done' ? 'line-through' : 'none',
                mb: 0.5,
              }}
            >
              {task.title}
            </Typography>
            {task.description && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {task.description}
              </Typography>
            )}
          </Box>
          <IconButton size="small" onClick={handleMenuOpen}>
            <MoreIcon />
          </IconButton>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexWrap: 'wrap' }}>
          <Chip
            icon={statusIcons[task.status]}
            label={statusLabels[task.status]}
            size="small"
            sx={{
              backgroundColor: statusColors[task.status],
              color: '#fff',
            }}
          />
          <Tooltip title={`Приоритет: ${priorityLabels[task.priority]}`}>
            <Chip
              label={priorityLabels[task.priority]}
              size="small"
              sx={{
                backgroundColor: priorityColors[task.priority],
                color: '#fff',
              }}
            />
          </Tooltip>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, mb: 1, flexWrap: 'wrap' }}>
          <Typography variant="caption" color="text.secondary">
            📅 {format(new Date(task.start_datetime), 'dd MMM yyyy, HH:mm', { locale: ru })}
          </Typography>
          {task.deadline_datetime && (
            <Typography
              variant="caption"
              color={isOverdue ? 'error' : 'text.secondary'}
              sx={{ fontWeight: isOverdue ? 'bold' : 'normal' }}
            >
              ⏰ {format(new Date(task.deadline_datetime), 'dd MMM yyyy, HH:mm', { locale: ru })}
              {isOverdue && ' (просрочено)'}
            </Typography>
          )}
        </Box>

        {task.tags.length > 0 && (
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {task.tags.map((tag) => (
              <Chip
                key={tag.id}
                label={tag.name}
                size="small"
                sx={{
                  backgroundColor: tag.color,
                  color: '#fff',
                  fontSize: '0.75rem',
                }}
              />
            ))}
          </Box>
        )}
      </CardContent>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={handleEdit}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Редактировать</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDuplicate}>
          <ListItemIcon>
            <CopyIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Дублировать</ListItemText>
        </MenuItem>
        {task.status !== 'done' && (
          <MenuItem onClick={(e) => { e.stopPropagation(); handleMenuClose(); onStatusChange(task.id, 'done'); }}>
            <ListItemIcon>
              <DoneIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Отметить выполненным</ListItemText>
          </MenuItem>
        )}
        {task.status === 'planned' && (
          <MenuItem onClick={(e) => { e.stopPropagation(); handleMenuClose(); onStatusChange(task.id, 'in_progress'); }}>
            <ListItemIcon>
              <InProgressIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Начать выполнение</ListItemText>
          </MenuItem>
        )}
        <MenuItem onClick={handleDelete}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Удалить</ListItemText>
        </MenuItem>
      </Menu>
    </Card>
  );
}

