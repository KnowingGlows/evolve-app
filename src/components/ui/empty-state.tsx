import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6">
      <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-5">
        <Icon size={28} className="text-white/20" />
      </div>
      <h3 className="text-base font-medium text-white/60 mb-2">{title}</h3>
      <p className="text-sm text-white/30 mb-6 text-center max-w-sm">{description}</p>
      {action}
    </div>
  );
}
