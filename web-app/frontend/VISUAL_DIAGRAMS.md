# Add Patient Feature - Visual Architecture & Flow Diagrams

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Cognivus Labs Frontend                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │          React Application (App.jsx)                 │  │
│  │                                                      │  │
│  │  Routes:                                            │  │
│  │  - /doctor/login                                   │  │
│  │  - /doctor/dashboard                              │  │
│  │  - /doctor/patients  ← PatientsPage                │  │
│  │  - /doctor/patients/:id                            │  │
│  │  - /staff/login                                    │  │
│  │  - /staff/dashboard                               │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │          PatientsPage Component                      │  │
│  │                                                      │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐          │  │
│  │  │  TopBar  │  │ Sidebar  │  │PatientCard│          │  │
│  │  │          │  │          │  │(x 8+)   │          │  │
│  │  └──────────┘  └──────────┘  └──────────┘          │  │
│  │                                                      │  │
│  │  State:                                            │  │
│  │  - patients: []                                   │  │
│  │  - isAddPatientModalOpen: false                   │  │
│  │  - searchTerm: ""                                 │  │
│  │  - filterStatus: "all"                            │  │
│  │                                                      │  │
│  │  Functions:                                        │  │
│  │  - handleAddPatient(newPatient)                   │  │
│  │  - fetchPatients()                                │  │
│  │  - filterPatients()                               │  │
│  │                                                      │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │        AddPatientModal Component (NEW)              │  │
│  │                                                      │  │
│  │  Props:                                            │  │
│  │  - isOpen: boolean                                │  │
│  │  - onClose: function                              │  │
│  │  - onAddPatient: function                         │  │
│  │                                                      │  │
│  │  State:                                            │  │
│  │  - formData: {...25 fields}                       │  │
│  │  - errors: {...}                                  │  │
│  │  - photoPreview: string                           │  │
│  │  - activeTab: "basic" | "medical"                │  │
│  │  - isDragging: boolean                            │  │
│  │                                                      │  │
│  │  Features:                                        │  │
│  │  - Photo upload (drag & drop)                    │  │
│  │  - Form validation                                │  │
│  │  - Age calculation                                │  │
│  │  - Tab navigation                                 │  │
│  │  - Error handling                                 │  │
│  │                                                      │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagram

```
User Interaction:
│
├─ Click "+ Add Patient" button
│  │
│  └─→ setIsAddPatientModalOpen(true)
│
├─ Modal Opens
│  │
│  ├─ Show Basic Info Tab
│  ├─ Show Medical Info Tab
│  └─ Show Form Fields
│
├─ User Fills Form
│  │
│  ├─ First Name → State Update
│  ├─ Last Name → State Update
│  ├─ Date of Birth → State Update + Age Calculation
│  ├─ Other Fields → State Update
│  └─ Photo Upload → FileReader → Preview
│
├─ User Clicks "Add Patient"
│  │
│  └─→ handleSubmit()
│     │
│     ├─ Call validateForm()
│     │  │
│     │  ├─ Check Required Fields (9)
│     │  ├─ Check Email Format
│     │  └─ Return errors object
│     │
│     ├─ If Errors:
│     │  │
│     │  └─→ Display Error Messages
│     │     └─ User Corrects & Retries
│     │
│     └─ If Valid:
│        │
│        ├─ Create Patient Object
│        │  │
│        │  ├─ Generate unique ID
│        │  ├─ Collect all form data
│        │  ├─ Add timestamp
│        │  └─ Return complete object
│        │
│        ├─ Call onAddPatient(newPatient)
│        │  │
│        │  └─→ In PatientsPage:
│        │     │
│        │     └─ setPatients([newPatient, ...patients])
│        │
│        ├─ Reset Form
│        │  │
│        │  └─ Clear all fields
│        │
│        ├─ Reset Modal
│        │  │
│        │  ├─ Set activeTab = "basic"
│        │  └─ Clear photoPreview
│        │
│        └─ Close Modal
│           │
│           └─→ setIsAddPatientModalOpen(false)
│
└─ Patient List Updates
   │
   ├─ New patient appears at top
   ├─ Patient card displays data
   ├─ Can click to view details
   └─ Can add more patients
```

---

## Component Hierarchy

```
App (Router)
│
└─ PatientsPage
   │
   ├─ TopBar
   │  └─ User Profile Menu
   │
   ├─ Sidebar
   │  ├─ Dashboard Link
   │  ├─ Patients Link (active)
   │  ├─ Prescriptions Link
   │  ├─ AI Insights Link
   │  ├─ Telemedicine Link
   │  ├─ Notes & Reports Link
   │  ├─ Device Management Link
   │  └─ Logout
   │
   ├─ Header Section
   │  └─ "Patients" Title
   │
   ├─ Stats Bar
   │  ├─ Total Patients
   │  ├─ Critical Count
   │  ├─ Warning Count
   │  └─ Stable Count
   │
   ├─ Search & Filter Bar
   │  ├─ Search Input
   │  ├─ Status Filter
   │  └─ + Add Patient Button ← Opens AddPatientModal
   │
   ├─ Patient Grid
   │  └─ PatientCard (x N)
   │     ├─ Photo
   │     ├─ Name & Room
   │     ├─ Vitals Cards
   │     └─ Action Buttons
   │
   └─ AddPatientModal (NEW)
      │
      ├─ Header
      │  ├─ Title
      │  └─ Close Button
      │
      ├─ Tabs
      │  ├─ Basic Info (active)
      │  └─ Medical Info
      │
      └─ Form Content
         ├─ Photo Upload Area
         ├─ Form Fields (25+)
         ├─ Error Messages
         └─ Action Buttons
```

---

## Form Field Organization

```
AddPatientModal
│
├─ BASIC INFO TAB
│  │
│  ├─ Section: Personal Info
│  │  ├─ Photo Upload (Drag & Drop)
│  │  ├─ First Name *
│  │  ├─ Last Name *
│  │  ├─ Date of Birth *
│  │  │  └─→ Auto-calculates Age
│  │  └─ Gender (Radio: Male, Female, Other)
│  │
│  ├─ Section: Contact Info
│  │  ├─ Phone Number *
│  │  ├─ Email *
│  │  └─ Room Number
│  │
│  └─ Section: Emergency Contact
│     ├─ Name *
│     ├─ Phone *
│     └─ Relationship (Dropdown)
│
└─ MEDICAL INFO TAB
   │
   ├─ Section: Medical History
   │  ├─ Blood Type (Dropdown)
   │  ├─ Allergies (Text)
   │  ├─ Medical History (Textarea)
   │  └─ Current Medications (Textarea)
   │
   ├─ Section: Insurance
   │  ├─ Provider (Text)
   │  └─ ID (Text)
   │
   └─ Section: Initial Vitals
      ├─ Heart Rate (Number)
      ├─ SpO2 (Number)
      ├─ Blood Pressure (Text)
      ├─ Temperature (Number)
      ├─ Respiratory Rate (Number)
      ├─ Glucose (Number)
      └─ Clinical Notes (Textarea)

Legend:
* = Required Field
(Dropdown) = Select element
(Text) = Text input
(Number) = Number input
(Textarea) = Multi-line text
(Radio) = Radio buttons
```

---

## Validation Flow

```
Form Submission
│
└─ validateForm()
   │
   ├─ Field: First Name
   │  ├─ Check: Not empty
   │  └─ Error: "First name is required"
   │
   ├─ Field: Last Name
   │  ├─ Check: Not empty
   │  └─ Error: "Last name is required"
   │
   ├─ Field: Date of Birth
   │  ├─ Check: Valid date selected
   │  └─ Error: "Date of birth is required"
   │
   ├─ Field: Phone Number
   │  ├─ Check: Not empty
   │  └─ Error: "Phone number is required"
   │
   ├─ Field: Email
   │  ├─ Check 1: Not empty
   │  ├─ Check 2: Valid format (regex)
   │  └─ Error: "Invalid email"
   │
   ├─ Field: Emergency Contact Name
   │  ├─ Check: Not empty
   │  └─ Error: "Emergency contact name is required"
   │
   ├─ Field: Emergency Contact Phone
   │  ├─ Check: Not empty
   │  └─ Error: "Emergency contact phone is required"
   │
   └─ Return Result
      ├─ If any errors:
      │  └─ return false → Show errors
      └─ If no errors:
         └─ return true → Submit form
```

---

## Modal State Lifecycle

```
Initial State:
isAddPatientModalOpen = false
Modal is hidden

↓

User clicks "+ Add Patient"
setIsAddPatientModalOpen(true)

↓

Modal Opens
Overlay appears
Form renders
All fields empty
activeTab = "basic"
errors = {}

↓

User fills form
formData updates
As user types:
  - Errors clear
  - Age calculates
  - Photo previews

↓

User clicks "Add Patient"
validateForm() runs
  ├─ If errors: Show messages, stay open
  └─ If valid: Continue

↓

Create patient object
onAddPatient(newPatient) called
PatientsPage updates state

↓

Reset form:
- formData cleared
- errors cleared
- activeTab = "basic"
- photoPreview = null

↓

Modal closes:
isAddPatientModalOpen = false
Overlay disappears

↓

Patient List Updates
New patient at top
Can click to view details

↓

User can add another patient
(Loop back to "User clicks + Add Patient")

OR

User can view patient details
navigate to /doctor/patients/:id
```

---

## Photo Upload Flow

```
AddPatientModal Photo Upload
│
├─ Initial State
│  └─ photoPreview = null
│     isDragging = false
│
├─ DRAG & DROP METHOD
│  │
│  ├─ onDragEnter
│  │  └─ setIsDragging(true) → Box highlights
│  │
│  ├─ onDragLeave
│  │  └─ setIsDragging(false) → Box returns normal
│  │
│  ├─ onDragOver
│  │  └─ e.preventDefault()
│  │
│  └─ onDrop
│     ├─ e.preventDefault()
│     ├─ setIsDragging(false)
│     ├─ handlePhotoUpload(e.dataTransfer.files)
│     │  │
│     │  ├─ Get file from files array
│     │  ├─ Create FileReader
│     │  ├─ Read as DataURL
│     │  └─ setPhotoPreview(base64)
│     │
│     └─ Image appears in box
│
├─ CLICK TO BROWSE METHOD
│  │
│  ├─ onClick on photo box
│  │  └─ fileInputRef.current.click()
│  │
│  ├─ File browser opens
│  │  └─ User selects image
│  │
│  └─ onChange on hidden input
│     ├─ handlePhotoUpload(e.target.files)
│     │  │
│     │  ├─ Get file
│     │  ├─ Create FileReader
│     │  ├─ Read as DataURL
│     │  └─ setPhotoPreview(base64)
│     │
│     └─ Image appears in box
│
└─ Final State
   └─ photoPreview contains base64 encoded image
      └─ Sent with form data
```

---

## Error Handling Flow

```
User Interaction Error Scenario
│
├─ User enters invalid email "invalid-email"
│
├─ User clicks "Add Patient"
│
├─ validateForm() runs
│  │
│  └─ Email field validation
│     └─ Regex check fails
│        └─ errors.email = "Invalid email"
│
├─ validateForm() returns false
│  │
│  └─ setErrors(newErrors)
│
├─ Form does NOT submit
│
├─ Error message appears:
│  └─ Red text below email field
│     └─ "Invalid email"
│
├─ User starts typing in email field
│  │
│  └─ handleInputChange() called
│     │
│     └─ If field has error:
│        └─ Clear error: setErrors({...prev, email: ''})
│
├─ Error message disappears
│  │
│  └─ User sees field is now editable
│
├─ User enters valid email
│  │
│  └─ "john@example.com"
│
└─ User clicks "Add Patient" again
   │
   └─ Validation passes → Form submits
```

---

## Integration Points

```
AddPatientModal ↔ PatientsPage Communication
│
├─ Props Passed to Modal:
│  ├─ isOpen (boolean)
│  │  └─ Controls modal visibility
│  │
│  ├─ onClose (function)
│  │  └─ Called when modal closes
│  │     └─ setIsAddPatientModalOpen(false)
│  │
│  └─ onAddPatient (function)
│     └─ Called with newPatient object
│        └─ handleAddPatient(newPatient)
│           └─ setPatients([newPatient, ...patients])
│
└─ Data Flow:
   │
   ├─ FormData (internal to Modal)
   │  ├─ 25+ fields
   │  └─ Updated with handleInputChange()
   │
   ├─ Patient Object (created on submit)
   │  ├─ Generated from formData
   │  ├─ Passed to onAddPatient()
   │  └─ Received by PatientsPage
   │
   └─ State Update (in PatientsPage)
      ├─ setPatients([newPatient, ...patients])
      └─ PatientCard renders updated list
```

---

## Browser Rendering Diagram

```
┌──────────────────────────────────────────────────────┐
│          Browser Window (1920x1080)                  │
│                                                      │
│ ┌────────────────────────────────────────────────┐  │
│ │ Cognivus Labs - Patients                      │  │  TopBar
│ │ Dr. Dulina Samarathunga [≡] [~] [U]         │  │
│ ├──┬────────────────────────────────────────────┤  │
│ │≡ │ Dashboard                                  │  │  Sidebar
│ │  │ > Patients                                 │  │
│ │  │ > Prescriptions                            │  │
│ │  │ > AI Insights                              │  │
│ │  │ > Telemedicine                             │  │
│ │  │ > Notes & Reports                          │  │
│ │  │ > Device Management                        │  │
│ │  │                                            │  │
│ │  │ Logout                                     │  │
│ ├──┼────────────────────────────────────────────┤  │
│ │  │                                            │  │
│ │  │ Patients                                   │  │
│ │  │ Manage and monitor all patient records    │  │
│ │  │                                            │  │
│ │  │ [249 Active] [Critical: 3] [Warn: 2] [Stable: 3] │
│ │  │                                            │  │
│ │  │ [Search...] [Status: All] [+ Add Patient] │  │  Add Button
│ │  │                                            │  │
│ │  │ ┌────────┐  ┌────────┐  ┌────────┐        │  │
│ │  │ │Patient │  │Patient │  │Patient │        │  │
│ │  │ │Card    │  │Card    │  │Card    │        │  │  Patient Cards
│ │  │ └────────┘  └────────┘  └────────┘        │  │
│ │  │                                            │  │
│ └──┴────────────────────────────────────────────┘  │
│                                                      │
│ ┌──────────────────────────────────────────────┐   │
│ │ × Add New Patient                            │   │  Modal
│ │ Basic Info │ Medical Info                    │   │  (Overlay)
│ │                                              │   │
│ │ [Photo Box] [First Name]  [Last Name]        │   │
│ │ [DOB]       [Gender: ⭕ ⭕ ⭕]  Age: 45      │   │
│ │ [Phone]     [Email]       [Room]             │   │
│ │                                              │   │
│ │ Emergency Contact:                           │   │
│ │ [Name]      [Phone]       [Relationship]     │   │
│ │                                              │   │
│ │ [Cancel]  [Add Patient]                      │   │
│ └──────────────────────────────────────────────┘   │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

## Responsive Design Diagram

### Desktop (1920x1080)

```
┌────────────────────────────────┐
│ ┌──┬─────────────────────────┐ │
│ │  │ [Form - Multi Column]   │ │
│ │  │ [Input] [Input]         │ │
│ │  │ [Input] [Input]         │ │
│ │  │ [Button] [Button]       │ │
│ │  └─────────────────────────┘ │
│ └──────────────────────────────┘
```

### Tablet (768x1024)

```
┌──────────────────────────────┐
│ [Form - Single Column]        │
│ [Input]                       │
│ [Input]                       │
│ [Button] [Button]             │
└──────────────────────────────┘
```

### Mobile (375x667)

```
┌──────────────────┐
│ [Form - Stack]   │
│ [Input]          │
│ [Input]          │
│ [Button]         │
│ [Button]         │
└──────────────────┘
```

---

**All diagrams show the complete flow, hierarchy, and integration of the Add Patient feature!**
