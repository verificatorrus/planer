// Dashboard Page
import { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Fab,
  Alert,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import { Add as AddIcon, CalendarMonth, ViewDay, ViewWeek } from '@mui/icons-material';
import { format, startOfToday, startOfWeek, startOfMonth } from 'date-fns';

export default function Dashboard() {
  const [view, setView] = useState<'day' | 'week' | 'month'>('day');
  const today = startOfToday();

  return (
    <Container maxWidth="lg" sx={{ mt: 3, mb: 10 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Мои задачи
        </Typography>
        
        <ToggleButtonGroup
          value={view}
          exclusive
          onChange={(_, newView) => newView && setView(newView)}
          size="small"
        >
          <ToggleButton value="day">
            <ViewDay sx={{ mr: 0.5 }} /> День
          </ToggleButton>
          <ToggleButton value="week">
            <ViewWeek sx={{ mr: 0.5 }} /> Неделя
          </ToggleButton>
          <ToggleButton value="month">
            <CalendarMonth sx={{ mr: 0.5 }} /> Месяц
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <Typography variant="h6" color="text.secondary" gutterBottom>
        {view === 'day' && format(today, 'EEEE, d MMMM yyyy')}
        {view === 'week' && `Неделя с ${format(startOfWeek(today, { weekStartsOn: 1 }), 'd MMM')}`}
        {view === 'month' && format(startOfMonth(today), 'LLLL yyyy')}
      </Typography>

      <Alert severity="info" sx={{ mt: 3 }}>
        Здесь будут отображаться ваши задачи. Нажмите + чтобы создать первую задачу!
      </Alert>

      {/* FAB для быстрого добавления задачи */}
      <Fab
        color="primary"
        aria-label="add task"
        sx={{
          position: 'fixed',
          bottom: { xs: 72, md: 16 },
          right: 16,
        }}
        onClick={() => {
          // TODO: Open task creation dialog
          console.log('Create task');
        }}
      >
        <AddIcon />
      </Fab>
    </Container>
  );
}

