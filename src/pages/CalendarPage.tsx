// Calendar Page
import { Container, Typography } from '@mui/material';

export default function CalendarPage() {
  return (
    <Container maxWidth="xl" sx={{ mt: 3, mb: 10 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Календарь
      </Typography>
      <Typography color="text.secondary">
        Календарный вид задач с возможностью перетаскивания
      </Typography>
    </Container>
  );
}

