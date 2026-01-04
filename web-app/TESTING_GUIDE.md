# Testing Guide - Cognivus Health Monitoring System

Complete testing guide to verify all authentication and routing functionality.

## Prerequisites

Before testing, ensure:
- ✅ Backend is running on http://localhost:8000
- ✅ Frontend is running on http://localhost:3000
- ✅ PostgreSQL database is initialized with demo users

## Quick Setup

```bash
# Terminal 1 - Start Backend
cd web-app/backend
docker-compose up -d

# Terminal 2 - Start Frontend
cd web-app/frontend
npm install
npm run dev
```

## Test Cases

### 1. Doctor Login Flow

**Test:** Doctor can login and access doctor dashboard

1. Open browser to http://localhost:3000
2. Should redirect to http://localhost:3000/doctor/login
3. Enter credentials:
   - Email: `doctor@cognivuslabs.com`
   - Password: `doctor123`
4. Click "Sign in"
5. Should redirect to http://localhost:3000/doctor/dashboard
6. TopBar should show "Sarah Anderson" (not "Dr. Sam")
7. Sidebar should show Doctor menu items:
   - Dashboard
   - Patients
   - Prescriptions
   - AI Insights
   - Telemedicine
   - Notes & Reports
   - Devices

**Expected Result:** ✅ Doctor successfully logged in and can see doctor dashboard

---

### 2. Staff Login Flow

**Test:** Staff can login and access staff dashboard

1. Open new browser window (or logout first)
2. Navigate to http://localhost:3000/staff/login
3. Enter credentials:
   - Email: `staff@cognivuslabs.com`
   - Password: `staff123`
4. Click "Sign in"
5. Should redirect to http://localhost:3000/staff/dashboard
6. TopBar should show "Michael Chen"
7. Sidebar should show Staff menu items:
   - Dashboard
   - Tasks
   - Patients
   - Inventory
   - Incidents
   - Communication
   - Notes
   - Settings

**Expected Result:** ✅ Staff successfully logged in and can see staff dashboard

---

### 3. Wrong Credentials Test

**Test:** Invalid credentials are rejected

1. Navigate to http://localhost:3000/doctor/login
2. Enter wrong credentials:
   - Email: `wrong@email.com`
   - Password: `wrongpassword`
3. Click "Sign in"
4. Should see error message: "Invalid credentials" or similar
5. Should stay on login page

**Expected Result:** ✅ Login rejected with error message

---

### 4. Role-Based Access Control

**Test:** Doctor cannot access staff routes

1. Login as doctor (use doctor credentials)
2. Manually navigate to http://localhost:3000/staff/dashboard
3. Should automatically redirect to http://localhost:3000/doctor/dashboard

**Expected Result:** ✅ Doctor redirected to doctor dashboard

---

**Test:** Staff cannot access doctor routes

1. Login as staff (use staff credentials)
2. Manually navigate to http://localhost:3000/doctor/patients
3. Should automatically redirect to http://localhost:3000/staff/dashboard

**Expected Result:** ✅ Staff redirected to staff dashboard

---

### 5. Protected Routes Test

**Test:** Unauthenticated users cannot access protected pages

1. Open browser in incognito/private mode
2. Navigate directly to http://localhost:3000/doctor/dashboard
3. Should redirect to http://localhost:3000/doctor/login
4. Navigate to http://localhost:3000/staff/dashboard
5. Should redirect to http://localhost:3000/staff/login

**Expected Result:** ✅ Redirected to login page

---

### 6. Token Storage Test

**Test:** Tokens are properly stored

1. Login as doctor
2. Open browser DevTools > Application > Local Storage
3. Verify the following keys exist:
   - `access_token` - JWT token string
   - `refresh_token` - JWT token string
   - `user_role` - "doctor"
   - `user_data` - JSON object with user info

**Expected Result:** ✅ All tokens properly stored

---

### 7. Logout Test

**Test:** Logout clears tokens and redirects

1. Login as doctor
2. Find logout button in sidebar
3. Click logout
4. Should clear all tokens from localStorage
5. Should redirect to http://localhost:3000/doctor/login
6. Verify localStorage is cleared (DevTools > Application > Local Storage)

**Expected Result:** ✅ Logged out successfully

---

### 8. Token Refresh Test

**Test:** Access token refreshes automatically

1. Login as doctor
2. Open DevTools > Application > Local Storage
3. Copy the `access_token` value
4. Wait for token to expire (30 minutes) OR manually modify the token in localStorage to an expired one
5. Navigate to any protected page (e.g., /doctor/patients)
6. The app should automatically use refresh_token to get a new access_token
7. Check localStorage - `access_token` should be different (new token)

**Note:** This test requires waiting or manually setting an expired token.

**Expected Result:** ✅ Token automatically refreshed

---

### 9. Navigation Test - Doctor

**Test:** All doctor navigation links work

1. Login as doctor
2. Click each sidebar item:
   - Dashboard → http://localhost:3000/doctor/dashboard
   - Patients → http://localhost:3000/doctor/patients
   - Prescriptions → http://localhost:3000/doctor/prescriptions
   - AI Insights → http://localhost:3000/doctor/ai-insights
   - Telemedicine → http://localhost:3000/doctor/telemedicine
   - Notes & Reports → http://localhost:3000/doctor/notes-reports
   - Devices → http://localhost:3000/doctor/devices

**Expected Result:** ✅ All pages load correctly

---

### 10. Navigation Test - Staff

**Test:** All staff navigation links work

1. Login as staff
2. Click each sidebar item:
   - Dashboard → http://localhost:3000/staff/dashboard
   - Tasks → http://localhost:3000/staff/tasks
   - Patients → http://localhost:3000/staff/patients
   - Inventory → http://localhost:3000/staff/inventory
   - Incidents → http://localhost:3000/staff/incidents
   - Communication → http://localhost:3000/staff/communication
   - Notes → http://localhost:3000/staff/notes
   - Settings → http://localhost:3000/staff/settings

**Expected Result:** ✅ All pages load correctly

---

### 11. API Integration Test

**Test:** Backend API is properly connected

1. Open DevTools > Network tab
2. Login as doctor
3. Check Network tab for:
   - POST request to http://localhost:8000/api/auth/doctor/login
   - Response status: 200 OK
   - Response body contains:
     ```json
     {
       "access_token": "eyJ...",
       "refresh_token": "eyJ...",
       "token_type": "bearer",
       "user": {
         "email": "doctor@cognivuslabs.com",
         "full_name": "Sarah Anderson",
         "role": "doctor",
         ...
       }
     }
     ```

**Expected Result:** ✅ API call successful with proper response

---

### 12. Backend Health Check

**Test:** Backend is running and healthy

1. Open http://localhost:8000 in browser
2. Should see JSON response:
   ```json
   {
     "message": "Cognivus Health Monitoring System API",
     "version": "1.0.0",
     "status": "active"
   }
   ```

3. Open http://localhost:8000/health
4. Should see: `{"status": "healthy"}`

5. Open http://localhost:8000/docs
6. Should see FastAPI Swagger documentation

**Expected Result:** ✅ Backend API responding correctly

---

### 13. Database Connection Test

**Test:** Database is properly connected

Using Docker:
```bash
docker-compose -f web-app/backend/docker-compose.yml exec postgres psql -U cognivus_user -d cognivus_auth

# Run SQL query
SELECT email, full_name, role, is_active FROM users;
```

Should see:
```
            email            |   full_name    | role   | is_active
-----------------------------+----------------+--------+-----------
 doctor@cognivuslabs.com     | Sarah Anderson | doctor | t
 staff@cognivuslabs.com      | Michael Chen   | staff  | t
```

**Expected Result:** ✅ Demo users exist in database

---

## Common Issues & Solutions

### Issue: "Cannot connect to backend"
**Solution:**
```bash
cd web-app/backend
docker-compose ps  # Check if backend is running
docker-compose logs backend  # Check for errors
docker-compose restart backend
```

### Issue: "Invalid credentials"
**Solution:**
- Verify you're using correct email (not username)
- Check credentials in `web-app/CREDENTIALS.txt`
- Ensure database is initialized: `docker-compose exec backend python init_db.py`

### Issue: "Staff login redirects to doctor login"
**Solution:**
- Clear browser localStorage (DevTools > Application > Local Storage > Clear All)
- Ensure you're logging in at `/staff/login` not `/doctor/login`
- Check browser console for errors

### Issue: "Page keeps redirecting"
**Solution:**
- Clear browser cache and localStorage
- Check browser console for JavaScript errors
- Ensure backend is running

### Issue: "Token expired immediately"
**Solution:**
- Check system time is correct
- Verify .env configuration:
  ```
  ACCESS_TOKEN_EXPIRE_MINUTES=30
  REFRESH_TOKEN_EXPIRE_DAYS=7
  ```

---

## Test Checklist

Use this checklist to verify all functionality:

- [ ] Backend API is running (http://localhost:8000)
- [ ] Frontend is running (http://localhost:3000)
- [ ] Database has demo users
- [ ] Doctor login works
- [ ] Doctor can access all doctor pages
- [ ] Doctor cannot access staff pages
- [ ] Staff login works
- [ ] Staff can access all staff pages
- [ ] Staff cannot access doctor pages
- [ ] Wrong credentials are rejected
- [ ] Unauthenticated users are redirected to login
- [ ] Tokens are stored in localStorage
- [ ] User name displays correctly in TopBar
- [ ] Logout works and clears tokens
- [ ] All navigation links work
- [ ] No demo credentials shown on login pages
- [ ] API calls work (check Network tab)

---

## Manual Token Inspection

To verify JWT tokens are properly formatted:

1. Login and copy `access_token` from localStorage
2. Visit https://jwt.io
3. Paste token in "Encoded" field
4. Verify payload contains:
   ```json
   {
     "sub": "doctor@cognivuslabs.com",
     "role": "doctor",
     "exp": <timestamp>,
     "iat": <timestamp>,
     "type": "access"
   }
   ```

---

## Success Criteria

All tests must pass for the system to be considered working correctly:

✅ Both doctor and staff can login with correct credentials
✅ Invalid credentials are rejected
✅ Role-based access control works (no cross-access)
✅ Protected routes redirect unauthenticated users
✅ Tokens stored properly with refresh mechanism
✅ Navigation works for both roles
✅ Backend API integration functional
✅ User data displays correctly
✅ Logout clears session properly

---

## Next Steps After Testing

If all tests pass:
1. Create production users with `manage_users.py`
2. Update `.env` for production (change secrets, passwords)
3. Deploy backend and frontend
4. Set up SSL/HTTPS
5. Configure production CORS origins

---

**Testing completed successfully? Congratulations! Your system is ready for development/production use.**
