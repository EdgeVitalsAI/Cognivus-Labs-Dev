import { AlertTriangle, Battery, CheckCircle, RefreshCw, Signal, Trash2, Wifi } from 'lucide-react';

const DeviceCard = ({ device, onResync, onUnpair }) => {
    const getStatusColor = (status) => {
        switch (status) {
            case 'ACTIVE':
                return {
                    bg: 'bg-emerald-500/10',
                    border: 'border-emerald-500',
                    text: 'text-emerald-400',
                    icon: CheckCircle,
                };
            case 'LOW_BATTERY':
                return {
                    bg: 'bg-amber-500/10',
                    border: 'border-amber-500',
                    text: 'text-amber-400',
                    icon: AlertTriangle,
                };
            case 'INACTIVE':
                return {
                    bg: 'bg-red-500/10',
                    border: 'border-red-500',
                    text: 'text-red-400',
                    icon: AlertTriangle,
                };
            default:
                return {
                    bg: 'bg-slate-500/10',
                    border: 'border-slate-500',
                    text: 'text-slate-400',
                    icon: AlertTriangle,
                };
        }
    };

    const getSignalBars = (signal) => {
        if (signal >= 80) return 4;
        if (signal >= 60) return 3;
        if (signal >= 40) return 2;
        if (signal >= 20) return 1;
        return 0;
    };

    const formatLastSync = (date) => {
        const now = new Date();
        const diff = now - new Date(date);
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
    };

    const status = getStatusColor(device.status);
    const StatusIcon = status.icon;
    const signalBars = getSignalBars(device.signal);

    return (
        <div
            className={`${status.bg} border-l-4 ${status.border} bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg border border-slate-700 p-4 hover:shadow-lg hover:shadow-slate-700/50 transition-all`}
        >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                        <Wifi className={`w-5 h-5 ${status.text}`} />
                        <h3 className="text-lg font-bold text-white">{device.name}</h3>
                    </div>
                    <p className="text-sm text-slate-400">{device.model}</p>
                    <p className="text-xs text-slate-500">SN: {device.serialNumber}</p>
                </div>
                <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-full border ${status.border} ${status.text} ${status.bg}`}
                >
                    {device.status}
                </span>
            </div>

            {/* Status Info */}
            <div className="grid grid-cols-3 gap-3 mb-4">
                {/* Battery */}
                <div className="bg-slate-700/30 rounded-lg p-3 border border-slate-700">
                    <div className="flex items-center gap-2 mb-2">
                        <Battery className="w-4 h-4 text-blue-400" />
                        <span className="text-xs text-slate-400 uppercase tracking-wider">
                            Battery
                        </span>
                    </div>
                    <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden mb-1">
                        <div
                            className={`h-full rounded-full ${
                                device.battery > 50
                                    ? 'bg-emerald-500'
                                    : device.battery > 20
                                    ? 'bg-amber-500'
                                    : 'bg-red-500'
                            }`}
                            style={{ width: `${device.battery}%` }}
                        ></div>
                    </div>
                    <p className="text-sm font-semibold text-white">{device.battery}%</p>
                </div>

                {/* Signal */}
                <div className="bg-slate-700/30 rounded-lg p-3 border border-slate-700">
                    <div className="flex items-center gap-2 mb-2">
                        <Signal className="w-4 h-4 text-purple-400" />
                        <span className="text-xs text-slate-400 uppercase tracking-wider">
                            Signal
                        </span>
                    </div>
                    <div className="flex items-center gap-1 mb-1">
                        {[...Array(4)].map((_, i) => (
                            <div
                                key={i}
                                className={`flex-1 h-2 rounded-full ${
                                    i < signalBars ? 'bg-sky-400' : 'bg-slate-600'
                                }`}
                            ></div>
                        ))}
                    </div>
                    <p className="text-sm font-semibold text-white">{device.signal}%</p>
                </div>

                {/* Last Sync */}
                <div className="bg-slate-700/30 rounded-lg p-3 border border-slate-700">
                    <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">
                        Last Sync
                    </p>
                    <p className="text-sm font-semibold text-white">
                        {formatLastSync(device.lastSync)}
                    </p>
                </div>
            </div>

            {/* Sensors Grid */}
            <div className="mb-4">
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">
                    Sensor Status
                </p>
                <div className="space-y-2">
                    {device.sensors.map((sensor, idx) => (
                        <div
                            key={idx}
                            className="flex items-center justify-between p-2 bg-slate-700/20 rounded-lg border border-slate-700"
                        >
                            <div className="flex items-center gap-2">
                                <div
                                    className={`w-2 h-2 rounded-full ${
                                        sensor.status === 'healthy'
                                            ? 'bg-emerald-500'
                                            : sensor.status === 'warning'
                                            ? 'bg-amber-500'
                                            : 'bg-red-500'
                                    }`}
                                ></div>
                                <span className="text-sm text-slate-300">{sensor.name}</span>
                            </div>
                            <span className="text-sm font-semibold text-slate-200">
                                {sensor.value}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Storage */}
            <div className="mb-4 p-3 bg-slate-700/20 rounded-lg border border-slate-700">
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Storage</p>
                <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full ${
                            device.storageUsed > 80
                                ? 'bg-red-500'
                                : device.storageUsed > 50
                                ? 'bg-amber-500'
                                : 'bg-sky-500'
                        }`}
                        style={{ width: `${device.storageUsed}%` }}
                    ></div>
                </div>
                <p className="text-xs text-slate-400 mt-1">{device.storageUsed}% used</p>
            </div>

            {/* Device Info */}
            <div className="text-xs text-slate-400 mb-4 space-y-1">
                <p>Firmware: {device.firmware}</p>
                <p>Paired: {new Date(device.pairedDate).toLocaleDateString()}</p>
                <p>Location: {device.location}</p>
                {device.alerts > 0 && (
                    <p className="text-amber-400">
                        Alert: {device.alerts} alert{device.alerts > 1 ? 's' : ''}
                    </p>
                )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
                <button
                    onClick={() => onResync(device.id)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm rounded-lg transition-colors border border-slate-600"
                >
                    <RefreshCw className="w-4 h-4" />
                    Resync
                </button>
                <button
                    onClick={() => onUnpair(device.id)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 text-sm rounded-lg transition-colors border border-red-500/30"
                >
                    <Trash2 className="w-4 h-4" />
                    Unpair
                </button>
            </div>
        </div>
    );
};

export default DeviceCard;
