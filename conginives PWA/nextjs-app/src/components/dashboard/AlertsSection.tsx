'use client';

import { Alert } from '@/app/providers';

interface AlertsSectionProps {
  alerts: Alert[];
}

export default function AlertsSection({ alerts }: AlertsSectionProps) {
  return (
    <div className="px-4 mb-6 animate-fade-in-up">
      <h3 className="text-base font-bold mb-4 section-title text-text-primary">Recent Alerts</h3>
      
      <div className="glass-card rounded-2xl p-5 overflow-hidden">
        {alerts.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-accent-green/10 flex items-center justify-center mx-auto mb-4 animate-bounce-soft">
              <i className="fas fa-shield-alt text-2xl text-accent-green"></i>
            </div>
            <p className="text-text-primary font-semibold text-base mb-1">All Clear</p>
            <p className="text-text-muted text-sm">No active alerts at this time</p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert, index) => (
              <div
                key={index}
                className={`flex items-start p-4 rounded-xl border-l-4 transition-all duration-300 animate-slide-in-right ${
                  alert.type === 'critical'
                    ? 'bg-accent-red/[0.08] border-accent-red alert-critical-pulse'
                    : 'bg-accent-amber/[0.08] border-accent-amber'
                }`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mr-3 flex-shrink-0 ${
                  alert.type === 'critical' 
                    ? 'bg-accent-red/20' 
                    : 'bg-accent-amber/20'
                }`}>
                  <i
                    className={`fas ${
                      alert.type === 'critical' ? 'fa-exclamation-triangle' : 'fa-exclamation-circle'
                    } text-base ${
                      alert.type === 'critical' ? 'text-accent-red' : 'text-accent-amber'
                    }`}
                  ></i>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-text-primary">{alert.title}</span>
                    {alert.type === 'critical' && (
                      <span className="px-2 py-0.5 rounded-full bg-accent-red/20 text-accent-red text-[10px] font-bold uppercase tracking-wider">
                        Critical
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-text-secondary leading-relaxed">{alert.message}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
