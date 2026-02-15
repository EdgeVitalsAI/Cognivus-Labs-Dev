'use client';

import { Alert } from '@/app/providers';

interface AlertsSectionProps {
  alerts: Alert[];
}

export default function AlertsSection({ alerts }: AlertsSectionProps) {
  return (
    <div className="px-4 mb-6">
      <h3 className="text-base font-semibold mb-4">Recent Alerts</h3>
      
      <div className="bg-background-card rounded-xl p-5">
        {alerts.length === 0 ? (
          <div className="text-center text-text-muted py-5">
            <i className="fas fa-check-circle text-4xl text-accent-green mb-3"></i>
            <p>No active alerts</p>
          </div>
        ) : (
          <div className="space-y-2">
            {alerts.map((alert, index) => (
              <div
                key={index}
                className={`flex items-center p-3 rounded-lg border-l-4 ${
                  alert.type === 'critical'
                    ? 'bg-accent-red/10 border-accent-red'
                    : 'bg-accent-orange/10 border-accent-orange'
                }`}
              >
                <i
                  className={`fas fa-exclamation-circle mr-3 text-lg ${
                    alert.type === 'critical' ? 'text-accent-red' : 'text-accent-orange'
                  }`}
                ></i>
                <div className="flex-1">
                  <div className="text-sm font-medium mb-0.5">{alert.title}</div>
                  <div className="text-xs text-text-muted">{alert.message}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
