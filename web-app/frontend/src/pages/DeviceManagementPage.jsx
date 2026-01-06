import { Cpu, Plus, Search } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import DeviceCard from '../components/device-management/DeviceCard';
import PairDeviceModal from '../components/device-management/PairDeviceModal';
import { authService } from '../services/api';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

const DeviceManagementPage = () => {
    const navigate = useNavigate();
    const [user] = useState(authService.getCurrentUser());
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [isPairDeviceModalOpen, setIsPairDeviceModalOpen] = useState(false);
    const [devices, setDevices] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDevices();
    }, []);

    const fetchDevices = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('access_token');
            const response = await axios.get(`${API_BASE_URL}/sys/devices`, {
                headers: { 'Authorization': `Bearer ${token}` },
                params: { limit: 100 }
            });

            const transformed = response.data.map(d => {
                const sensors = [];
                if (d.heart_rate) sensors.push({ name: 'Heart Rate', status: 'healthy', value: `${d.heart_rate} bpm` });
                if (d.spo2) sensors.push({ name: 'SpO2', status: 'healthy', value: `${d.spo2}%` });
                if (d.temperature) sensors.push({ name: 'Temperature', status: 'healthy', value: `${d.temperature}°F` });

                return {
                    id: d.id,
                    name: d.device_name,
                    patient: d.patient_name || 'Unassigned',
                    patientId: d.patient_id,
                    type: 'Medical Device',
                    model: d.device_id,
                    serialNumber: d.device_id,
                    status: d.status,
                    battery: d.battery_level ? Math.round(d.battery_level) : 0,
                    signal: 80,
                    lastSync: d.last_ping ? new Date(d.last_ping) : null,
                    pairedDate: d.created_at ? new Date(d.created_at) : null,
                    sensors: sensors,
                    firmware: d.firmware_version || 'Unknown',
                    storageUsed: 0,
                    alerts: 0,
                    location: d.assigned_room || 'Unknown',
                };
            });

            setDevices(transformed);
        } catch (err) {
            console.error('Failed to fetch devices:', err);
        } finally {
            setLoading(false);
        }
    };

    const getFilteredDevices = () => {
        let filtered = devices.filter((device) => {
            const matchesSearch =
                device.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                device.patient.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = filterStatus === 'all' || device.status === filterStatus;
            return matchesSearch && matchesStatus;
        });
        return filtered.sort((a, b) => b.battery - a.battery);
    };

    const filteredDevices = getFilteredDevices();

    const handlePairDevice = (newDevice) => {
        setDevices([...devices, newDevice]);
        setIsPairDeviceModalOpen(false);
    };

    const handleResync = (deviceId) => {
        console.log('Resync device:', deviceId);
    };

    const handleUnpair = (deviceId) => {
        setDevices(devices.filter((d) => d.id !== deviceId));
    };

    const handleLogout = () => {
        authService.logout();
        navigate('/doctor/login');
    };

    const activeDevices = devices.filter((d) => d.status === 'ACTIVE').length;
    const warningDevices = devices.filter((d) => d.status === 'LOW_BATTERY').length;
    const inactiveDevices = devices.filter((d) => d.status === 'INACTIVE').length;

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200">
            <TopBar userName={`Dr. ${user?.full_name || 'Loading...'}`} />

            <div className="flex">
                <Sidebar onLogout={handleLogout} />

                <main className="flex-1 p-6">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <Cpu className="w-8 h-8 text-orange-500" />
                                <h1 className="text-3xl font-bold text-white">Device Management</h1>
                            </div>
                            <p className="text-slate-400">
                                Monitor and manage IoT devices and wearables
                            </p>
                        </div>
                        <button
                            onClick={() => setIsPairDeviceModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg transition-colors border border-sky-500"
                        >
                            <Plus className="w-5 h-5" />
                            Pair Device
                        </button>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
                            <p className="text-slate-400 text-sm">Total Devices</p>
                            <p className="text-2xl font-bold text-white">{devices.length}</p>
                        </div>
                        <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
                            <p className="text-slate-400 text-sm">Active</p>
                            <p className="text-2xl font-bold text-emerald-400">{activeDevices}</p>
                        </div>
                        <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
                            <p className="text-slate-400 text-sm">Low Battery</p>
                            <p className="text-2xl font-bold text-amber-400">{warningDevices}</p>
                        </div>
                        <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
                            <p className="text-slate-400 text-sm">Inactive</p>
                            <p className="text-2xl font-bold text-red-400">{inactiveDevices}</p>
                        </div>
                    </div>

                    {/* Search and Filter */}
                    <div className="flex gap-4 mb-6 flex-wrap">
                        <div className="flex-1 relative min-w-max">
                            <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search devices or patients..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
                            />
                        </div>

                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-sky-500 transition-colors"
                        >
                            <option value="all">Status: All</option>
                            <option value="ACTIVE">Active</option>
                            <option value="LOW_BATTERY">Low Battery</option>
                            <option value="INACTIVE">Inactive</option>
                        </select>
                    </div>

                    {/* Devices Grid */}
                    {loading ? (
                        <div className="flex justify-center items-center py-20">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div>
                            <p className="ml-4 text-slate-400">Loading devices...</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {filteredDevices.length > 0 ? (
                                filteredDevices.map((device) => (
                                    <DeviceCard
                                        key={device.id}
                                        device={device}
                                        onResync={handleResync}
                                        onUnpair={handleUnpair}
                                    />
                                ))
                            ) : (
                                <div className="col-span-full text-center py-12 bg-slate-900 border border-slate-700 rounded-lg">
                                    <Cpu className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                                    <p className="text-slate-400 text-lg">
                                        {devices.length === 0
                                            ? 'No devices paired yet. Pair your first device!'
                                            : 'No devices match your filters'}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </main>
            </div>

            {/* Pair Device Modal */}
            <PairDeviceModal
                isOpen={isPairDeviceModalOpen}
                onClose={() => setIsPairDeviceModalOpen(false)}
                onPair={handlePairDevice}
            />
        </div>
    );
};

export default DeviceManagementPage;
