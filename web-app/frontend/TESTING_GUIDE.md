# Testing Guide - Add Patient Feature

## Prerequisites
- Vite dev server running on http://localhost:3000
- Logged in as admin/admin123
- On the Patients page

---

## Test Case 1: Open Modal

### Steps
1. Navigate to http://localhost:3000/doctor/patients
2. Look for the **"+ Add Patient"** button in the top-right area
3. Click the button

### Expected Results
- Modal should slide open from center
- Dark overlay appears behind modal
- Modal title shows "Add New Patient"
- Two tabs visible: "Basic Info" and "Medical Info"
- Basic Info tab is active by default
- Form fields are visible and empty

### Visual Verification
```
┌─────────────────────────────┐
│  ×  Add New Patient         │
├──────────┬──────────────────┤
│ Basic  │ Medical           │  <- Tabs
├─────────────────────────────┤
│                             │
│  [Empty form fields...]     │
│                             │
└─────────────────────────────┘
```

---

## Test Case 2: Fill Basic Info (Required Fields)

### Steps
1. **First Name**: Type "John"
2. **Last Name**: Type "Doe"
3. **Date of Birth**: Click date field and select "December 30, 1979"
4. **Gender**: Click radio button for "Male"
5. **Phone Number**: Type "+94 23 567 8901"
6. **Email**: Type "john.doe@example.com"
7. **Emergency Contact Name**: Type "Jane Doe"
8. **Emergency Contact Phone**: Type "+94 23 567 8902"

### Expected Results
- All fields accept input
- Age field shows "45" (auto-calculated from 1979)
- Form appears clean and organized
- Dark theme applied correctly
- Input fields have proper focus states

### Field Validation Status
- First Name: "John" (valid)
- Last Name: "Doe" (valid)
- Date of Birth: Selected date (valid)
- Gender: "Male" selected (valid)
- Phone: "+94 23 567 8901" (valid)
- Email: "john.doe@example.com" (valid)
- Emergency Name: "Jane Doe" (valid)
- Emergency Phone: "+94 23 567 8902" (valid)

---

## Test Case 3: Photo Upload

### Test 3A: Drag & Drop
1. Have an image file ready on your desktop (JPG, PNG)
2. Drag the image file over the **[Photo Box]** area
3. The box should change color (blue) when dragging over
4. Drop the image

### Expected Results
- Drag area highlights in blue while dragging
- Photo preview appears in the box
- Image is displayed correctly

### Test 3B: Click to Browse
1. Click on the photo box area
2. A file browser dialog opens
3. Select an image file
4. Click "Open"

### Expected Results
- File dialog opens
- Can select an image
- Photo preview appears immediately

---

## Test Case 4: Switch Tabs

### Steps
1. Click the **"Medical Info"** tab
2. Observe the form change
3. Click the **"Basic Info"** tab
4. Observe the form return to basic info

### Expected Results
- Tab content switches smoothly
- Selected tab has blue underline
- Unselected tab is gray
- All filled data persists when switching tabs
- Can navigate back and forth

### Visual Verification
```
Before Click:          After Click:
Basic  │ Medical       Basic │ Medical
═════  │              ═════ │ ═════════
[Tab is blue]          [Tab is blue]
```

---

## Test Case 5: Medical Info Tab

### Steps
1. Click "Medical Info" tab
2. Fill in the following optional fields:
   - **Blood Type**: Select "O+"
   - **Allergies**: Type "Penicillin"
   - **Medical History**: Type "Hypertension, Diabetes"
   - **Current Medications**: Type "Metformin 500mg"
   - **Insurance Provider**: Type "AIA Insurance"
   - **Insurance ID**: Type "POL123456"

### Step 2: Enter Initial Vitals
3. **Heart Rate**: Type "72"
4. **SpO2**: Type "98"
5. **Blood Pressure**: Type "120/80"
6. **Temperature**: Type "98.6"
7. **Respiratory Rate**: Type "16"
8. **Glucose**: Type "100"
9. **Clinical Notes**: Type "Patient in stable condition"

### Expected Results
- All fields accept input
- Fields are organized in sections
- Vitals section has a gray background
- Numbers and text are properly formatted
- No errors appear

---

## Test Case 6: Form Validation - Error Cases

### Test 6A: Missing First Name
1. Clear the First Name field (if it was filled)
2. Try to submit the form
3. Leave all other required fields filled

### Expected Result
- Form should NOT submit
- Error message appears below First Name field
- Error is in red: "First name is required"

### Test 6B: Invalid Email Format
1. In Email field, type "invalid-email"
2. Try to submit the form

### Expected Result
- Form should NOT submit
- Error message appears below Email field
- Error is in red: "Invalid email"

### Test 6C: Missing Emergency Contact Phone
1. Clear Emergency Contact Phone field
2. Try to submit the form

### Expected Result
- Form should NOT submit
- Error message appears
- Error is in red: "Emergency contact phone is required"

---

## Test Case 7: Error Message Clearing

### Steps
1. Trigger an error (e.g., clear First Name and submit)
2. Error message should appear
3. Start typing in the First Name field

### Expected Results
- Error message clears as soon as you start typing
- No need to click anywhere else
- Field becomes valid again once text is entered

---

## Test Case 8: Form Submission - Valid Data

### Steps
1. **Ensure all required fields are filled:**
   - First Name: "John"
   - Last Name: "Doe"
   - Date of Birth: "1979-12-30"
   - Phone: "+94 23 567 8901"
   - Email: "john.doe@example.com"
   - Emergency Contact Name: "Jane Doe"
   - Emergency Contact Phone: "+94 23 567 8902"

2. **Click the "Add Patient" button**

### Expected Results
- Form validates successfully
- Modal closes automatically
- Patient list reappears
- No error messages
- No console errors

---

## Test Case 9: Verify New Patient in List

### Steps
1. After successful submission, look at the patient list
2. New patient should appear at the top of the list
3. Click on the new patient card

### Expected Results
- New patient "John Doe" appears in list
- Shows correct age (45)
- Shows correct vitals if entered:
  - Heart Rate: 72 bpm
  - Blood Pressure: 120/80
  - SpO2: 98%
- Status shows "Active" (green)
- Can click "Profile" to view full details

### Patient Card Display
```
┌──────────────────────────┐
│  [Photo or Placeholder]  │
│  John Doe        ACTIVE  │
│  Room 302A  Age 45       │
│  HR 72  BP 120/80  O2 98%│
│  Temp 98.6  RR 16  Gluc  │
│  [Profile] [Vitals] [Rx] │
└──────────────────────────┘
```

---

## Test Case 10: Cancel Modal

### Steps
1. Click "+ Add Patient" to open modal
2. Fill some fields (just a few)
3. Click the **"Cancel"** button

### Expected Results
- Modal closes immediately
- No patient is added to list
- Patient list remains unchanged
- Form data is not saved

---

## Test Case 11: Close Modal with X Button

### Steps
1. Click "+ Add Patient" to open modal
2. Fill some fields
3. Click the **"x"** button in top-right corner

### Expected Results
- Modal closes
- Form data is discarded
- No patient added
- Returns to patient list

---

## Test Case 12: Multiple Patients

### Steps
1. Add first patient: "John Doe"
2. Click "+ Add Patient" again
3. Add second patient: "Jane Smith"
4. Add third patient: "Bob Johnson"

### Expected Results
- Each patient added successfully
- All patients appear in list
- New patients appear at top
- Each has unique data
- All data displays correctly

---

## Test Case 13: Room Number Auto-Generation

### Steps
1. Leave Room Number field empty
2. Submit the form with valid data
3. Check the new patient card

### Expected Results
- Patient is still created
- Room number auto-generates (e.g., "Room 123")
- Room is displayed on patient card

---

## Test Case 14: Responsive Design

### Desktop Test
1. View on full desktop screen (1920x1080+)
2. Modal should be centered
3. Multi-column layouts should work

### Tablet Test
1. Resize browser to tablet size (768x1024)
2. Modal should adjust
3. Fields should stack appropriately

### Mobile Test
1. Resize browser to mobile size (375x667)
2. Modal should be readable
3. All fields should be accessible
4. Inputs should be touch-friendly

### Expected Results
- Modal remains readable at all sizes
- Form fields are usable
- No horizontal scrolling needed
- Buttons are touch-friendly

---

## Test Case 15: Dark Theme Consistency

### Steps
1. Open the Add Patient modal
2. Compare colors with Dashboard and Patient List

### Expected Results
- Same dark slate background
- Same text colors
- Consistent button colors (blue for primary)
- Error messages in red
- Input fields styled consistently
- Smooth transitions and animations

---

## Troubleshooting

### Modal Doesn't Open
**Solution**: 
- Check browser console (F12) for JavaScript errors
- Verify PatientsPage.jsx has the import
- Restart dev server with `npm run dev`

### Form Fields Not Accepting Input
**Solution**:
- Check if input fields are disabled
- Clear browser cache (Ctrl+Shift+Delete)
- Check console for errors

### Photo Upload Not Working
**Solution**:
- Verify file format (JPG, PNG, GIF)
- Check file size (should be < 5MB)
- Try drag & drop if click doesn't work

### Validation Not Triggering
**Solution**:
- Check that required fields are actually empty
- Verify email format (must have @)
- Check console for validation function errors

### New Patient Not Appearing
**Solution**:
- Check if patient list is filtered (Status dropdown)
- Scroll up in patient list
- Verify data was actually entered
- Check browser console for errors

---

## Console Checks

### What Should NOT Appear in Console
- No JavaScript errors (red X)
- No warnings about missing props
- No undefined variable errors

### What SHOULD Appear in Console
- Smooth page loads
- No 404 errors
- Component renders

### Check Console
1. Press F12 to open Developer Tools
2. Go to Console tab
3. Add patient and check for errors
4. Should be clean with no errors

---

## Performance Checks

### Modal Opening Speed
- Modal should open instantly (< 100ms)
- No lag when showing

### Form Input Responsiveness
- Typing in fields should be instant
- No delay in character appearance
- Smooth transitions between tabs

### Photo Upload Speed
- Drag & drop should be instant
- File selection dialog should open quickly
- Photo preview should appear immediately

---

## Accessibility Checks

### Keyboard Navigation
1. Press Tab to move between fields
2. Each field should be reachable
3. Form should be submittable with Tab + Enter

### Color Contrast
1. Check that text is readable
2. Error messages in red should be visible
3. Buttons should be clearly visible

### Screen Reader (Optional)
- Form labels should be semantic
- Error messages should be announced
- Modal should have proper ARIA attributes

---

## Final Verification Checklist

- [ ] Modal opens with + button
- [ ] Can fill all required fields
- [ ] Age auto-calculates correctly
- [ ] Photo upload works (drag & drop)
- [ ] Can switch between tabs
- [ ] Can fill medical info
- [ ] Validation shows errors for missing fields
- [ ] Validation shows error for invalid email
- [ ] Errors clear when typing
- [ ] Form submits with valid data
- [ ] Modal closes after submission
- [ ] New patient appears in list
- [ ] New patient displays correct data
- [ ] Can cancel without saving
- [ ] Can close with X button
- [ ] Works on desktop/tablet/mobile
- [ ] Dark theme is consistent
- [ ] No console errors
- [ ] Navigation works after adding patient
- [ ] Can add multiple patients

---

## Expected Duration
- Each test case: 2-3 minutes
- Complete test suite: 30-40 minutes
- Quick smoke test: 5 minutes

---

## Test Report Template

```
ADD PATIENT FEATURE - TEST REPORT
=================================

Date: [Date]
Tester: [Name]
Browser: [Chrome/Firefox/Safari]
Resolution: [Desktop/Tablet/Mobile]

Test Cases Passed: __ / 15
Test Cases Failed: __ / 15

Issues Found:
1. [Issue description]
2. [Issue description]

Notes:
[Any additional notes]

Status: PASS / FAIL
```

---

## Success Criteria

- All test cases pass
- No console errors
- Form validation works
- Photo upload works
- New patient appears in list
- Responsive design works
- Consistent with design theme

**If all criteria are met: Feature is READY FOR PRODUCTION**
