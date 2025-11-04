import { useState, useEffect, useMemo } from 'react'
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Button,
  Typography,
  AppBar,
  Toolbar,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Modal,
  Avatar,
  Badge,
  BottomNavigation,
  BottomNavigationAction,
  Container,
  Grid,
  Fab,
  useMediaQuery,
  ThemeProvider,
  createTheme,
  CssBaseline,
  Divider,
  Tooltip,
} from '@mui/material'
import {
  Menu as MenuIcon,
  Home as HomeIcon,
  Favorite as FavoriteIcon,
  LocationOn as LocationIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
  Mail as MailIcon,
  Notifications as NotificationsIcon,
  Add as AddIcon,
  Dashboard as DashboardIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
} from '@mui/icons-material'
import './App.css'

function App() {
  // Определяем системные предпочтения темы
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)')
  
  // Состояние для режима темы: 'light', 'dark', или 'system'
  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'system'>(() => {
    const savedMode = localStorage.getItem('themeMode')
    return (savedMode as 'light' | 'dark' | 'system') || 'system'
  })
  
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [bottomNavValue, setBottomNavValue] = useState(0)

  // Определяем какую тему использовать
  const activeMode = themeMode === 'system' 
    ? (prefersDarkMode ? 'dark' : 'light')
    : themeMode

  // Создаем тему
  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: activeMode,
          primary: {
            main: '#1976d2',
          },
          secondary: {
            main: '#dc004e',
          },
        },
      }),
    [activeMode]
  )

  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  // Сохраняем выбор темы в localStorage
  useEffect(() => {
    localStorage.setItem('themeMode', themeMode)
  }, [themeMode])

  // Обновляем meta theme-color для браузера
  useEffect(() => {
    const metaThemeColor = document.querySelector('meta[name="theme-color"]')
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', activeMode === 'dark' ? '#121212' : '#1976d2')
    }
  }, [activeMode])

  const toggleDrawer = (open: boolean) => () => {
    setDrawerOpen(open)
  }

  const handleModalOpen = () => setModalOpen(true)
  const handleModalClose = () => setModalOpen(false)

  const toggleTheme = () => {
    setThemeMode((prev) => {
      if (prev === 'system') return 'light'
      if (prev === 'light') return 'dark'
      return 'system'
    })
  }

  const getThemeIcon = () => {
    if (themeMode === 'dark') return <DarkModeIcon />
    if (themeMode === 'light') return <LightModeIcon />
    return <SettingsIcon />
  }

  const getThemeLabel = () => {
    if (themeMode === 'dark') return 'Темная тема'
    if (themeMode === 'light') return 'Светлая тема'
    return 'Системная тема'
  }

  const drawerList = (
    <Box sx={{ width: 280 }} role="presentation">
      <Box sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.main', color: 'white' }}>
        <Typography variant="h6">Меню навигации</Typography>
      </Box>
      <List onClick={toggleDrawer(false)}>
        {['Главная', 'Профиль', 'Настройки', 'Сообщения'].map((text, index) => (
          <ListItem key={text} disablePadding>
            <ListItemButton>
              <ListItemIcon>
                {index === 0 && <HomeIcon />}
                {index === 1 && <PersonIcon />}
                {index === 2 && <SettingsIcon />}
                {index === 3 && <MailIcon />}
              </ListItemIcon>
              <ListItemText primary={text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      
      <Divider />
      
      <List>
        <ListItem>
          <ListItemButton onClick={(e) => {
            e.stopPropagation()
            toggleTheme()
          }}>
            <ListItemIcon>
              {getThemeIcon()}
            </ListItemIcon>
            <ListItemText 
              primary={getThemeLabel()}
              secondary={themeMode === 'system' ? 'Следует за системой' : ''}
            />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  )

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ pb: isMobile ? 7 : 0 }}>
        {/* AppBar с меню */}
        <AppBar position="sticky">
        <Toolbar>
          {isMobile && (
            <IconButton
              size="large"
              edge="start"
              color="inherit"
              aria-label="menu"
              sx={{ mr: 2 }}
              onClick={toggleDrawer(true)}
            >
              <MenuIcon />
            </IconButton>
          )}
          
          <Typography variant="h6" component="div" sx={{ flexGrow: isMobile ? 1 : 0, mr: isMobile ? 0 : 4 }}>
            MUI Demo
          </Typography>
          
          {/* Desktop навигация */}
          {!isMobile && (
            <Box sx={{ display: 'flex', gap: 2, flexGrow: 1 }}>
              <Button color="inherit" startIcon={<HomeIcon />}>
                Главная
              </Button>
              <Button color="inherit" startIcon={<FavoriteIcon />}>
                Избранное
              </Button>
              <Button color="inherit" startIcon={<LocationIcon />}>
                Места
              </Button>
              <Button color="inherit" startIcon={<PersonIcon />}>
                Профиль
              </Button>
            </Box>
          )}
          
          {/* Переключатель темы */}
          <Tooltip title={getThemeLabel()}>
            <IconButton color="inherit" onClick={toggleTheme} sx={{ mr: 1 }}>
              {activeMode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
          </Tooltip>

          {/* Avatar с Badge */}
          <IconButton color="inherit" sx={{ mr: 1 }}>
            <Badge badgeContent={4} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>
          
          <Badge
            overlap="circular"
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            badgeContent={
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  bgcolor: 'success.main',
                  border: '2px solid white',
                }}
              />
            }
          >
            <Avatar alt="User Avatar" src="/broken-image.jpg" sx={{ bgcolor: 'secondary.main' }}>
              U
            </Avatar>
          </Badge>
        </Toolbar>
      </AppBar>

      {/* Drawer (боковое меню) */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={toggleDrawer(false)}
      >
        {drawerList}
      </Drawer>

      {/* Основной контент */}
      <Container maxWidth={isMobile ? "sm" : "lg"} sx={{ mt: 3, mb: 2 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Демонстрация MUI компонентов
        </Typography>
        
        <Typography variant="body1" paragraph align="center" color="text.secondary">
          Mobile-first дизайн с основными компонентами Material-UI
        </Typography>

        {/* Информация о теме */}
        <Box sx={{ mb: 3, p: 2, bgcolor: 'primary.main', color: 'primary.contrastText', borderRadius: 2, textAlign: 'center' }}>
          <Typography variant="body1">
            🎨 Текущая тема: <strong>{getThemeLabel()}</strong>
            {themeMode === 'system' && ` (${activeMode === 'dark' ? 'темная' : 'светлая'} по системе)`}
          </Typography>
          <Typography variant="body2" sx={{ mt: 1, opacity: 0.9 }}>
            Переключайте тему через {isMobile ? 'меню слева' : 'иконку'} ☀️/🌙 в шапке
          </Typography>
        </Box>

        {/* Cards */}
        <Grid container spacing={2} sx={{ mt: 2 }}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardMedia
                component="div"
                sx={{
                  height: 140,
                  background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                }}
              />
              <CardContent>
                <Typography gutterBottom variant="h5" component="div">
                  Card компонент
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Это пример красивой карточки с градиентным фоном. Cards отлично подходят
                  для отображения контента на мобильных устройствах и адаптируются под desktop.
                </Typography>
              </CardContent>
              <CardActions>
                <Button size="small" color="primary">
                  Узнать больше
                </Button>
                <Button size="small" color="secondary">
                  Поделиться
                </Button>
              </CardActions>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                    <FavoriteIcon />
                  </Avatar>
                  <Typography variant="h6">
                    Card 2
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Компактная карточка с иконкой
                </Typography>
              </CardContent>
              <CardActions>
                <Button size="small" onClick={handleModalOpen}>
                  Открыть Modal
                </Button>
              </CardActions>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Badge badgeContent={12} color="error">
                    <Avatar sx={{ bgcolor: 'secondary.main', mr: 2 }}>
                      <MailIcon />
                    </Avatar>
                  </Badge>
                  <Typography variant="h6">
                    Card 3
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Avatar с Badge показывает уведомления
                </Typography>
              </CardContent>
              <CardActions>
                <Button size="small" onClick={isMobile ? toggleDrawer(true) : handleModalOpen}>
                  {isMobile ? 'Открыть Drawer' : 'Открыть Modal'}
                </Button>
              </CardActions>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Card sx={{ bgcolor: 'success.light' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  🎨 Цветная карточка
                </Typography>
                <Typography variant="body2">
                  Cards могут иметь различные цвета и стили для выделения важной информации.
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Card sx={{ bgcolor: 'warning.light' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'warning.dark', mr: 2 }}>
                    <DashboardIcon />
                  </Avatar>
                  <Typography variant="h6">
                    Card 4
                  </Typography>
                </Box>
                <Typography variant="body2">
                  Адаптивный layout: на mobile - одна колонка, на tablet - две, на desktop - три колонки
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Badge badgeContent="NEW" color="secondary">
                    <Avatar sx={{ bgcolor: 'info.main', mr: 2 }}>
                      <SettingsIcon />
                    </Avatar>
                  </Badge>
                  <Typography variant="h6">
                    Card 5
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Badge может показывать не только цифры, но и текст
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Card sx={{ bgcolor: 'info.light' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  📱 Responsive Design
                </Typography>
                <Typography variant="body2">
                  Mobile-first подход означает, что дизайн отлично работает на всех устройствах
                </Typography>
              </CardContent>
              <CardActions>
                <Button size="small">Действие</Button>
              </CardActions>
            </Card>
          </Grid>
        </Grid>

        {/* Демонстрация Avatar с различными Badge */}
        <Box sx={{ mt: 4, p: 2, bgcolor: 'background.paper', borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>
            Avatars с Badges
          </Typography>
          <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', mt: 2, justifyContent: 'center' }}>
            <Badge badgeContent={3} color="primary">
              <Avatar sx={{ bgcolor: 'primary.main' }}>A</Avatar>
            </Badge>
            <Badge badgeContent={99} color="error">
              <Avatar sx={{ bgcolor: 'error.main' }}>B</Avatar>
            </Badge>
            <Badge
              overlap="circular"
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              variant="dot"
              color="success"
            >
              <Avatar sx={{ bgcolor: 'info.main' }}>C</Avatar>
            </Badge>
            <Badge badgeContent={5} color="secondary">
              <Avatar sx={{ bgcolor: 'warning.main' }}>
                <PersonIcon />
              </Avatar>
            </Badge>
          </Box>
        </Box>
      </Container>

      {/* Modal */}
      <Modal
        open={modalOpen}
        onClose={handleModalClose}
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
      >
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: { xs: '90%', sm: 400 },
            bgcolor: 'background.paper',
            boxShadow: 24,
            borderRadius: 2,
            p: 4,
          }}
        >
          <Typography id="modal-title" variant="h6" component="h2" gutterBottom>
            Modal окно
          </Typography>
          <Typography id="modal-description" sx={{ mt: 2 }}>
            Это пример модального окна. Modal идеально подходит для отображения важной
            информации или форм, требующих внимания пользователя.
          </Typography>
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Button variant="outlined" onClick={handleModalClose}>
              Отмена
            </Button>
            <Button variant="contained" onClick={handleModalClose}>
              ОК
            </Button>
          </Box>
        </Box>
      </Modal>

      {/* Floating Action Button - только для mobile */}
      {isMobile && (
        <Fab
          color="primary"
          aria-label="add"
          sx={{
            position: 'fixed',
            bottom: 72,
            right: 16,
          }}
        >
          <AddIcon />
        </Fab>
      )}

      {/* Bottom Navigation - только для mobile */}
      {isMobile && (
        <Box sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000 }}>
          <BottomNavigation
            showLabels
            value={bottomNavValue}
            onChange={(event, newValue) => {
              setBottomNavValue(newValue)
            }}
          >
            <BottomNavigationAction label="Главная" icon={<HomeIcon />} />
            <BottomNavigationAction label="Избранное" icon={<FavoriteIcon />} />
            <BottomNavigationAction label="Места" icon={<LocationIcon />} />
            <BottomNavigationAction label="Профиль" icon={<PersonIcon />} />
          </BottomNavigation>
        </Box>
      )}
      </Box>
    </ThemeProvider>
  )
}

export default App
