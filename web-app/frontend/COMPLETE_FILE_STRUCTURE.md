# 📂 COMPLETE FRONTEND FILE STRUCTURE WITH LINKING

## Folder Tree

```
frontend/
│
├── 📄 package.json                 (npm dependencies: react, router, axios, tailwind, etc)
├── 📄 vite.config.js              (dev server on port 3000, API proxy to localhost:8000)
├── 📄 tailwind.config.js          (dark theme configuration)
├── 📄 postcss.config.js           (CSS processing)
├── 📄 index.html                  (root HTML with <div id="root">)
│
├── 📄 FRONTEND_LINKING_MAP.js      ⭐ COMPLETE LINKING DOCUMENTATION
├── 📄 FRONTEND_COMPLETE.md        ⭐ SETUP & FEATURE GUIDE
├── 📄 LINKING_DIAGRAM.md          ⭐ VISUAL ARCHITECTURE DIAGRAM
│
└── src/
    │
    ├── 📄 main.jsx                 (Entry point: ReactDOM.createRoot(App))
    │   └─ imports: App.jsx
    │
    ├── 📄 App.jsx                  ⭐ MAIN ROUTER (all routes defined here)
    │   └─ imports: DoctorLogin, DoctorDashboard, StaffLogin, StaffDashboard
    │   └─ uses: ProtectedRoute wrapper
    │   └─ routes:
    │       • / → /doctor/login (redirect)
    │       • /doctor/login → DoctorLogin
    │       • /doctor/dashboard → ProtectedRoute[doctor] → DoctorDashboard
    │       • /staff/login → StaffLogin
    │       • /staff/dashboard → ProtectedRoute[staff] → StaffDashboard
    │       • /* → /doctor/login (fallback)
    │
    ├── styles/
    │   └── 📄 index.css             (Tailwind directives + global styles)
    │
    ├── pages/
    │   │
    │   ├── 📄 DoctorLogin.jsx       (Doctor login form page)
    │   │   └─ imports: LoginLayout, authService, useNavigate, useState
    │   │   └─ calls: authService.loginDoctor(credentials)
    │   │   └─ redirects: navigate('/doctor/dashboard')
    │   │
    │   ├── 📄 DoctorDashboard.jsx   ⭐ MAIN DASHBOARD PAGE
    │   │   └─ imports:
    │   │      • useState, useEffect, useNavigate (React hooks)
    │   │      • authService (auth methods)
    │   │      • TopBar, Sidebar (layout components)
    │   │      • StatsSection, AlertsPanel, ActivityFeed, TasksPanel, VitalsTrends
    │   │
    │   │   └─ state:
    │   │      • [user] ← authService.getCurrentUser()
    │   │      • [patients] ← mock data (6 patients)
    │   │      • [alerts] ← derived from patients
    │   │      • [activity] ← mock data (3 activities)
    │   │      • [tasks] ← mock data (3 tasks)
    │   │
    │   │   └─ handlers:
    │   │      • handleLogout() ← calls authService.logout() + navigate('/doctor/login')
    │   │
    │   │   └─ JSX structure:
    │   │      <div>
    │   │        <TopBar userName={user?.full_name} />
    │   │        <Sidebar onLogout={handleLogout} />
    │   │        <main>
    │   │          <StatsSection />
    │   │          <AlertsPanel alerts={alerts} />
    │   │          <Grid>
    │   │            <ActivityFeed items={activity} />
    │   │            <TasksPanel tasks={tasks} />
    │   │            <VitalsTrends />
    │   │          </Grid>
    │   │        </main>
    │   │      </div>
    │   │
    │   ├── 📄 StaffLogin.jsx        (Staff login form page)
    │   │   └─ similar to DoctorLogin
    │   │   └─ calls: authService.loginStaff()
    │   │
    │   └── 📄 StaffDashboard.jsx    (Staff dashboard)
    │       └─ similar to DoctorDashboard (can be customized)
    │
    ├── components/
    │   │
    │   ├── 📄 TopBar.jsx            (Header with logo & user profile)
    │   │   └─ props: { userName }
    │   │   └─ JSX:
    │   │      <div>
    │   │        <Logo>COGNIVUSLABS</Logo>
    │   │        <SearchBar />
    │   │        <UserProfile userName={userName} />
    │   │      </div>
    │   │
    │   ├── 📄 Sidebar.jsx           (Navigation menu)
    │   │   └─ props: { onLogout }
    │   │   └─ imports: Link, useLocation (react-router)
    │   │   └─ JSX:
    │   │      <aside>
    │   │        <NavItem to="/doctor/dashboard">Dashboard</NavItem>
    │   │        <NavItem to="#">Patients</NavItem>
    │   │        <NavItem to="#">Prescriptions</NavItem>
    │   │        ...
    │   │        <button onClick={onLogout}>Logout</button>
    │   │      </aside>
    │   │
    │   ├── 📄 LoginLayout.jsx       (Login page layout template)
    │   │   └─ props: { children, userType }
    │   │   └─ JSX:
    │   │      <div>
    │   │        <LeftPanel branding={...} />
    │   │        <RightPanel children={children} />
    │   │      </div>
    │   │
    │   ├── 📄 ProtectedRoute.jsx    ⭐ ROUTE PROTECTION WRAPPER
    │   │   └─ props: { children, role }
    │   │   └─ logic:
    │   │      1. Check localStorage.access_token exists
    │   │      2. Check localStorage.user_role matches role
    │   │      3. In DEV: auto-login if token missing
    │   │      4. If fail: <Navigate to="/login" />
    │   │      5. If pass: render children
    │   │
    │   └── dashboard/
    │       │
    │       ├── 📄 StatCard.jsx      (Single KPI card)
    │       │   └─ props: { icon, label, value, sub }
    │       │   └─ JSX: <div icon={Icon} label={label} value={value} />
    │       │
    │       ├── 📄 StatsSection.jsx  (4 stat cards grid)
    │       │   └─ no props (static data)
    │       │   └─ JSX:
    │       │      <section>
    │       │        <StatCard icon={Activity} label="Active Patients" value={249} ... />
    │       │        <StatCard icon={Bell} label="Critical Alerts" value="3 Critical" ... />
    │       │        <StatCard icon={Stethoscope} label="Pending Prescriptions" value={5} ... />
    │       │        <StatCard icon={HeartPulse} label="Low Stock Items" value="3" ... />
    │       │      </section>
    │       │
    │       ├── 📄 AlertsPanel.jsx   (Alerts table)
    │       │   └─ props: { alerts } ← alerts array from DoctorDashboard
    │       │   └─ columns: Patient | Room | Condition | Severity | Time
    │       │   └─ features:
    │       │      • Color-coded severity (🔴 high, 🟡 medium, 🟢 low)
    │       │      • Hover effects
    │       │      • "View more" button
    │       │
    │       ├── 📄 ActivityFeed.jsx  (Activity list)
    │       │   └─ props: { items } ← activity array from DoctorDashboard
    │       │   └─ JSX:
    │       │      <div>
    │       │        {items.map(item => (
    │       │          <div title={item.title} author={item.author} time={item.time} />
    │       │        ))}
    │       │      </div>
    │       │
    │       ├── 📄 TasksPanel.jsx    (Tasks list)
    │       │   └─ props: { tasks } ← tasks array from DoctorDashboard
    │       │   └─ JSX:
    │       │      <div>
    │       │        {tasks.map(task => (
    │       │          <div title={task.title} when={task.when} priority={task.priority} />
    │       │        ))}
    │       │      </div>
    │       │
    │       ├── 📄 VitalsTrends.jsx  (Heart rate & BP charts)
    │       │   └─ no props (static data internally)
    │       │   └─ contains: MiniBarChart component
    │       │   └─ JSX:
    │       │      <div>
    │       │        <Chart title="Avg Heart Rate" values={[...]} max={60} />
    │       │        <Chart title="Avg Blood Pressure" values={[...]} max={60} />
    │       │      </div>
    │       │
    │       └── 📄 index.js         (Barrel export)
    │           └─ exports: StatCard, StatsSection, AlertsPanel, 
    │                        ActivityFeed, TasksPanel, VitalsTrends
    │           └─ allows: import { StatCard } from '../components/dashboard'
    │
    └── services/
        │
        └── 📄 api.js               ⭐ AUTHENTICATION & API SERVICE
            │
            ├─ axios instance:
            │   • baseURL: VITE_API_URL || 'http://localhost:8000'
            │   • headers: { 'Content-Type': 'application/json' }
            │
            ├─ request interceptor:
            │   • adds Authorization: `Bearer ${token}` header
            │
            ├─ response interceptor:
            │   • handles 401: logout & redirect to /doctor/login
            │
            └─ authService object:
                ├─ loginDoctor(credentials)
                │  └─ POST /api/auth/doctor/login
                │  └─ returns: { access_token, user }
                │
                ├─ loginStaff(credentials)
                │  └─ POST /api/auth/staff/login
                │  └─ returns: { access_token, user }
                │
                ├─ logout()
                │  └─ clears: access_token, user_role, user_data
                │
                ├─ getCurrentUser()
                │  └─ returns: user data from localStorage
                │
                ├─ isAuthenticated()
                │  └─ returns: !!localStorage.access_token
                │
                └─ getUserRole()
                   └─ returns: localStorage.user_role
```

---

## 🔗 Import/Export Linking

### App.jsx imports:
```javascript
import DoctorLogin from './pages/DoctorLogin'
import DoctorDashboard from './pages/DoctorDashboard'
import StaffLogin from './pages/StaffLogin'
import StaffDashboard from './pages/StaffDashboard'
import ProtectedRoute from './components/ProtectedRoute'
```

### DoctorDashboard.jsx imports:
```javascript
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { authService } from '../services/api'
import TopBar from '../components/TopBar'
import Sidebar from '../components/Sidebar'
import StatsSection from '../components/dashboard/StatsSection'
import AlertsPanel from '../components/dashboard/AlertsPanel'
import ActivityFeed from '../components/dashboard/ActivityFeed'
import TasksPanel from '../components/dashboard/TasksPanel'
import VitalsTrends from '../components/dashboard/VitalsTrends'
```

### services/api.js imports:
```javascript
import axios from 'axios'
```

### components/dashboard/index.js exports:
```javascript
export { default as StatCard } from './StatCard'
export { default as StatsSection } from './StatsSection'
export { default as AlertsPanel } from './AlertsPanel'
export { default as ActivityFeed } from './ActivityFeed'
export { default as TasksPanel } from './TasksPanel'
export { default as VitalsTrends } from './VitalsTrends'
```

---

## 📊 Data Flow Summary

```
User opens browser
    ↓
http://localhost:3000
    ↓
App.jsx routes to /doctor/login (default)
    ↓
DoctorLogin.jsx renders
    ↓
User submits credentials
    ↓
authService.loginDoctor(credentials)
    ↓
Token stored in localStorage
    ↓
navigate('/doctor/dashboard')
    ↓
ProtectedRoute validates token
    ↓
DoctorDashboard.jsx renders
    ├─ TopBar displays userName from authService.getCurrentUser()
    ├─ Sidebar shows navigation + logout
    └─ Components render with mock data:
       ├─ StatsSection (static cards)
       ├─ AlertsPanel (alerts from state)
       ├─ ActivityFeed (activity from state)
       ├─ TasksPanel (tasks from state)
       └─ VitalsTrends (static charts)

When user clicks Logout:
    ↓
handleLogout() → authService.logout()
    ↓
localStorage cleared
    ↓
navigate('/doctor/login')
    ↓
ProtectedRoute checks token (none found)
    ↓
Redirects to /doctor/login
```

---

## ✅ COMPLETE FILE CHECKLIST

Frontend Complete - All Files Present:

- [x] App.jsx - Main router
- [x] main.jsx - Entry point
- [x] pages/DoctorLogin.jsx
- [x] pages/DoctorDashboard.jsx ⭐ MAIN
- [x] pages/StaffLogin.jsx
- [x] pages/StaffDashboard.jsx
- [x] components/TopBar.jsx
- [x] components/Sidebar.jsx
- [x] components/LoginLayout.jsx
- [x] components/ProtectedRoute.jsx
- [x] components/dashboard/StatCard.jsx
- [x] components/dashboard/StatsSection.jsx
- [x] components/dashboard/AlertsPanel.jsx
- [x] components/dashboard/ActivityFeed.jsx
- [x] components/dashboard/TasksPanel.jsx
- [x] components/dashboard/VitalsTrends.jsx
- [x] components/dashboard/index.js
- [x] services/api.js
- [x] styles/index.css
- [x] package.json
- [x] vite.config.js

---

## 🚀 READY TO RUN

```bash
npm run dev
# Frontend running on http://localhost:3000
# All components linked and connected
# Mock data functional without backend
```

**Status**: ✅ COMPLETE & RUNNING

