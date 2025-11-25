// Tags Page - Manage tags
import { Container, Typography } from '@mui/material';

export default function TagsPage() {
  return (
    <Container maxWidth="md" sx={{ mt: 3, mb: 10 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Теги
      </Typography>
      <Typography color="text.secondary">
        Управление вашими тегами для организации задач
      </Typography>
    </Container>
  );
}

