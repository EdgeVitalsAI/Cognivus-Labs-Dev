# Quick Test Guide - Filter & Sort Feature

## 🚀 Getting Started

### Step 1: Access the Application
1. Open browser: `http://localhost:3000/doctor/login`
2. Login with credentials:
   - **Username**: `admin`
   - **Password**: `admin123`

### Step 2: Navigate to Patients
- Click on "Patients" in the sidebar or go directly to: `http://localhost:3000/doctor/patients`

---

## 📋 Test Cases

### Test 1: Filter by Status
**Expected**: Only patients with selected status appear

```
Status: Critical Condition
Expected: 3 patients (Wathsala, Wooshan, Rivindu)
```

```
Status: Under Observation  
Expected: 2 patients (Robert, Lakindu)
```

```
Status: Active/Admitted
Expected: 3 patients (Ben, Emma, Michael)
```

### Test 2: Filter by Department
**Expected**: Only patients from selected department appear

```
Department: Cardiology
Expected: 2 patients (Wathsala, Robert)
```

```
Department: Emergency
Expected: 2 patients (Wooshan, Emma)
```

```
Department: Surgery
Expected: 2 patients (Lakindu, Michael)
```

### Test 3: Combine Filters
**Expected**: Show intersection of all filters

```
Status: Critical + Department: Cardiology
Expected: 1 patient (Wathsala)
```

```
Status: Critical + Department: Emergency
Expected: 1 patient (Wooshan)
```

```
Status: Stable + Department: Surgery
Expected: 1 patient (Michael)
```

### Test 4: Sort by Recent
**Expected**: Patients ordered by admission date (newest first)

```
Sort: Recent (default)
Expected Order:
1. Rivindu Ashinsa (today)
2. Wooshan Gamage (1 day ago)
3. Wathsala Dewmina (2 days ago)
4. Lakindu Minosha (3 days ago)
5. Robert Key (5 days ago)
6. Ben Southern (7 days ago)
7. Emma Davis (10 days ago)
8. Michael Johnson (15 days ago)
```

### Test 5: Sort by Name (A-Z)
**Expected**: Alphabetical order ascending

```
Sort: Name (A-Z)
Expected Order:
1. Ben Southern
2. Emma Davis
3. Lakindu Minosha
4. Michael Johnson
5. Rivindu Ashinsa
6. Robert Key
7. Wathsala Dewmina
8. Wooshan Gamage
```

### Test 6: Sort by Name (Z-A)
**Expected**: Alphabetical order descending

```
Sort: Name (Z-A)
Expected Order:
1. Wooshan Gamage
2. Wathsala Dewmina
3. Robert Key
4. Rivindu Ashinsa
5. Michael Johnson
6. Lakindu Minosha
7. Emma Davis
8. Ben Southern
```

### Test 7: Sort by Room Number
**Expected**: Numerical room order

```
Sort: Room Number
Expected Order:
1. Wooshan (Room 108C)
2. Robert (Room 152B)
3. Emma (Room 250A)
4. Wathsala (Room 302A)
5. Ben (Room 311B)
6. Michael (Room 410C)
7. Lakindu (Ward 1 10C)
8. Rivindu (Ward 3 2A)
```

### Test 8: Sort by Critical First
**Expected**: CRITICAL → WARNING → STABLE

```
Sort: Critical First
Expected Order:
1. Wathsala Dewmina (CRITICAL)
2. Wooshan Gamage (CRITICAL)
3. Rivindu Ashinsa (CRITICAL)
4. Robert Key (WARNING)
5. Lakindu Minosha (WARNING)
6. Ben Southern (STABLE)
7. Emma Davis (STABLE)
8. Michael Johnson (STABLE)
```

### Test 9: Search Functionality
**Expected**: Filter by name or room (case-insensitive)

```
Search: "Wath"
Expected: 1 patient (Wathsala Dewmina)
```

```
Search: "Room 302"
Expected: 1 patient (Wathsala in Room 302A)
```

```
Search: "ward"
Expected: 2 patients (Lakindu in Ward 1, Rivindu in Ward 3)
```

### Test 10: Combined Search + Filters + Sort
**Expected**: All filters applied together

```
Search: "Emerg" + 
Department: Emergency + 
Status: All + 
Sort: Recent
Expected: 2 patients (Wooshan, Emma) sorted by admission date
```

```
Search: "" + 
Department: Cardiology + 
Status: Critical + 
Sort: Name (A-Z)
Expected: 1 patient (Wathsala)
```

### Test 11: Add Patient Modal
**Expected**: Modal opens and can add new patient

```
1. Click "Add Patient" button
2. Fill form with sample data:
   - Name: Test Patient
   - Room: Room 500A
   - Age: 35
   - Department: Surgery
   - Status: Stable
3. Click "Add Patient"
4. Verify patient appears in list
```

### Test 12: No Results Handling
**Expected**: Shows "No patients found" message

```
Search: "xyzabc123"
Expected: Empty state with message "No patients found"
```

```
Department: Other
Expected: Empty state with message "No patients found"
```

---

## 🔍 Visual Verification Checklist

- [ ] Filter bar shows 4 dropdowns (Search, Status, Department, Sort)
- [ ] Status dropdown shows: "Status: All", "Critical Condition", "Under Observation", "Active/Admitted"
- [ ] Department dropdown shows: "Department: All", plus 6 department options
- [ ] Sort dropdown shows: "Sort: Recent", plus 4 sort options
- [ ] Patient cards display correctly with department info
- [ ] Stats bar shows total patients: 8
- [ ] Critical count: 3
- [ ] Warning count: 2
- [ ] Stable count: 3
- [ ] Patient photos load (placeholder images)
- [ ] All vital signs display correctly
- [ ] Status badges show correct colors:
  - Red for CRITICAL
  - Amber for WARNING
  - Green for STABLE

---

## 🛠️ Troubleshooting

### Issue: Filters not working
**Solution**: 
- Check browser console (F12) for errors
- Clear browser cache (Ctrl+Shift+Del)
- Restart dev server: `npm run dev`

### Issue: Patients not displaying
**Solution**:
- Verify logged in as admin/admin123
- Check that `/doctor/patients` route is accessible
- Check browser console for network errors

### Issue: Sort not changing order
**Solution**:
- Verify sort dropdown value changes
- Check that patients have `addedDate` field
- Try different sort option to confirm functionality

### Issue: Combined filters return no results
**Solution**:
- This is expected if no patients match all criteria
- Try removing one filter to expand results
- Check "No patients found" message displays

---

## 📊 Patient Data Reference

### All 8 Patients

| Name | Room | Status | Department | Age |
|------|------|--------|------------|-----|
| Wathsala Dewmina | Room 302A | CRITICAL | Cardiology | 20 |
| Wooshan Gamage | Room 108C | CRITICAL | Emergency | 17 |
| Rivindu Ashinsa | Ward 3 2A | CRITICAL | ICU | 19 |
| Robert Key | Room 152B | WARNING | Cardiology | 45 |
| Lakindu Minosha | Ward 1 10C | WARNING | Surgery | 32 |
| Ben Southern | Room 311B | STABLE | Pediatrics | 52 |
| Emma Davis | Room 250A | STABLE | Emergency | 28 |
| Michael Johnson | Room 410C | STABLE | Surgery | 58 |

---

## ✅ Final Verification

Run through this complete flow:

1. **Login**: admin / admin123 ✓
2. **Navigate to Patients** ✓
3. **See all 8 patients** ✓
4. **Filter by Status: Critical** → See 3 patients ✓
5. **Add Department: Cardiology filter** → See 1 patient (Wathsala) ✓
6. **Sort by Name A-Z** → Verify order ✓
7. **Clear filters (all: All)** → See all 8 patients ✓
8. **Search for "Robert"** → See 1 patient ✓
9. **Click patient card** → Navigate to detail page ✓
10. **Return to patients** → All features still work ✓

---

## 📞 Support

If you encounter any issues:
1. Check the browser console for error messages
2. Review the FILTER_SORT_IMPLEMENTATION.md document
3. Verify all dependencies are installed: `npm install`
4. Restart the dev server: `npm run dev`

**Status**: ✅ All features implemented and ready for testing  
**Last Updated**: 2024
