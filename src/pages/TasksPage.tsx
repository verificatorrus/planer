// Tasks Page - All tasks view
import { Container, Typography } from '@mui/material';

export default function TasksPage() {
  return (
    <Container maxWidth="lg" sx={{ mt: 3, mb: 10 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Все задачи
      </Typography>
      <Typography color="text.secondary">
        Список всех ваших задач с фильтрацией и поиском
      </Typography>
    </Container>
  );
}

