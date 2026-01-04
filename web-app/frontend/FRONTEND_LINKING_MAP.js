/**
 * COGNIVUSLABS FRONTEND - COMPLETE LINKING STRUCTURE
 * ====================================================
 * 
 * This document maps the complete frontend architecture without backend dependency.
 * All components are connected and use mock data for frontend-only testing.
 */

// ============================================================================
// ROUTING STRUCTURE (App.jsx)
// ============================================================================

/*
  ROOT PATH: /
    ├── DOCTOR ROUTES
    │   ├── /doctor/login (DoctorLogin.jsx)
    │   │   └── LoginLayout + DoctorLogin Form
    │   │       └── Navigate to /doctor/dashboard on success
    │   │
    │   └── /doctor/dashboard (DoctorDashboard.jsx) [ProtectedRoute]
    │       ├── TopBar (userName from auth context)
    │       ├── Sidebar (navigation + logout)
    │       └── Main Content
    │           ├── StatsSection
    │           │   └── 4x StatCard components
    │           ├── AlertsPanel (alerts from state)
    │           ├── ActivityFeed (activity from state)
    │           ├── TasksPanel (tasks from state)
    │           └── VitalsTrends (charts)
    │
    ├── STAFF ROUTES
    │   ├── /staff/login (StaffLogin.jsx)
    │   │   └── LoginLayout + StaffLogin Form
    │   │       └── Navigate to /staff/dashboard on success
    │   │
    │   └── /staff/dashboard (StaffDashboard.jsx) [ProtectedRoute]
    │       ├── TopBar
    │       ├── Sidebar
    │       └── Main Content (staff-specific dashboard)
    │
    └── FALLBACK: * → /doctor/login
*/

// ============================================================================
// FILE STRUCTURE & LINKING
// ============================================================================

/*
frontend/src/
├── App.jsx (MAIN ROUTER)
│   └── Routes all pages with ProtectedRoute wrapper
│
├── pages/
│   ├── DoctorLogin.jsx
│   │   ├── imports: LoginLayout, authService, useNavigate
│   │   └── handles doctor authentication
│   │
│   ├── DoctorDashboard.jsx
│   │   ├── imports: useState, useEffect, useNavigate, authService
│   │   ├── imports: TopBar, Sidebar
│   │   ├── imports: StatsSection, AlertsPanel, ActivityFeed, TasksPanel, VitalsTrends
│   │   ├── state: [patients, alerts, activity, tasks] (mock data)
│   │   └── renders: Main dashboard layout with all components
│   │
│   ├── StaffLogin.jsx
│   │   ├── imports: LoginLayout, authService, useNavigate
│   │   └── handles staff authentication
│   │
│   └── StaffDashboard.jsx
│       ├── imports: same as DoctorDashboard
│       └── renders: Staff-specific dashboard
│
├── components/
│   ├── TopBar.jsx
│   │   └── Shows logo, search, user profile (userName from props)
│   │
│   ├── Sidebar.jsx
│   │   ├── Navigation links to pages
│   │   ├── Active route highlight
│   │   └── Logout button (calls onLogout handler)
│   │
│   ├── LoginLayout.jsx
│   │   └── Branding + auth form layout (left side design, right side form)
│   │
│   ├── ProtectedRoute.jsx
│   │   ├── Checks authentication token
│   │   ├── Validates user role
│   │   ├── In DEV: auto-logs in preview user
│   │   └── Redirects unauthorized users to login
│   │
│   └── dashboard/
│       ├── StatCard.jsx
│       │   └── Single KPI card with icon, label, value, sub
│       │
│       ├── StatsSection.jsx
│       │   └── Grid of 4 StatCards with fixed data
│       │
│       ├── AlertsPanel.jsx
│       │   └── Table of alerts from props (alerts array)
│       │
│       ├── ActivityFeed.jsx
│       │   └── List of recent activities from props (items array)
│       │
│       ├── TasksPanel.jsx
│       │   └── List of tasks from props (tasks array)
│       │
│       ├── VitalsTrends.jsx
│       │   ├── MiniBarChart component
│       │   ├── Heart Rate chart
│       │   ├── Blood Pressure chart
│       │   └── Time labels (00:00, 12:00, 20:00)
│       │
│       └── index.js (barrel exports)
│
├── services/
│   └── api.js
│       ├── Axios instance with API_BASE_URL
│       ├── Request interceptor: adds Bearer token
│       ├── Response interceptor: handles 401 errors
│       └── authService object with methods:
│           ├── loginDoctor(credentials)
│           ├── loginStaff(credentials)
│           ├── logout()
│           ├── getCurrentUser()
│           ├── isAuthenticated()
│           └── getUserRole()
│
└── main.jsx
    └── ReactDOM.createRoot(App)
*/

// ============================================================================
// DATA FLOW
// ============================================================================

/*
AUTHENTICATION FLOW:
  1. User opens browser → /doctor/login
  2. DoctorLogin form filled with credentials
  3. authService.loginDoctor() called (API or mock)
  4. Token stored in localStorage
  5. Navigate to /doctor/dashboard
  6. ProtectedRoute validates token
  7. DoctorDashboard renders with TopBar showing user name

DASHBOARD DATA FLOW:
  1. DoctorDashboard component loads
  2. useState initializes: patients, alerts, activity, tasks (mock data)
  3. useEffect fetches current user from localStorage
  4. Components receive data as props:
     - StatsSection: static data, no props needed
     - AlertsPanel: receives alerts prop
     - ActivityFeed: receives activity prop
     - TasksPanel: receives tasks prop
     - VitalsTrends: static data, no props needed

LOGOUT FLOW:
  1. User clicks Logout button in Sidebar
  2. handleLogout() called in DoctorDashboard
  3. authService.logout() clears localStorage
  4. navigate('/doctor/login') redirects to login page

ROLE-BASED ROUTING:
  1. Doctor can access /doctor/dashboard
  2. Staff can access /staff/dashboard
  3. ProtectedRoute checks user_role in localStorage
  4. Mismatched roles redirect to correct login page
*/

// ============================================================================
// MOCK DATA STRUCTURE
// ============================================================================

/*
PATIENTS (in DoctorDashboard):
  [
    { name: 'Wathsala Dewmina', room: 'Room No. 302A', condition: 'Low O2', severity: 'low', time: '2 sec ago' },
    { name: 'Wooshan Gamage', room: 'Room No. 108C', condition: 'High HR', severity: 'high', time: '1 mins ago' },
    ...
  ]

ALERTS (derived from patients):
  [
    { patient: 'Wathsala Dewmina', room: 'Room No. 302A', condition: 'Low O2', severity: 'low', time: '2 sec ago' },
    ...
  ]

ACTIVITY:
  [
    { title: 'Prescription approved for Emma Davis', author: 'Dr. Sarah Smith', time: '15 mins ago' },
    { title: 'Vitals updated for Wooshan - BP: 120/80', author: 'Nurse Teneesha', time: 'Today at 2:30 PM' },
    { title: 'New patient admitted - Room 405B', author: 'Staff Garcia', time: 'Oct 29, 2025 - 10:45 AM' },
  ]

TASKS:
  [
    { title: 'Review lab results - Michael Chen', when: 'HIGH Due in 30 mins', priority: 'HIGH' },
    { title: 'Schedule follow-up - Emma Davis', when: 'MEDIUM Due in 2 hours', priority: 'MEDIUM' },
    { title: 'Update treatment plan - James W.', when: 'LOW Due in 4 hours', priority: 'LOW' },
  ]

VITALS TRENDS:
  - Heart Rate: [20,30,25,28,35,22,40,38,42,45,30,28,25,35,48,50,46] (bpm)
  - Blood Pressure: [40,38,36,34,33,32,30,31,32,33,35,36,38,40,39,37,35] (mmHg)
*/

// ============================================================================
// COMPONENT PROP SIGNATURES
// ============================================================================

/*
StatCard
  Props: { icon, label, value, sub }
  Example: <StatCard icon={Activity} label="Active Patients" value={249} sub="+12 From This Week" />

StatsSection
  Props: none (uses static data internally)
  Renders: 4 StatCards in grid

AlertsPanel
  Props: { alerts: Array }
  Renders: Table with columns: Patient, Room, Condition, Severity, Time

ActivityFeed
  Props: { items: Array }
  Renders: List of activity items

TasksPanel
  Props: { tasks: Array }
  Renders: List of tasks with priority badges

VitalsTrends
  Props: none (uses static data internally)
  Renders: Two bar charts (Heart Rate, Blood Pressure)

TopBar
  Props: { userName: string }
  Renders: Logo, search bar, profile with user name

Sidebar
  Props: { onLogout: function }
  Renders: Navigation menu, logout button

LoginLayout
  Props: { children: ReactNode, userType: string }
  Renders: Two-column layout with branding and form slot

ProtectedRoute
  Props: { children: ReactNode, role: string }
  Renders: children if authenticated, otherwise redirects to login
*/

// ============================================================================
// STYLING APPROACH
// ============================================================================

/*
Tailwind CSS with dark theme:
  - Background: slate-950, slate-900, slate-800
  - Text: slate-200, slate-300, slate-400
  - Accents: sky-400, sky-500 (primary), red-500 (danger), amber-400 (warning), emerald-500 (success)
  
Responsive Design:
  - Mobile-first approach
  - Grid columns: grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4
  
Interactive Elements:
  - Hover effects: hover:bg-slate-700/60, hover:border-slate-600
  - Transitions: transition-all, transition-colors
  - Rounded corners: rounded-xl (cards), rounded-lg (inputs), rounded-full (badges)
*/

// ============================================================================
// INITIALIZATION CHECKLIST
// ============================================================================

/*
✅ App.jsx - Main router with all routes configured
✅ DoctorLogin.jsx - Doctor login page with form
✅ DoctorDashboard.jsx - Main dashboard with all components
✅ StaffLogin.jsx - Staff login page with form
✅ StaffDashboard.jsx - Staff dashboard (can be customized)
✅ TopBar.jsx - Navigation header with user profile
✅ Sidebar.jsx - Side navigation menu
✅ LoginLayout.jsx - Login page layout with branding
✅ ProtectedRoute.jsx - Route protection with auth check
✅ StatCard.jsx - KPI card component
✅ StatsSection.jsx - Stats grid container
✅ AlertsPanel.jsx - Alerts table component
✅ ActivityFeed.jsx - Activity list component
✅ TasksPanel.jsx - Tasks list component
✅ VitalsTrends.jsx - Vitals charts component
✅ api.js - Axios instance with auth interceptors
✅ vite.config.js - Frontend server config with API proxy

FRONTEND READY: npm run dev → http://localhost:3000
*/

export default "FRONTEND LINKING COMPLETE - All components connected and working"
