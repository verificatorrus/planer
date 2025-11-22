import { useState } from 'react'
import {
  Box,
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
  Avatar,
  Badge,
  BottomNavigation,
  BottomNavigationAction,
  Container,
  useMediaQuery,
  ThemeProvider,
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
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { useAuth } from './context/AuthContext'
import { useThemeMode } from './hooks/useThemeMode'
import './App.css'

function AppContent() {
  const { user, logout } = useAuth()
  const { theme, themeMode, activeMode, toggleTheme } = useThemeMode()
  
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [bottomNavValue, setBottomNavValue] = useState(0)

  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const toggleDrawer = (open: boolean) => () => {
    setDrawerOpen(open)
  }

  const handleLogout = async () => {
    await logout()
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
        <ListItem>
          <ListItemButton onClick={handleLogout}>
            <ListItemIcon>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText 
              primary="Выйти"
              secondary={user?.email}
            />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  )

  return (
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
            Planer
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
          
          <Tooltip title={user?.email || 'User'}>
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
                {user?.email?.[0]?.toUpperCase() || 'U'}
              </Avatar>
            </Badge>
          </Tooltip>
          
          {!isMobile && (
            <Tooltip title="Выйти">
              <IconButton color="inherit" onClick={handleLogout} sx={{ ml: 1 }}>
                <LogoutIcon />
              </IconButton>
            </Tooltip>
          )}
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
          Добро пожаловать в Planer
        </Typography>
      </Container>

      {/* Bottom Navigation - только для mobile */}
      {isMobile && (
        <Box sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000 }}>
          <BottomNavigation
            showLabels
            value={bottomNavValue}
            onChange={(_event, newValue) => {
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
  )
}

function App() {
  const { theme } = useThemeMode()
  
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <ProtectedRoute>
          <AppContent />
        </ProtectedRoute>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
