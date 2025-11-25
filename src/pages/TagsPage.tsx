// Tags Page - Manage tags
import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Fab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Alert,
  Paper,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Label as LabelIcon,
} from '@mui/icons-material';
import { tagApi } from '../services/tagService';
import type { Tag, TagCreateInput, TagUpdateInput } from '../../worker/db-types';

const defaultColors = [
  '#f44336', '#e91e63', '#9c27b0', '#673ab7',
  '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4',
  '#009688', '#4caf50', '#8bc34a', '#cddc39',
  '#ffeb3b', '#ffc107', '#ff9800', '#ff5722',
];

export default function TagsPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [tagName, setTagName] = useState('');
  const [tagColor, setTagColor] = useState(defaultColors[0]);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const loadedTags = await tagApi.getTags();
      setTags(loadedTags);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tags');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTag = () => {
    setEditingTag(null);
    setTagName('');
    setTagColor(defaultColors[0]);
    setSaveError(null);
    setDialogOpen(true);
  };

  const handleEditTag = (tag: Tag) => {
    setEditingTag(tag);
    setTagName(tag.name);
    setTagColor(tag.color);
    setSaveError(null);
    setDialogOpen(true);
  };

  const handleSaveTag = async () => {
    if (!tagName.trim()) {
      setSaveError('Название тега обязательно');
      return;
    }

    try {
      const data: TagCreateInput | TagUpdateInput = {
        name: tagName.trim(),
        color: tagColor,
      };

      if (editingTag) {
        await tagApi.updateTag(editingTag.id, data as TagUpdateInput);
      } else {
        await tagApi.createTag(data as TagCreateInput);
      }

      await loadTags();
      setDialogOpen(false);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save tag');
    }
  };

  const handleDeleteTag = async (tagId: number) => {
    if (!confirm('Вы уверены, что хотите удалить этот тег? Он будет удален из всех задач.')) {
      return;
    }

    try {
      await tagApi.deleteTag(tagId);
      await loadTags();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete tag');
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 3, mb: 10 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Теги
      </Typography>
      <Typography color="text.secondary" gutterBottom>
        Управление вашими тегами для организации задач
      </Typography>

      {error && (
        <Alert severity="error" sx={{ my: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Typography color="text.secondary" sx={{ mt: 3 }}>
          Загрузка...
        </Typography>
      ) : tags.length === 0 ? (
        <Paper sx={{ p: 3, mt: 3, textAlign: 'center' }}>
          <Typography color="text.secondary">
            У вас пока нет тегов. Создайте первый тег, чтобы организовать ваши задачи!
          </Typography>
        </Paper>
      ) : (
        <List sx={{ mt: 2 }}>
          {tags.map((tag) => (
            <ListItem
              key={tag.id}
              sx={{
                border: 1,
                borderColor: 'divider',
                borderRadius: 1,
                mb: 1,
              }}
              secondaryAction={
                <Box>
                  <IconButton edge="end" onClick={() => handleEditTag(tag)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton edge="end" onClick={() => handleDeleteTag(tag.id)}>
                    <DeleteIcon />
                  </IconButton>
                </Box>
              }
            >
              <ListItemIcon>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    backgroundColor: tag.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <LabelIcon sx={{ color: '#fff' }} />
                </Box>
              </ListItemIcon>
              <ListItemText
                primary={tag.name}
                secondary={tag.color}
              />
            </ListItem>
          ))}
        </List>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{editingTag ? 'Редактировать тег' : 'Создать тег'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            {saveError && <Alert severity="error">{saveError}</Alert>}

            <TextField
              label="Название"
              value={tagName}
              onChange={(e) => setTagName(e.target.value)}
              fullWidth
              required
              autoFocus
            />

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Цвет
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {defaultColors.map((color) => (
                  <Box
                    key={color}
                    onClick={() => setTagColor(color)}
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      backgroundColor: color,
                      cursor: 'pointer',
                      border: tagColor === color ? 3 : 0,
                      borderColor: 'primary.main',
                      '&:hover': {
                        opacity: 0.8,
                      },
                    }}
                  />
                ))}
              </Box>
              <TextField
                label="Или введите свой цвет"
                value={tagColor}
                onChange={(e) => setTagColor(e.target.value)}
                fullWidth
                size="small"
                sx={{ mt: 2 }}
                placeholder="#000000"
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Отмена</Button>
          <Button onClick={handleSaveTag} variant="contained">
            Сохранить
          </Button>
        </DialogActions>
      </Dialog>

      <Fab
        color="primary"
        aria-label="add tag"
        sx={{
          position: 'fixed',
          bottom: { xs: 72, md: 16 },
          right: 16,
        }}
        onClick={handleCreateTag}
      >
        <AddIcon />
      </Fab>
    </Container>
  );
}

