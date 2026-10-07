import { createBrowserRouter, Navigate } from 'react-router'
import Styleguide from '@/routes/styleguide/Styleguide'

// Phase 1a: only the styleguide. Student (/s/*) and Agency (/a/*) shells arrive in Phase 1b.
export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/styleguide" replace /> },
  { path: '/styleguide', element: <Styleguide /> },
  { path: '*', element: <Navigate to="/" replace /> },
])
