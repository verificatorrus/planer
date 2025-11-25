// Settings Page
import { Container, Typography } from '@mui/material';

export default function SettingsPage() {
  return (
    <Container maxWidth="md" sx={{ mt: 3, mb: 10 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Настройки
      </Typography>
      <Typography color="text.secondary">
        Настройки приложения и вашего профиля
      </Typography>
    </Container>
  );
}

