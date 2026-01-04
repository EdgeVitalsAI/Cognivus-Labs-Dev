# 🏥 HOSPITAL MANAGEMENT SYSTEM - STAFF DASHBOARD

## Complete UI Documentation & Design Specifications

**Version:** 1.0
**Last Updated:** November 2025
**Target Users:** Staff Nurses, Medical Assistants, Support Personnel

---

## 📑 TABLE OF CONTENTS

1. [Overview & Architecture](#1-overview--architecture)
2. [API Endpoints Reference](#2-api-endpoints-reference)
3. [Navigation Structure](#3-navigation-structure)
4. [Tab 1: Dashboard](#4-tab-1-dashboard)
5. [Tab 2: My Tasks](#5-tab-2-my-tasks)
6. [Tab 3: Patients](#6-tab-3-patients)
7. [Tab 4: Inventory](#7-tab-4-inventory)
8. [Tab 5: Incidents](#8-tab-5-incidents)
9. [Tab 6: Communication](#9-tab-6-communication)
10. [Tab 7: Notes](#10-tab-7-notes)
11. [Tab 8: Settings](#11-tab-8-settings)
12. [Design System](#12-design-system)
13. [User Workflows](#13-user-workflows)

---

## 1. OVERVIEW & ARCHITECTURE

### 1.1 Purpose

The Staff Dashboard provides nursing and support staff with tools to:

-   Monitor assigned patients
-   Manage daily tasks
-   Track medication inventory
-   Report incidents
-   Communicate with care teams
-   Document clinical notes

### 1.2 User Roles

-   Staff Nurse (Primary)
-   Charge Nurse
-   Medical Assistant
-   Unit Secretary

### 1.3 Technical Stack

-   Frontend: React with Tailwind CSS
-   Real-time: WebSocket connections
-   Authentication: JWT tokens
-   API: RESTful endpoints

---

## 2. API ENDPOINTS REFERENCE

### Authentication

```http
POST   /auth/login         # Staff login
POST   /auth/logout        # Logout
POST   /auth/refresh       # Refresh token
```

### User Management

```http
GET    /users/me           # Current staff profile
GET    /staff/{id}         # Staff member profile
GET    /doctors/{id}       # Doctor profile
```

### Patient Management

```http
GET    /patients           # List patients
POST   /patients           # Add patient
GET    /patients/{id}      # Patient details
PATCH  /patients/{id}      # Update patient
DELETE /patients/{id}      # Remove patient
```

### Vitals & Monitoring

```http
GET    /patients/{id}/vitals         # Latest vitals
GET    /patients/{id}/vitals/history # Historical vitals
GET    /patients/{id}/alerts         # Patient alerts
WS     /ws/patients/{id}/vitals      # Real-time vitals
WS     /ws/alerts                    # Real-time alerts
```

### Medications

```http
GET    /patients/{id}/prescriptions  # All prescriptions
POST   /patients/{id}/prescriptions  # Add prescription
PATCH  /prescriptions/{id}           # Update prescription
GET    /patients/{id}/dispenses      # Dispense history
```

### Inventory

```http
GET    /inventory                      # Medicine stock
POST   /inventory/refill-requests      # Request refill
GET    /inventory/refill-requests      # Refill queue
PATCH  /inventory/refill-requests/{id} # Complete refill
```

### Communication

```http
GET    /chats/{conversationId}           # Chat history
POST   /chats/{conversationId}/messages  # Send message
POST   /video/sessions                   # Start video call
```

### Clinical Notes

```http
POST   /notes/patient/{id}  # Add note
GET    /notes/patient/{id}  # View notes
```

### Staff Tools

```http
GET    /staff/tasks      # Assigned tasks
POST   /staff/tasks      # Create task
PATCH  /staff/tasks/{id} # Update task
POST   /staff/incidents  # Report incident
```

### Devices

```http
GET    /devices            # List devices
GET    /devices/{id}/status # Device status
```

---

## 3. NAVIGATION STRUCTURE

### 3.1 Main Layout

```
┌────────────────────────────────────────────────┐
│  [LOGO] HealthCare Pro     🔔(5) 👤 ⚙️ 🚪     │
│  Staff: Jane Johnson, RN                      │
├════════════════════════════════════════════════┤
│ SIDEBAR │ MAIN CONTENT AREA                   │
│         │                                      │
│ 📊 Dash │                                      │
│ ✅ Tasks│                                      │
│ 👥 Pats │                                      │
│ 📦 Inv  │                                      │
│ 🚨 Inc  │                                      │
│ 💬 Comm │                                      │
│ 📝 Notes│                                      │
│ ⚙️  Set  │                                      │
│         │                                      │
│ [◀]     │                                      │
└─────────┴──────────────────────────────────────┘
```

### 3.2 Sidebar Navigation Items

1. 📊 **Dashboard** - Home/overview
2. ✅ **My Tasks** - Task management
3. 👥 **Patients** - Patient list & details
4. 📦 **Inventory** - Stock management
5. 🚨 **Incidents** - Incident reporting
6. 💬 **Communication** - Team chat
7. 📝 **Notes** - Clinical documentation
8. ⚙️ **Settings** - User preferences

---

## 4. TAB 1: DASHBOARD

### 4.1 Overview

Main landing page showing critical information at a glance.

### 4.2 Layout Structure

```
┌────────────────────────────────────────────────┐
│  Welcome back, Jane Johnson                    │
│  Shift: Day (7 AM - 3 PM) | Time: 11:30 AM     │
├════════════════════════════════════════════════┤
│                                                │
│  QUICK STATS (4 Cards)                         │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐            │
│  │ 12  │ │  8  │ │  3  │ │ 15  │            │
│  │Pats │ │Task │ │Alert│ │Today│            │
│  └─────┘ └─────┘ └─────┘ └─────┘            │
│                                                │
│  CRITICAL ALERTS                               │
│  🔴 Sarah J. - Room 302A - High HR (125)      │
│  🔴 Michael C. - Room 215B - Low O2 (88%)     │
│  [View All →]                                  │
│                                                │
│  3 COLUMNS:                                    │
│  ┌─────────┬─────────┬──────────┐            │
│  │ URGENT  │   MY    │   LOW    │            │
│  │  TASKS  │PATIENTS │  STOCK   │            │
│  └─────────┴─────────┴──────────┘            │
│                                                │
└────────────────────────────────────────────────┘
```

### 4.3 Component Details

**Quick Stats Cards:**

-   Assigned Patients: Count from `GET /patients`
-   Pending Tasks: From `GET /staff/tasks`
-   Critical Alerts: From `WebSocket /ws/alerts`
-   Tasks Today: Today's task count

**Critical Alerts Panel:**

-   Real-time via WebSocket
-   Shows patient, location, alert type
-   Action buttons: View, Acknowledge

**Three Columns:**

1. Urgent Tasks - High priority items
2. My Patients - Assigned patient list
3. Low Stock - Inventory alerts

---

## 5. TAB 2: MY TASKS

### 5.1 Overview

Complete task management system for daily patient care activities.

### 5.2 Main View

```
┌────────────────────────────────────────────────┐
│  MY TASKS                                      │
│  [+ New Task] [Filter ▼] [Sort: Due ▼]        │
├════════════════════════════════════════════════┤
│  [To Do (8)] [In Progress (3)] [Done (12)]    │
├────────────────────────────────────────────────┤
│                                                │
│  🔴 HIGH PRIORITY (3)                          │
│  ┌──────────────────────────────────────┐     │
│  │ ☐ Administer meds - Room 302A   [⋮] │     │
│  │   Due: 15 mins | Patient: Sarah J.   │     │
│  │   [Complete] [View] [Snooze]         │     │
│  └──────────────────────────────────────┘     │
│                                                │
│  ┌──────────────────────────────────────┐     │
│  │ ☐ Check vitals - Room 410C      [⋮] │     │
│  │   Due: 30 mins | Emma D. | Post-op   │     │
│  │   [Complete] [View] [Record]         │     │
│  └──────────────────────────────────────┘     │
│                                                │
│  🟡 MEDIUM PRIORITY (5)                        │
│  • Wound dressing - Room 215B (2 PM)          │
│  • Schedule follow-up - Sarah J. (5 PM)       │
│  [Show more...]                                │
│                                                │
│  ✅ COMPLETED TODAY (12)                       │
│  • Morning med round (8 AM) ✓                  │
│  • Vitals check - All pts (8:30 AM) ✓         │
│  [Show more...]                                │
│                                                │
└────────────────────────────────────────────────┘
```

### 5.3 Task Card Components

-   Checkbox for completion
-   Priority indicator (🔴🟡🟢)
-   Task title and description
-   Due date/time with countdown
-   Patient information
-   Action buttons

### 5.4 Create Task Modal

```
┌─────────────────────────────────────┐
│  Create New Task              [X]  │
├═════════════════════════════════════┤
│  Title: *                           │
│  [_________________________]        │
│                                     │
│  Description:                       │
│  [                         ]        │
│                                     │
│  Priority: (•) Medium               │
│  Due: [11/02/25] [2:00 PM]          │
│  Patient: [Search...]               │
│  Category: [Dropdown]               │
│                                     │
│  [Cancel]      [Create Task]        │
└─────────────────────────────────────┘
```

### 5.5 API Integration

-   List tasks: `GET /staff/tasks`
-   Create: `POST /staff/tasks`
-   Update: `PATCH /staff/tasks/{id}`
-   Complete: `PATCH /staff/tasks/{id}` with status

---

## 6. TAB 3: PATIENTS

### 6.1 Overview

Patient list and detailed patient information management.

### 6.2 Patient List View

```
┌────────────────────────────────────────────────┐
│  PATIENTS (12 Assigned)                        │
│  [🔍 Search] [Filter ▼] [Sort: Room ▼]        │
├════════════════════════════════════════════════┤
│                                                │
│  ┌──────────────────────────────────────┐     │
│  │ [Photo] Sarah Johnson    [🔴 2]      │     │
│  │ 58F | Room 302A                      │     │
│  │ 💓125 🌡️98.6 🩸135/85 💨97%          │     │
│  │ Cardiology | ACS | Dr. Smith         │     │
│  │ [View] [Vitals] [Note]               │     │
│  └──────────────────────────────────────┘     │
│                                                │
│  ┌──────────────────────────────────────┐     │
│  │ Michael Chen - 45M - 215B [🟡 1]     │     │
│  │ [Collapsed]                          │     │
│  └──────────────────────────────────────┘     │
│                                                │
│  [Show 10 more...]                             │
│                                                │
└────────────────────────────────────────────────┘
```

### 6.3 Patient Detail Page

```
┌────────────────────────────────────────────────┐
│  ← Back | Sarah Johnson | Room 302A [🔴 2]     │
├════════════════════════════════════════════════┤
│  [Overview][Vitals][Meds][Notes][Alerts]      │
├────────────────────────────────────────────────┤
│                                                │
│  OVERVIEW TAB:                                 │
│  Basic Info:                                   │
│  • Name: Sarah Marie Johnson                   │
│  • DOB: Jan 15, 1967 (58)                      │
│  • Blood Type: O+                              │
│  • Allergies: Penicillin ⚠️, Peanuts          │
│                                                │
│  Admission:                                    │
│  • Date: Oct 25, 2025 (7 days)                 │
│  • Dept: Cardiology                            │
│  • Attending: Dr. Smith                        │
│  • Nurse: Jane Johnson (You)                   │
│  • Diagnosis: Acute Coronary Syndrome          │
│                                                │
│  Current Status:                               │
│  • Code: Full Code                             │
│  • Diet: Cardiac, low sodium                   │
│  • Activity: Bed rest + bathroom               │
│  • IV: Left forearm, 20G                       │
│  • O2: 2L nasal cannula                        │
│                                                │
│  Emergency Contact:                            │
│  • John Johnson (Husband)                      │
│  • Phone: (555) 123-4567                       │
│                                                │
└────────────────────────────────────────────────┘
```

### 6.4 Vitals Tab

-   Real-time vitals display
-   Historical trends
-   Record new vitals form
-   Export data option

### 6.5 Quick Actions

-   Add Nursing Note
-   Record Vitals
-   View Medications
-   View Alerts
-   Contact Doctor
-   Print Summary

---

## 7. TAB 4: INVENTORY

### 7.1 Overview

Medicine and supply inventory with stock tracking and refill requests.

### 7.2 Main View

```
┌────────────────────────────────────────────────┐
│  INVENTORY MANAGEMENT                          │
│  [🔍 Search] [Filter ▼] [+ Refill Request]    │
├════════════════════════════════════════════════┤
│  STATS: 245 Items | 18 Low | 6 Critical       │
├────────────────────────────────────────────────┤
│  [All][Low Stock][Critical][Refill Queue]     │
├────────────────────────────────────────────────┤
│                                                │
│  🔴 CRITICAL STOCK (6)                         │
│  ┌──────────────────────────────────────┐     │
│  │ 💊 Aspirin 100mg             [⋮]     │     │
│  │ 🔴 CRITICAL | Stock: 10 tablets      │     │
│  │ [██░░░░░░░░] 2% remaining            │     │
│  │ Reorder: 50 | Normal: 500            │     │
│  │ Location: Med Room A, Shelf 3        │     │
│  │ Daily usage: ~45 | Depletes: 5 hrs   │     │
│  │ Status: Refill requested (2h ago)    │     │
│  │ [Request Urgent] [View History]      │     │
│  └──────────────────────────────────────┘     │
│                                                │
│  ┌──────────────────────────────────────┐     │
│  │ 🩹 Gauze Pads 4x4            [⋮]     │     │
│  │ 🔴 Stock: 5 boxes (50 pads)          │     │
│  │ [View Details]                       │     │
│  └──────────────────────────────────────┘     │
│                                                │
│  🟡 LOW STOCK (18)            [View All]       │
│  • Lisinopril 10mg - 45 tabs (15%)             │
│  • Syringes 3ml - 150 units (20%)              │
│  [Show more...]                                │
│                                                │
│  REFILL QUEUE (12 Pending)                     │
│  ┌──────────────────────────────────────┐     │
│  │ 📦 Request #1245             [⋮]     │     │
│  │ Aspirin 100mg | Qty: 1000            │     │
│  │ Priority: 🔴 URGENT                  │     │
│  │ By: Nurse Johnson | 9:30 AM          │     │
│  │ Status: ⏳ Pending Approval          │     │
│  │ Delivery: Today 5 PM                 │     │
│  │ [Mark Received] [Track] [Cancel]     │     │
│  └──────────────────────────────────────┘     │
│                                                │
└────────────────────────────────────────────────┘
```

### 7.3 Request Refill Modal

```
┌─────────────────────────────────────┐
│  Request Refill              [X]   │
├═════════════════════════════════════┤
│  Medicine: *                        │
│  [Search by name...]                │
│  → Aspirin 100mg (Current: 10)      │
│                                     │
│  Quantity: * [1000] tablets         │
│  (Recommended based on usage)       │
│                                     │
│  Priority:                          │
│  (•) Urgent ( ) Standard ( ) Low    │
│                                     │
│  Reason: *                          │
│  [Critical stock - 10 remaining.  ] │
│  [Depletes in 5 hours.            ] │
│                                     │
│  Supplier: [MedSupply Co. ▼]        │
│  Delivery: [11/01/25] [5:00 PM]     │
│                                     │
│  [Cancel]      [Submit Request]     │
└─────────────────────────────────────┘
```

### 7.4 API Integration

-   Get stock: `GET /inventory`
-   Request refill: `POST /inventory/refill-requests`
-   Track queue: `GET /inventory/refill-requests`
-   Mark complete: `PATCH /inventory/refill-requests/{id}`

---

## 8. TAB 5: INCIDENTS

### 8.1 Overview

Comprehensive incident reporting and tracking system for patient safety and quality improvement.

### 8.2 Main View

```
┌────────────────────────────────────────────────┐
│  INCIDENT REPORTING                            │
│  [+ Report Incident] [Filter ▼] [Search]      │
├════════════════════════════════════════════════┤
│  Stats: 24 This Month | 8 Open | 4 Today      │
├────────────────────────────────────────────────┤
│  [My Reports][All][Pending][Resolved]         │
├────────────────────────────────────────────────┤
│                                                │
│  ⚠️ OPEN INCIDENTS (8)                         │
│  ┌──────────────────────────────────────┐     │
│  │ 🔴 #IR-2025-1148 [URGENT]        [⋮] │     │
│  │ Patient Safety | High Severity        │     │
│  │ Nov 1, 2:15 PM (15 mins ago)          │     │
│  │                                       │     │
│  │ Location: Room 410C                   │     │
│  │ Patient: Emma Davis (67F)             │     │
│  │                                       │     │
│  │ Summary: Near-fall incident. Patient  │     │
│  │ attempted ambulation without assist.  │     │
│  │ Caught by staff before hitting ground.│     │
│  │ No injuries sustained.                │     │
│  │                                       │     │
│  │ Actions Taken:                        │     │
│  │ ✓ Patient assessed - no injury       │     │
│  │ ✓ MD notified                         │     │
│  │ ✓ Bed alarm activated                 │     │
│  │ ✓ Fall risk sign posted               │     │
│  │                                       │     │
│  │ Reported by: Nurse Peterson           │     │
│  │ Status: Under Investigation           │     │
│  │                                       │     │
│  │ [View Full] [Update] [Close]          │     │
│  └──────────────────────────────────────┘     │
│                                                │
│  ┌──────────────────────────────────────┐     │
│  │ 🟡 #IR-2025-1145 [OPEN]          [⋮] │     │
│  │ Equipment Malfunction | Medium        │     │
│  │ Nov 1, 10:15 AM                       │     │
│  │ Auto-Dispenser jammed - Med Room      │     │
│  │ Status: Awaiting Biomed               │     │
│  │ [View] [Update]                       │     │
│  └──────────────────────────────────────┘     │
│                                                │
│  ✅ RESOLVED TODAY (4)          [View All]     │
│  • Documentation Error - Corrected (11:30)     │
│  • IV Infiltration - Restarted (9:45)          │
│  [Show more...]                                │
│                                                │
└────────────────────────────────────────────────┘
```

### 8.3 Report Incident Form

```
┌─────────────────────────────────────────────┐
│  Report New Incident                  [X]  │
├═════════════════════════════════════════════┤
│  STEP 1: TYPE & SEVERITY                    │
│                                             │
│  Type: *                                    │
│  [Dropdown]                                 │
│  • Patient Safety                           │
│  • Medication Error                         │
│  • Equipment Malfunction                    │
│  • Supply Issue                             │
│  • Documentation Error                      │
│  • Other                                    │
│                                             │
│  Severity: *                                │
│  ( ) High  (•) Medium  ( ) Low              │
│                                             │
│  ──────────────────────────────────────     │
│                                             │
│  STEP 2: WHEN & WHERE                       │
│  Date: [11/01/25] Time: [2:15 PM]           │
│  Location: [Dropdown: Rooms/Areas]          │
│                                             │
│  ──────────────────────────────────────     │
│                                             │
│  STEP 3: PATIENT INVOLVED                   │
│  (•) Yes  ( ) No                            │
│  Patient: [Search by name/room]             │
│  → Emma Davis - Room 410C                   │
│                                             │
│  Witnesses: [+ Add]                         │
│  • Nurse Jane Johnson [X]                   │
│                                             │
│  ──────────────────────────────────────     │
│                                             │
│  STEP 4: DESCRIPTION *                      │
│  Brief Summary: (50-100 chars)              │
│  [_______________________________]          │
│                                             │
│  Detailed Description:                      │
│  [                                ]          │
│  [  Describe what happened...    ]          │
│  [                                ]          │
│  [                                ]          │
│                                             │
│  Contributing Factors:                      │
│  [  What contributed?            ]          │
│  [                                ]          │
│                                             │
│  ──────────────────────────────────────     │
│                                             │
│  STEP 5: IMMEDIATE ACTIONS                  │
│  ☑ Patient assessed                         │
│  ☑ MD notified                              │
│  ☐ Family contacted                         │
│  ☑ Supervisor informed                      │
│  ☐ Equipment removed                        │
│                                             │
│  MD Notified: [Dr. Sarah Smith]             │
│  Time: [2:20 PM] Method: (•) Phone          │
│                                             │
│  ──────────────────────────────────────     │
│                                             │
│  STEP 6: PATIENT OUTCOME                    │
│  (•) No harm                                │
│  ( ) Minor harm                             │
│  ( ) Moderate harm                          │
│  ( ) Severe harm                            │
│                                             │
│  Status: [Patient stable, no injuries]      │
│                                             │
│  ──────────────────────────────────────     │
│                                             │
│  STEP 7: FOLLOW-UP                          │
│  (•) Yes  ( ) No follow-up needed           │
│                                             │
│  ☑ Equipment inspection                     │
│  ☐ Staff training                           │
│  ☑ Patient safety review                    │
│                                             │
│  Assign to: [Risk Management ▼]             │
│  Priority: (•) Urgent                       │
│                                             │
│  ──────────────────────────────────────     │
│                                             │
│  [Cancel] [Save Draft] [Submit Report]      │
│                                             │
└─────────────────────────────────────────────┘
```

### 8.4 Incident Categories

1. **Patient Safety** - Falls, injuries, elopement
2. **Medication Error** - Wrong dose, patient, time
3. **Equipment** - Malfunction, failure
4. **Supply** - Stock shortage, contamination
5. **Documentation** - Chart errors, missing info
6. **Communication** - Handoff failures, misunderstandings
7. **Infection Control** - Protocol breaches
8. **Environmental** - Spills, hazards

### 8.5 API Integration

-   Report incident: `POST /staff/incidents`
-   View history: `GET /staff/incidents` (assumed)
-   Update: `PATCH /staff/incidents/{id}` (assumed)

---

## 9. TAB 6: COMMUNICATION

### 9.1 Overview

Team communication hub with chat, video calls, and patient-focused discussions.

### 9.2 Layout

```
┌────────────────────────────────────────────────┐
│  COMMUNICATION CENTER                          │
│  [+ New] [📹 Video] [🔍 Search]                │
├════════════════════════════════════════════════┤
│  SIDEBAR │ ACTIVE CONVERSATION                 │
│  (30%)   │ (70%)                               │
│          │                                     │
│  TABS:   │ Dr. Sarah Smith        [📞][📹][⋮] │
│  [DM]    │ ────────────────────────────────   │
│  [Teams] │                                     │
│  [Pts]   │ Today, Nov 1                        │
│          │                                     │
│  Convos: │ DR. SMITH           10:15 AM        │
│  ●Dr.S[3]│ Can you check Room 302A?            │
│  ●Nrs.P  │                                     │
│  Pharm   │       YOU            10:18 AM       │
│  Dr.Chen │       Yes, checking now!            │
│          │                                     │
│  Teams:  │ DR. SMITH           10:20 AM        │
│  #Floor3 │ Please verify NPO status            │
│  #Night  │                                     │
│          │       YOU            10:45 AM       │
│  Patients│       ✅ All prep completed:        │
│  👤Sarah │       • NPO confirmed               │
│  👤Emma  │       • Labs in chart               │
│          │       • Consent signed              │
│          │       • Vitals stable               │
│          │                                     │
│          │ [😊][📎][Type message...] [Send]    │
│          │                                     │
└──────────┴─────────────────────────────────────┘
```

### 9.3 Conversation Types

**Direct Messages:**

-   One-on-one chats with doctors, nurses, staff
-   Status indicators (online/away/offline)
-   Unread message counts
-   Quick access to recent conversations

**Team Channels:**

-   Floor/unit teams (#Floor3)
-   Shift handoff channels
-   Department-specific (#Cardiology)
-   Broadcast announcements

**Patient Discussions:**

-   Care team conversations per patient
-   Includes assigned doctors, nurses, specialists
-   Clinical updates and care coordination
-   Quick links to patient charts

### 9.4 Video Call Interface

```
┌────────────────────────────────────────┐
│  Video Call: Dr. Sarah Smith     [✕]  │
├════════════════════════════════════════┤
│                                        │
│        DR. SMITH'S VIDEO               │
│         (Main View)                    │
│                                        │
│                                        │
│   ┌──────────┐                         │
│   │ YOU      │ (Picture-in-Picture)    │
│   └──────────┘                         │
│                                        │
│  Duration: 02:35 | Connection: ●●●●○   │
│                                        │
│  [🎤][📹][💬][👥][🔊][⚙️]              │
│            [📞 End Call]                │
│                                        │
│  SIDE PANEL:                           │
│  Notes during call:                    │
│  [                         ]           │
│                                        │
│  Patient Context:                      │
│  👤 Sarah J. - 302A                    │
│  [View Chart]                          │
│                                        │
└────────────────────────────────────────┘
```

### 9.5 Quick Message Templates

-   Vitals Update
-   Medication Administered
-   Patient Assessment
-   Lab Results Available
-   Discharge Ready
-   Equipment Issue
-   Shift Handoff Note

### 9.6 API Integration

-   Chat history: `GET /chats/{conversationId}`
-   Send message: `POST /chats/{conversationId}/messages`
-   Video call: `POST /video/sessions`

---

## 10. TAB 7:
