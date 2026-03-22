'use client';

import { Alert } from '@/app/providers';

interface AlertsSectionProps {
  alerts: Alert[];
}

export default function AlertsSection({ alerts }: AlertsSectionProps) {
  return (
    <div className="px-4 mb-5 animate-fade-in-up">
      <h3 className="text-sm font-semibold mb-3 section-title text-text-primary">Recent Alerts</h3>
      
      <div className="glass-card rounded-xl p-4 overflow-hidden">
        {alerts.length === 0 ? (
          <div className="text-center py-6">
            <div className="w-14 h-14 rounded-full bg-accent-green/10 flex items-center justify-center mx-auto mb-3 animate-bounce-soft">
              <i className="fas fa-shield-alt text-xl text-accent-green"></i>
            </div>
            <p className="text-text-primary font-semibold text-sm mb-0.5">All Clear</p>
            <p className="text-text-muted text-xs">No active alerts at this time</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {alerts.map((alert, index) => (
              <div
                key={index}
                className={`flex items-start p-3 rounded-lg border-l-[3px] transition-all duration-300 animate-slide-in-right ${
                  alert.type === 'critical'
                    ? 'bg-accent-red/[0.06] border-accent-red'
                    : 'bg-accent-amber/[0.06] border-accent-amber'
                }`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-2.5 flex-shrink-0 ${
                  alert.type === 'critical' 
                    ? 'bg-accent-red/15' 
                    : 'bg-accent-amber/15'
                }`}>
                  <i
                    className={`fas ${
                      alert.type === 'critical' ? 'fa-exclamation-triangle' : 'fa-exclamation-circle'
                    } text-sm ${
                      alert.type === 'critical' ? 'text-accent-red' : 'text-accent-amber'
                    }`}
                  ></i>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-xs font-semibold text-text-primary">{alert.title}</span>
                    {alert.type === 'critical' && (
                      <span className="px-1.5 py-px rounded-full bg-accent-red/20 text-accent-red text-[9px] font-bold uppercase tracking-wider">
                        Critical
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-text-secondary leading-relaxed">{alert.message}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
