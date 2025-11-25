import { useState } from 'react'
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom'
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
  useMediaQuery,
  ThemeProvider,
  CssBaseline,
  Divider,
  Tooltip,
} from '@mui/material'
import {
  Menu as MenuIcon,
  Home as HomeIcon,
  CheckCircle as TasksIcon,
  CalendarMonth as CalendarIcon,
  Label as TagsIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { useAuth } from './context/AuthContext'
import { useThemeMode } from './hooks/useThemeMode'
import Dashboard from './pages/Dashboard'
import TasksPage from './pages/TasksPage'
import TaskDetailPage from './pages/TaskDetailPage'
import CalendarPage from './pages/CalendarPage'
import TagsPage from './pages/TagsPage'
import SettingsPage from './pages/SettingsPage'
import './App.css'

function AppContent() {
  const { user, logout } = useAuth()
  const { theme, themeMode, activeMode, toggleTheme } = useThemeMode()
  const navigate = useNavigate()
  const location = useLocation()
  
  const [drawerOpen, setDrawerOpen] = useState(false)

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

  // Navigation items
  const navItems = [
    { text: 'Главная', icon: <HomeIcon />, path: '/' },
    { text: 'Все задачи', icon: <TasksIcon />, path: '/tasks' },
    { text: 'Календарь', icon: <CalendarIcon />, path: '/calendar' },
    { text: 'Теги', icon: <TagsIcon />, path: '/tags' },
  ]

  const handleNavigation = (path: string) => {
    navigate(path)
    setDrawerOpen(false)
  }

  // Get bottom nav value from current path
  const getBottomNavValue = () => {
    const path = location.pathname
    if (path === '/') return 0
    if (path === '/tasks') return 1
    if (path === '/calendar') return 2
    if (path === '/tags') return 3
    return 0
  }

  const drawerList = (
    <Box sx={{ width: 280 }} role="presentation">
      <Box sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.main', color: 'white' }}>
        <Typography variant="h6">Planer</Typography>
        <Typography variant="caption">{user?.email}</Typography>
      </Box>
      <List>
        {navItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton 
              selected={location.pathname === item.path}
              onClick={() => handleNavigation(item.path)}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
        <ListItem disablePadding>
          <ListItemButton onClick={() => handleNavigation('/settings')}>
            <ListItemIcon><SettingsIcon /></ListItemIcon>
            <ListItemText primary="Настройки" />
          </ListItemButton>
        </ListItem>
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
            <Box sx={{ display: 'flex', gap: 1, flexGrow: 1 }}>
              {navItems.map((item) => (
                <Button 
                  key={item.path}
                  color="inherit" 
                  startIcon={item.icon}
                  onClick={() => handleNavigation(item.path)}
                  sx={{ 
                    bgcolor: location.pathname === item.path ? 'rgba(255,255,255,0.15)' : 'transparent' 
                  }}
                >
                  {item.text}
                </Button>
              ))}
              <Button 
                color="inherit" 
                startIcon={<SettingsIcon />}
                onClick={() => handleNavigation('/settings')}
                sx={{ 
                  bgcolor: location.pathname === '/settings' ? 'rgba(255,255,255,0.15)' : 'transparent' 
                }}
              >
                Настройки
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
            <Badge badgeContent={0} color="error">
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
              <Avatar alt="User Avatar" sx={{ bgcolor: 'secondary.main' }}>
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

      {/* Routes */}
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/tasks" element={<TasksPage />} />
        <Route path="/tasks/:id" element={<TaskDetailPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/tags" element={<TagsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>

      {/* Bottom Navigation - только для mobile */}
      {isMobile && (
        <Box sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000 }}>
          <BottomNavigation
            showLabels
            value={getBottomNavValue()}
            onChange={(_event, newValue) => {
              const paths = ['/', '/tasks', '/calendar', '/tags']
              if (paths[newValue]) {
                handleNavigation(paths[newValue])
              }
            }}
          >
            <BottomNavigationAction label="Главная" icon={<HomeIcon />} />
            <BottomNavigationAction label="Задачи" icon={<TasksIcon />} />
            <BottomNavigationAction label="Календарь" icon={<CalendarIcon />} />
            <BottomNavigationAction label="Теги" icon={<TagsIcon />} />
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
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </ProtectedRoute>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
