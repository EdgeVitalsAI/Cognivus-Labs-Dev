import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Briefcase, Key, Save, Camera } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import { authService } from '../services/api';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

const ProfileSettingsPage = () => {
    const navigate = useNavigate();
    const [user] = useState(authService.getCurrentUser());
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [profileImage, setProfileImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [profileData, setProfileData] = useState({
        full_name: '',
        email: '',
        phone: '',
        specialty: '',
        license_number: '',
        department: '',
        employee_id: '',
        role: ''
    });

    const [passwordData, setPasswordData] = useState({
        current_password: '',
        new_password: '',
        confirm_password: ''
    });

    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('access_token');
            const response = await axios.get(`${API_BASE_URL}/profile/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            setProfileData({
                full_name: response.data.full_name || '',
                email: response.data.email || '',
                phone: response.data.phone || '',
                specialty: response.data.specialty || '',
                license_number: response.data.license_number || '',
                department: response.data.department || '',
                employee_id: response.data.employee_id || '',
                role: response.data.role || ''
            });
        } catch (err) {
            console.error('Failed to fetch profile:', err);
            setMessage({ type: 'error', text: 'Failed to load profile data' });
        } finally {
            setLoading(false);
        }
    };

    const handleProfileChange = (e) => {
        const { name, value } = e.target;
        setProfileData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setProfileImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            const token = localStorage.getItem('access_token');
            await axios.patch(`${API_BASE_URL}/profile/me`, profileData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            setMessage({ type: 'success', text: 'Profile updated successfully!' });
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        } catch (err) {
            console.error('Failed to update profile:', err);
            setMessage({
                type: 'error',
                text: err.response?.data?.detail || 'Failed to update profile'
            });
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();

        if (passwordData.new_password !== passwordData.confirm_password) {
            setMessage({ type: 'error', text: 'New passwords do not match' });
            return;
        }

        if (passwordData.new_password.length < 6) {
            setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
            return;
        }

        try {
            setSaving(true);
            const token = localStorage.getItem('access_token');
            await axios.post(
                `${API_BASE_URL}/profile/change-password`,
                {
                    current_password: passwordData.current_password,
                    new_password: passwordData.new_password
                },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            setMessage({ type: 'success', text: 'Password changed successfully!' });
            setPasswordData({
                current_password: '',
                new_password: '',
                confirm_password: ''
            });
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        } catch (err) {
            console.error('Failed to change password:', err);
            setMessage({
                type: 'error',
                text: err.response?.data?.detail || 'Failed to change password'
            });
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = () => {
        authService.logout();
        navigate('/doctor/login');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 text-slate-200 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div>
                <p className="ml-4 text-slate-400">Loading profile...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200">
            <TopBar userName={`Dr. ${user?.full_name || 'Loading...'}`} />

            <div className="flex">
                <Sidebar onLogout={handleLogout} />

                <main className="flex-1 p-6">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-white mb-2">Profile Settings</h1>
                        <p className="text-slate-400">Manage your account information and security</p>
                    </div>

                    {/* Message Display */}
                    {message.text && (
                        <div className={`mb-6 p-4 rounded-lg border ${
                            message.type === 'success'
                                ? 'bg-emerald-900/20 border-emerald-700 text-emerald-400'
                                : 'bg-red-900/20 border-red-700 text-red-400'
                        }`}>
                            {message.text}
                        </div>
                    )}

                    {/* Profile Image Upload */}
                    <div className="bg-slate-900 border border-slate-700 rounded-lg p-6 mb-6">
                        <h2 className="text-xl font-bold text-white mb-4">Profile Picture</h2>
                        <div className="flex items-center gap-6">
                            <div className="relative">
                                <div className="w-24 h-24 rounded-full bg-slate-700 overflow-hidden flex items-center justify-center">
                                    {imagePreview ? (
                                        <img src={imagePreview} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <User className="w-12 h-12 text-slate-400" />
                                    )}
                                </div>
                                <label
                                    htmlFor="profile-image"
                                    className="absolute bottom-0 right-0 w-8 h-8 bg-sky-600 hover:bg-sky-500 rounded-full flex items-center justify-center cursor-pointer transition-colors"
                                >
                                    <Camera className="w-4 h-4 text-white" />
                                </label>
                                <input
                                    id="profile-image"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="hidden"
                                />
                            </div>
                            <div>
                                <p className="text-sm text-slate-300 mb-1">Upload a new profile picture</p>
                                <p className="text-xs text-slate-500">JPG, PNG or GIF. Max size 2MB</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Profile Information */}
                        <div className="bg-slate-900 border border-slate-700 rounded-lg p-6">
                            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                <User className="w-6 h-6" />
                                Profile Information
                            </h2>

                            <form onSubmit={handleSaveProfile} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Full Name
                                    </label>
                                    <input
                                        type="text"
                                        name="full_name"
                                        value={profileData.full_name}
                                        onChange={handleProfileChange}
                                        className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-sky-500"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={profileData.email}
                                        onChange={handleProfileChange}
                                        className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-sky-500"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Phone
                                    </label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={profileData.phone}
                                        onChange={handleProfileChange}
                                        className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-sky-500"
                                    />
                                </div>

                                {profileData.role === 'DOCTOR' && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                                Specialty
                                            </label>
                                            <input
                                                type="text"
                                                name="specialty"
                                                value={profileData.specialty}
                                                onChange={handleProfileChange}
                                                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-sky-500"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                                License Number
                                            </label>
                                            <input
                                                type="text"
                                                name="license_number"
                                                value={profileData.license_number}
                                                onChange={handleProfileChange}
                                                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-sky-500"
                                            />
                                        </div>
                                    </>
                                )}

                                {profileData.role === 'STAFF' && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                                Department
                                            </label>
                                            <input
                                                type="text"
                                                name="department"
                                                value={profileData.department}
                                                onChange={handleProfileChange}
                                                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-sky-500"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                                Employee ID
                                            </label>
                                            <input
                                                type="text"
                                                name="employee_id"
                                                value={profileData.employee_id}
                                                onChange={handleProfileChange}
                                                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-sky-500"
                                            />
                                        </div>
                                    </>
                                )}

                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="w-full px-6 py-3 bg-sky-600 hover:bg-sky-500 text-white rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Save className="w-5 h-5" />
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </form>
                        </div>

                        {/* Change Password */}
                        <div className="bg-slate-900 border border-slate-700 rounded-lg p-6">
                            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                <Key className="w-6 h-6" />
                                Change Password
                            </h2>

                            <form onSubmit={handleChangePassword} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Current Password
                                    </label>
                                    <input
                                        type="password"
                                        name="current_password"
                                        value={passwordData.current_password}
                                        onChange={handlePasswordChange}
                                        className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-sky-500"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        New Password
                                    </label>
                                    <input
                                        type="password"
                                        name="new_password"
                                        value={passwordData.new_password}
                                        onChange={handlePasswordChange}
                                        className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-sky-500"
                                        required
                                        minLength={6}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Confirm New Password
                                    </label>
                                    <input
                                        type="password"
                                        name="confirm_password"
                                        value={passwordData.confirm_password}
                                        onChange={handlePasswordChange}
                                        className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-sky-500"
                                        required
                                        minLength={6}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="w-full px-6 py-3 bg-sky-600 hover:bg-sky-500 text-white rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Key className="w-5 h-5" />
                                    {saving ? 'Changing...' : 'Change Password'}
                                </button>
                            </form>

                            <div className="mt-6 p-4 bg-slate-800 rounded-lg border border-slate-700">
                                <h3 className="text-sm font-medium text-slate-300 mb-2">Password Requirements:</h3>
                                <ul className="text-sm text-slate-400 space-y-1">
                                    <li>• Minimum 6 characters</li>
                                    <li>• Use a strong, unique password</li>
                                    <li>• Don't share your password</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Role Information */}
                    <div className="mt-6 bg-slate-900 border border-slate-700 rounded-lg p-6">
                        <h2 className="text-xl font-bold text-white mb-4">Account Information</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-slate-400">Role:</span>
                                <span className="ml-2 text-white font-medium">
                                    {profileData.role === 'DOCTOR' ? 'Doctor' : 'Staff'}
                                </span>
                            </div>
                            <div>
                                <span className="text-slate-400">Account Status:</span>
                                <span className="ml-2 text-emerald-400 font-medium">Active</span>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default ProfileSettingsPage;
