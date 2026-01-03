# 🔗 COMPLETE FRONTEND LINKING DIAGRAM

## 📐 ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────────────────────────┐
│                         VITE DEV SERVER                          │
│                    http://localhost:3000                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │
                    ┌─────────▼──────────┐
                    │    App.jsx         │
                    │  (Main Router)     │
                    └─────────┬──────────┘
                              │
                ┌─────────────┼──────────────┐
                │             │              │
        ┌───────▼────────┐   │      ┌───────▼────────┐
        │  DOCTOR PATH   │   │      │   STAFF PATH   │
        └────────────────┘   │      └────────────────┘
                │             │              │
     ┌──────────┴────┐       │      ┌───────┴────────┐
     │                │       │      │                │
┌────▼─────────┐  ┌──┴──────┐│   ┌──▼────────────┐ ┌─┴─────────┐
│ /doctor/     │  │/doctor/ │└──│ /staff/login  │ │/staff/    │
│ login        │  │dashboard│   │               │ │dashboard  │
└────┬─────────┘  └────┬────┘    └──────────────┘ └───────────┘
     │                 │                            (StaffDash.)
     │                 │
┌────▼───────────┐ ┌───▼──────────────────────────────────┐
│ DoctorLogin    │ │ ProtectedRoute [doctor]              │
│ ─────────────  │ │ ├─ checks token + role               │
│ • Form input   │ │ ├─ auto-login in DEV mode            │
│ • validation   │ │ └─→ DoctorDashboard                  │
│ • auth call    │ │                                      │
│ • redirect     │ │    ┌────────────────────────┐        │
└────────────────┘ │    │ DoctorDashboard        │        │
                   │    │ ═════════════════════  │        │
                   │    │ • TopBar               │        │
                   │    │ • Sidebar              │        │
                   │    │ • Main Content:        │        │
                   │    │   ├─ StatsSection      │        │
                   │    │   ├─ AlertsPanel       │        │
                   │    │   ├─ ActivityFeed      │        │
                   │    │   ├─ TasksPanel        │        │
                   │    │   └─ VitalsTrends      │        │
                   │    └────────────────────────┘        │
                   │                                      │
                   └──────────────────────────────────────┘
```

---

## 📊 COMPONENT LINKING TREE

```
App.jsx (Router)
│
├─── /doctor/login
│    └─── DoctorLogin.jsx
│         └─── LoginLayout.jsx
│              ├─ Left: Branding
│              └─ Right: Login Form
│
├─── /doctor/dashboard [Protected]
│    └─── DoctorDashboard.jsx ★ MAIN DASHBOARD
│         │
│         ├─ TopBar.jsx
│         │  └─ Displays: Logo + Search + User Profile
│         │
│         ├─ Sidebar.jsx
│         │  ├─ Navigation Links
│         │  ├─ Active Route Highlight
│         │  └─ Logout Button (calls authService.logout)
│         │
│         └─ Main Content (3 sections)
│            │
│            ├─ StatsSection
│            │  ├─ StatCard (Active Patients: 249)
│            │  ├─ StatCard (Critical Alerts: 3)
│            │  ├─ StatCard (Pending Prescriptions: 5)
│            │  └─ StatCard (Low Stock Items: 3)
│            │
│            ├─ AlertsPanel ◄─── alerts prop (from patients state)
│            │  └─ Table: Patient | Room | Condition | Severity | Time
│            │     └─ Color-coded severity (🔴 High 🟡 Medium 🟢 Low)
│            │
│            └─ Grid (2 cols on lg+)
│               ├─ Left Column (2/3):
│               │  ├─ ActivityFeed ◄─── activity prop
│               │  │  └─ List: Title | Author | Time
│               │  │
│               │  └─ TasksPanel ◄─── tasks prop
│               │     └─ List: Title | When | Priority Badge
│               │
│               └─ Right Column (1/3):
│                  └─ VitalsTrends
│                     ├─ Heart Rate Chart (74 bpm avg)
│                     └─ Blood Pressure Chart (122 mmHg avg)
│
├─── /staff/login
│    └─── StaffLogin.jsx
│         └─── LoginLayout.jsx
│
└─── /staff/dashboard [Protected]
     └─── StaffDashboard.jsx (similar structure)

ProtectedRoute.jsx (Wrapper)
│
└─ Checks:
   ├─ localStorage: access_token
   ├─ localStorage: user_role
   ├─ Dev Mode: auto-login
   └─ Redirect: unauthorized users to login
```

---

## 🔄 DATA FLOW

### Authentication Flow
```
User Browser Input
    │
    ▼
DoctorLogin.jsx
    │ (form submission)
    ▼
authService.loginDoctor(credentials)
    │ (API call to backend)
    ▼
localStorage.setItem('access_token', token)
localStorage.setItem('user_role', 'doctor')
localStorage.setItem('user_data', JSON.stringify(user))
    │
    ▼
navigate('/doctor/dashboard')
    │
    ▼
ProtectedRoute
    │ (validates token)
    ▼
DoctorDashboard renders
    │
    ▼
authService.getCurrentUser() → TopBar (displays user name)
```

### Dashboard Data Flow
```
DoctorDashboard.jsx
    │
    ├─ useState([patients]) ───┐
    │                           ├─ Alerts derived from patients
    │                           │  (map + filter by severity)
    │                           │
    ├─ useState([activity])    ├─ ActivityFeed component
    │                           │  (receives as prop)
    │                           │
    ├─ useState([tasks])       ├─ TasksPanel component
    │                           │  (receives as prop)
    │                           │
    └─ (static data)           ├─ StatCards: fixed values
                               ├─ VitalsTrends: fixed charts
                               │
                               ▼
                          ✅ Components Render
```

### Logout Flow
```
User clicks Logout Button (Sidebar)
    │
    ▼
handleLogout() in DoctorDashboard
    │
    ▼
authService.logout()
    │ (clears localStorage)
    │
    ▼
navigate('/doctor/login')
    │
    ▼
ProtectedRoute checks token
    │ (no token found)
    │
    ▼
Redirect to /doctor/login
```

---

## 📦 STATE MANAGEMENT

### DoctorDashboard State
```javascript
const [user, setUser] = useState(null)
const [patients] = useState([...]) // 6 patients
const [alerts] = useState(...)     // derived from patients
const [activity] = useState([...]) // 3 activities
const [tasks] = useState([...])    // 3 tasks
```

### AuthService (services/api.js)
```javascript
authService = {
  loginDoctor()      → POST /api/auth/doctor/login
  loginStaff()       → POST /api/auth/staff/login
  logout()           → clear localStorage
  getCurrentUser()   → get from localStorage
  isAuthenticated()  → check token exists
  getUserRole()      → get from localStorage
}
```

### localStorage Keys
```
- access_token: JWT token (from server)
- user_role:   'doctor' | 'staff'
- user_data:   { full_name, email, ... }
```

---

## 🎨 COMPONENT PROPS MAPPING

### StatCard
```
Props: { icon, label, value, sub }
     ↓
<StatCard 
  icon={Activity}
  label="Active Patients"
  value={249}
  sub="+12 From This Week"
/>
```

### AlertsPanel
```
State: [patients]
     ↓ map
State: [alerts] = [{ patient, room, condition, severity, time }]
     ↓ pass as prop
<AlertsPanel alerts={alerts} />
```

### ActivityFeed
```
State: [activity] = [{ title, author, time }]
     ↓
<ActivityFeed items={activity} />
```

### TasksPanel
```
State: [tasks] = [{ title, when, priority }]
     ↓
<TasksPanel tasks={tasks} />
```

### TopBar
```
authService.getCurrentUser()
     ↓
{full_name}
     ↓
<TopBar userName={`Dr. ${user?.full_name}`} />
```

### Sidebar
```
handleLogout function
     ↓
<Sidebar onLogout={handleLogout} />
```

---

## 🔌 API INTEGRATION POINTS

Currently using mock data. To connect to backend:

```javascript
// In DoctorDashboard.jsx, replace:
const [alerts] = useState(...)

// With:
useEffect(() => {
  api.get('/api/alerts')
     .then(res => setAlerts(res.data))
     .catch(err => console.error(err))
}, [])
```

### Existing API Service Points
```javascript
// Already configured in services/api.js:
api.post('/api/auth/doctor/login')
api.post('/api/auth/staff/login')

// Ready to use for:
api.get('/api/patients')
api.get('/api/alerts')
api.get('/api/activities')
api.get('/api/tasks')
api.get('/api/vitals')
```

---

## ✅ VERIFICATION CHECKLIST

- [x] App.jsx routes all pages correctly
- [x] DoctorLogin connects to DoctorDashboard
- [x] StaffLogin connects to StaffDashboard  
- [x] ProtectedRoute validates auth
- [x] TopBar displays user name
- [x] Sidebar shows navigation
- [x] AlertsPanel displays alerts
- [x] ActivityFeed displays activities
- [x] TasksPanel displays tasks
- [x] StatsSection displays 4 cards
- [x] VitalsTrends displays 2 charts
- [x] Logout clears auth and redirects
- [x] All components styled with Tailwind CSS
- [x] Responsive design working
- [x] Development mode auto-login working
- [x] API interceptors configured

---

## 🚀 READY TO RUN

```bash
npm run dev
# Open: http://localhost:3000/doctor/dashboard
```

**Status**: ✅ Frontend completely linked and running  
**Backend**: Optional (using mock data)  
**Testing**: Click through all routes and features

