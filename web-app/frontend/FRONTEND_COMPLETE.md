# COGNIVUSLABS FRONTEND - Complete Guide

## 🚀 Quick Start

```bash
cd web-app/frontend
npm install
npm run dev
```

Visit: `http://localhost:3000`

---

## 📁 Project Structure

### Pages
- **`pages/DoctorLogin.jsx`** - Doctor authentication
- **`pages/DoctorDashboard.jsx`** - Main doctor dashboard with all components
- **`pages/StaffLogin.jsx`** - Staff authentication  
- **`pages/StaffDashboard.jsx`** - Staff dashboard

### Components
- **`components/TopBar.jsx`** - Header with logo, search, profile
- **`components/Sidebar.jsx`** - Navigation menu with logout
- **`components/LoginLayout.jsx`** - Login page layout
- **`components/ProtectedRoute.jsx`** - Auth protection wrapper

### Dashboard Components
- **`components/dashboard/StatCard.jsx`** - KPI card
- **`components/dashboard/StatsSection.jsx`** - 4 stat cards grid
- **`components/dashboard/AlertsPanel.jsx`** - Real-time alerts table
- **`components/dashboard/ActivityFeed.jsx`** - Recent activity list
- **`components/dashboard/TasksPanel.jsx`** - Upcoming tasks list
- **`components/dashboard/VitalsTrends.jsx`** - Heart rate & BP charts

### Services
- **`services/api.js`** - Axios instance, auth service, interceptors

---

## 🔗 Complete Linking Map

### Route Structure
```
/ (root)
├── /doctor/login → DoctorLogin
├── /doctor/dashboard → DoctorDashboard (Protected)
├── /staff/login → StaffLogin
├── /staff/dashboard → StaffDashboard (Protected)
└── /* (fallback) → /doctor/login
```

### Component Hierarchy
```
DoctorDashboard
├── TopBar (userName from auth)
├── Sidebar (navigation + logout)
└── Main Content
    ├── StatsSection
    │   ├── StatCard (Active Patients)
    │   ├── StatCard (Critical Alerts)
    │   ├── StatCard (Pending Prescriptions)
    │   └── StatCard (Low Stock Items)
    ├── AlertsPanel (alerts from state)
    ├── ActivityFeed (activity from state)
    ├── TasksPanel (tasks from state)
    └── VitalsTrends
        ├── Heart Rate Chart
        └── Blood Pressure Chart
```

---

## 📊 Mock Data

All data is stored in component state (no backend dependency):

### Patients
```javascript
const [patients] = useState([
  { name: 'Wathsala Dewmina', room: 'Room No. 302A', condition: 'Low O2', severity: 'low', time: '2 sec ago' },
  { name: 'Wooshan Gamage', room: 'Room No. 108C', condition: 'High HR', severity: 'high', time: '1 mins ago' },
  // ... more patients
])
```

### Alerts
Derived from patients array with severity color coding (red/yellow/green)

### Activity
```javascript
const [activity] = useState([
  { title: 'Prescription approved for Emma Davis', author: 'Dr. Sarah Smith', time: '15 mins ago' },
  { title: 'Vitals updated for Wooshan - BP: 120/80', author: 'Nurse Teneesha', time: 'Today at 2:30 PM' },
  // ... more activities
])
```

### Tasks
```javascript
const [tasks] = useState([
  { title: 'Review lab results - Michael Chen', when: 'HIGH Due in 30 mins', priority: 'HIGH' },
  { title: 'Schedule follow-up - Emma Davis', when: 'MEDIUM Due in 2 hours', priority: 'MEDIUM' },
  // ... more tasks
])
```

---

## 🔐 Authentication Flow

### Development Mode
- **Auto-login**: ProtectedRoute auto-logs in as "Preview User" in development
- **No Backend Required**: Uses localStorage for token storage
- **Role Support**: Stores `user_role` (doctor/staff) in localStorage

### Data Flow
```
User Input (DoctorLogin form)
    ↓
authService.loginDoctor()
    ↓
Token stored in localStorage
    ↓
Navigate to /doctor/dashboard
    ↓
ProtectedRoute validates token
    ↓
DoctorDashboard loads & renders all components
```

### Logout Flow
```
User clicks Logout
    ↓
handleLogout() clears localStorage
    ↓
Navigate back to /doctor/login
    ↓
ProtectedRoute redirects unauthorized access
```

---

## 🎨 Styling

**Framework**: Tailwind CSS with custom dark theme

**Colors**:
- **Background**: `slate-950`, `slate-900`, `slate-800`
- **Text**: `slate-200`, `slate-300`, `slate-400`
- **Accent**: `sky-400` (primary)
- **Status**: 
  - Red: High severity alerts
  - Yellow: Medium severity alerts
  - Green: Low severity alerts

**Responsive Design**:
- Mobile-first approach
- Breakpoints: `sm:`, `lg:`, `xl:`
- Grid layouts auto-adjust

---

## 📱 Component Props

### StatCard
```jsx
<StatCard 
  icon={Activity} 
  label="Active Patients" 
  value={249} 
  sub="+12 From This Week" 
/>
```

### AlertsPanel
```jsx
<AlertsPanel alerts={alerts} />
// alerts: Array of {patient, room, condition, severity, time}
```

### ActivityFeed
```jsx
<ActivityFeed items={activity} />
// items: Array of {title, author, time}
```

### TasksPanel
```jsx
<TasksPanel tasks={tasks} />
// tasks: Array of {title, when, priority}
```

### TopBar
```jsx
<TopBar userName="Dr. John Smith" />
```

### Sidebar
```jsx
<Sidebar onLogout={handleLogout} />
```

---

## 🚀 Features Implemented

✅ Complete doctor dashboard UI  
✅ Doctor & staff login pages  
✅ Protected routes with auth  
✅ Real-time alerts table  
✅ Activity feed  
✅ Upcoming tasks panel  
✅ Vitals trends charts  
✅ Responsive design  
✅ Dark theme  
✅ Navigation sidebar  
✅ User profile header  
✅ Mock data (no backend needed)  

---

## 🔄 State Management

**Current Approach**: React `useState` + `useEffect`

**Data Sources**:
- User data: `authService.getCurrentUser()` → localStorage
- Dashboard data: Mock data in component state
- Navigation: React Router v6

---

## 🎯 Next Steps

1. **Connect Backend API**: Replace mock data with API calls
   - Update `services/api.js` to use real endpoints
   - Replace useState with useEffect API calls

2. **Add More Pages**:
   - Patients list page
   - Patient detail page
   - Prescriptions page
   - AI Insights page
   - Reports page

3. **Enhance Features**:
   - Real-time notifications
   - Search functionality
   - Filters and sorting
   - Data export
   - Print functionality

4. **User Management**:
   - User profile page
   - Settings page
   - Change password
   - Avatar upload

---

## 🛠️ Development Commands

```bash
# Start dev server
npm run dev

# Build for production
npm build

# Preview production build
npm run preview

# Lint code
npm run lint
```

---

## 📦 Dependencies

- **React** 18.3.1
- **React Router** 6.22.0
- **Tailwind CSS** (with PostCSS)
- **Axios** 1.6.7
- **Framer Motion** 11.0.3
- **Lucide React** 0.344.0 (icons)
- **JWT Decode** 4.0.0

---

## 💡 Architecture Notes

- **Frontend-Only**: No backend required for UI testing
- **Modular Components**: Easy to maintain and extend
- **Type-Safe**: Ready for TypeScript migration
- **Interceptors**: Automatic token injection in API requests
- **Error Handling**: 401 auto-logout on auth failure
- **Development Mode**: Auto-login for quick testing

---

## 🐛 Debugging

**Check auth state**:
```javascript
localStorage.getItem('access_token')
localStorage.getItem('user_role')
localStorage.getItem('user_data')
```

**API Proxy**: Configured in `vite.config.js` to forward `/api/*` to `http://localhost:8000`

**Dev Token**: In development, `dev-token` is used for testing

---

**Created**: December 30, 2025  
**Status**: ✅ Frontend Complete and Ready to Run
