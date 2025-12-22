**Backend:**
```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
source venv/bin/activate       # Mac/Linux
pip install -r requirements.txt
python init_db.py
python run.py
```

**Frontend (in new terminal):**
```bash
cd frontend
npm install
npm run dev
```

**URLs:**
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000`
- API Docs: `http://localhost:8000/docs`

## Demo Credentials

### Doctor Portal
- URL: `http://localhost:3000/doctor/login`
- Email: `doctor@cognivuslabs.com`
- Password: `doctor123`

### Staff Portal
- URL: `http://localhost:3000/staff/login`
- Email: `staff@cognivuslabs.com`
- Password: `staff123`