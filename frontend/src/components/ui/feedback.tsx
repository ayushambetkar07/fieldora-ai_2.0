import React from 'react';
import { LucideIcon, CheckCircle2, AlertTriangle, Info, XCircle, X } from 'lucide-react';
import { Button, cn } from './index';
import { useApp } from '../../context/AppContext';

// 1. EmptyState
interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}) => {
  return (
    <div className="bg-card border border-border rounded-card p-8 sm:p-12 text-center max-w-md mx-auto my-6 space-y-4">
      <div className="w-12 h-12 rounded-full bg-[#EAEFEA] text-primary flex items-center justify-center mx-auto">
        <Icon className="w-6 h-6" />
      </div>
      <div className="space-y-1.5">
        <h3 className="text-base font-semibold text-main">{title}</h3>
        <p className="text-xs text-secondary leading-relaxed">{description}</p>
      </div>
      {actionLabel && onAction && (
        <Button variant="primary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

// 2. SkeletonLoader
export const SkeletonLoader: React.FC<{ type?: 'card' | 'table' | 'chart' | 'stats' }> = ({ type = 'card' }) => {
  if (type === 'stats') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-card border border-border rounded-card p-5 h-28 space-y-3">
            <div className="h-3 bg-[#E5EAE5] rounded-full w-24"></div>
            <div className="h-7 bg-[#E5EAE5] rounded-full w-32"></div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'chart') {
    return (
      <div className="bg-card border border-border rounded-card p-6 h-72 animate-pulse space-y-4">
        <div className="h-4 bg-[#E5EAE5] rounded-full w-48"></div>
        <div className="h-48 bg-[#F2F5F3] rounded-card w-full"></div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 animate-pulse">
      {[1, 2, 3].map(i => (
        <div key={i} className="bg-card border border-border rounded-card overflow-hidden h-72 space-y-3">
          <div className="h-40 bg-[#E5EAE5] w-full"></div>
          <div className="p-4 space-y-2">
            <div className="h-4 bg-[#E5EAE5] rounded-full w-3/4"></div>
            <div className="h-3 bg-[#E5EAE5] rounded-full w-1/2"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

// 3. ToastContainer
export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full px-4 pointer-events-none">
      {toasts.map(toast => {
        let Icon = CheckCircle2;
        let borderClass = "border-[#bbf7d0] bg-white";
        let iconColor = "text-accent";

        if (toast.type === 'info') {
          Icon = Info;
          borderClass = "border-[#bfdbfe] bg-white";
          iconColor = "text-info";
        } else if (toast.type === 'warning') {
          Icon = AlertTriangle;
          borderClass = "border-[#fde68a] bg-white";
          iconColor = "text-warning";
        } else if (toast.type === 'error') {
          Icon = XCircle;
          borderClass = "border-[#fecaca] bg-white";
          iconColor = "text-error";
        }

        return (
          <div
            key={toast.id}
            className={cn(
              "pointer-events-auto p-4 rounded-card border shadow-hover flex items-start justify-between gap-3 animate-slide-in-right",
              borderClass
            )}
          >
            <div className="flex items-start gap-2.5">
              <Icon className={cn("w-5 h-5 shrink-0 mt-0.5", iconColor)} />
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-main">{toast.title}</h4>
                <p className="text-xs text-secondary leading-snug">{toast.message}</p>
              </div>
            </div>
            <button
              onClick={() => dismissToast(toast.id)}
              className="text-muted hover:text-main p-1 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
