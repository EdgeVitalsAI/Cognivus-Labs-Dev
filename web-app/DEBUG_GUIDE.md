# Debug Guide - Login Issues

This guide will help you debug login issues, especially the staff login redirect and error message problems.

## Quick Checks

### 1. Check if Backend is Running

Open http://localhost:8000 in your browser. You should see:
```json
{
  "message": "Cognivus Health Monitoring System API",
  "version": "1.0.0",
  "status": "active"
}
```

If you see an error or can't connect:
```bash
cd web-app/backend
docker-compose ps  # Check if services are running
docker-compose logs backend  # Check for errors
```

### 2. Check if Database is Initialized

```bash
cd web-app/backend
docker-compose exec postgres psql -U cognivus_user -d cognivus_auth -c "SELECT email, role, is_active FROM users;"
```

You should see:
```
          email            |  role  | is_active
---------------------------+--------+-----------
 doctor@cognivuslabs.com   | doctor | t
 staff@cognivuslabs.com    | staff  | t
```

If users are missing:
```bash
docker-compose exec backend python init_db.py
```

### 3. Check Browser Console

Open browser DevTools (F12) > Console tab. Look for errors when trying to login.

## Common Issues & Solutions

### Issue 1: "[object Object]" Error Message

**Symptoms:** Error message shows "[object Object]" instead of readable text

**Debug Steps:**

1. Open browser console (F12)
2. Try to login with wrong credentials
3. Look for these console messages:
   ```
   Attempting staff login with: {email: "..."}
   Staff login error details: {...}
   ```

4. Check what the actual error message is

**Solution:** This has been fixed in the latest code. Clear your browser cache and hard refresh (Ctrl+Shift+R or Cmd+Shift+R).

---

### Issue 2: Staff Login Redirects Back to Login Page

**Symptoms:** After entering correct staff credentials, page redirects back to `/staff/login`

**Debug Steps:**

1. Clear browser localStorage:
   - Open DevTools (F12) > Application > Local Storage
   - Right-click on http://localhost:3000 > Clear

2. Try staff login again with console open (F12)

3. Check console logs for:
   ```
   Attempting staff login with: ...
   Staff login response: ...
   Tokens stored successfully. Role: ...
   Stored user_role: ...
   ProtectedRoute - Required role: staff
   ProtectedRoute - User role: ...
   ```

4. If you see "User role: null" or wrong role, there's a token storage issue

5. If you see "Not authenticated", the token isn't being stored properly

**Possible Causes:**

**A) Backend Not Running**
```bash
docker-compose -f web-app/backend/docker-compose.yml ps
```
If backend is not running:
```bash
docker-compose -f web-app/backend/docker-compose.yml up -d
```

**B) CORS Error**
Check browser console for CORS errors like:
```
Access to XMLHttpRequest at 'http://localhost:8000/api/auth/staff/login'
from origin 'http://localhost:3000' has been blocked by CORS policy
```

Fix: Check backend .env has:
```env
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

Restart backend:
```bash
docker-compose restart backend
```

**C) Database Connection Issue**
Check backend logs:
```bash
docker-compose logs backend | grep -i error
```

If you see PostgreSQL connection errors:
```bash
docker-compose down
docker-compose up -d
```

**D) Staff User Doesn't Exist**
```bash
docker-compose exec backend python manage_users.py
# Choose option 2 to list all users
# If staff user is missing, choose option 1 to add new user
```

**E) Wrong Email Format**
Make sure you're using the EMAIL, not username:
- ❌ Wrong: `staff` or `admin`
- ✅ Correct: `staff@cognivuslabs.com`

---

### Issue 3: Network Request Fails

**Symptoms:** Login button loads forever or fails silently

**Debug Steps:**

1. Open DevTools (F12) > Network tab
2. Try to login
3. Look for request to `http://localhost:8000/api/auth/staff/login`

**If no request appears:**
- Frontend issue - check browser console for JavaScript errors

**If request appears but fails:**

Check the response:
- **Status 401:** Wrong credentials
- **Status 403:** Account is inactive
- **Status 500:** Backend error
- **Status 0 or CORS error:** Backend not accessible or CORS misconfigured

---

## Step-by-Step Debugging: Staff Login

Follow these steps exactly:

### Step 1: Verify Backend

```bash
# Check backend is running
curl http://localhost:8000/health
# Should return: {"status":"healthy"}

# Check staff login endpoint
curl -X POST http://localhost:8000/api/auth/staff/login \
  -H "Content-Type: application/json" \
  -d '{"email":"staff@cognivuslabs.com","password":"staff123"}'
```

Expected response:
```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "token_type": "bearer",
  "user": {
    "id": 2,
    "email": "staff@cognivuslabs.com",
    "full_name": "Michael Chen",
    "role": "staff",
    ...
  }
}
```

If you get an error, the backend has an issue.

### Step 2: Verify Frontend

1. Open http://localhost:3000/staff/login
2. Open DevTools (F12) > Console
3. Clear localStorage: Application > Local Storage > Clear
4. Enter credentials:
   - Email: `staff@cognivuslabs.com`
   - Password: `staff123`
5. Click "Sign in"

Watch console for these logs (in order):
```
1. Attempting staff login with: {email: "staff@cognivuslabs.com"}
2. Staff login response: {access_token: "...", refresh_token: "...", user: {...}}
3. Tokens stored successfully. Role: staff
4. Staff login successful: {...}
5. Stored user_role: staff
6. Stored access_token: eyJ...
7. ProtectedRoute - Required role: staff
8. ProtectedRoute - User authenticated: true
9. ProtectedRoute - User role: staff
10. ProtectedRoute - Access granted
```

**If it stops at step 1:**
- Request didn't reach backend
- Check Network tab for errors
- Backend might not be running

**If it stops at step 2:**
- Backend returned an error
- Check the error details in console
- Verify credentials are correct

**If it reaches step 3 but redirects to login:**
- ProtectedRoute is rejecting access
- Check logs 7-9 to see why
- Might be a timing issue with localStorage

### Step 3: Manual Token Test

If login seems to work but redirects:

1. Login as staff
2. Before it redirects, quickly open DevTools > Application > Local Storage
3. Check these keys exist:
   - `access_token` (should be a long JWT string)
   - `refresh_token` (should be a long JWT string)
   - `user_role` (should be exactly "staff")
   - `user_data` (should be a JSON object)

4. If `user_role` is not "staff", there's a bug in authService
5. If tokens are missing, they're not being saved properly

---

## Reset Everything

If nothing works, do a complete reset:

```bash
# 1. Stop all services
cd web-app/backend
docker-compose down -v  # WARNING: This deletes the database!

# 2. Clear frontend cache
# In browser: Ctrl+Shift+Delete > Clear cache and localStorage

# 3. Restart backend
docker-compose up -d

# 4. Wait for services to be ready
docker-compose logs -f backend
# Wait for: "Database initialization completed successfully!"

# 5. Verify users exist
docker-compose exec backend python manage_users.py
# Choose option 2 to list users

# 6. Restart frontend
cd ../frontend
# Stop the dev server (Ctrl+C)
npm run dev

# 7. Test login
# Open http://localhost:3000/staff/login
# Use: staff@cognivuslabs.com / staff123
```

---

## Still Not Working?

If you've tried everything above and it still doesn't work:

1. **Collect Debug Info:**

```bash
# Backend status
docker-compose ps

# Backend logs
docker-compose logs backend > backend-logs.txt

# Database users
docker-compose exec postgres psql -U cognivus_user -d cognivus_auth -c "SELECT * FROM users;" > users.txt
```

2. **Check Browser Console:**
   - F12 > Console tab
   - Try to login
   - Copy all error messages

3. **Check Network Tab:**
   - F12 > Network tab
   - Try to login
   - Look for the POST request to `/api/auth/staff/login`
   - Check the response

4. **Verify .env Configuration:**

```bash
cat web-app/backend/.env
```

Should have:
```
POSTGRES_HOST=postgres  # For Docker
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

---

## Quick Test: Does Doctor Login Work?

If doctor login works but staff doesn't, the issue is specific to staff authentication:

1. Login as doctor: `doctor@cognivuslabs.com` / `doctor123`
2. If this works, backend is fine
3. The issue is either:
   - Staff user doesn't exist in database
   - Staff credentials are wrong
   - There's a bug in the staff login flow

Check database:
```bash
docker-compose exec postgres psql -U cognivus_user -d cognivus_auth -c "SELECT email, role FROM users WHERE role='staff';"
```

If no results, staff user is missing. Add it:
```bash
docker-compose exec backend python manage_users.py
# Choose option 1, then option 2 for Staff
# Email: staff@cognivuslabs.com
# Name: Michael Chen
# Password: staff123
# Department: Patient Care
# Employee ID: EMP-2024-001
```

---

## Contact for Help

If you're still stuck, provide:
1. Browser console logs (full output)
2. Backend logs (`docker-compose logs backend`)
3. Output of: `docker-compose exec postgres psql -U cognivus_user -d cognivus_auth -c "SELECT email, role, is_active FROM users;"`
4. Screenshot of Network tab showing the failed request

---

**Good luck! The debug logging added should help identify the exact issue.**
