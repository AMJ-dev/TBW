type BadgeStatus = 'cleared' | 'inspection' | 'quarantined' | 'pending' | 'active';

interface StatusBadgeProps {
  status: BadgeStatus;
  label: string;
}

const statusClasses: Record<BadgeStatus, string> = {
  cleared: 'bg-surface-container-low text-primary border border-primary',
  inspection: 'bg-[#FFF5EB] text-[#FF6600] border border-[#FF6600]',
  quarantined: 'bg-[#FDF2F0] text-[#B44D2F] border border-[#B44D2F]',
  pending: 'bg-surface-container text-on-surface-variant',
  active: 'bg-secondary-container text-on-secondary',
};

export function StatusBadge({ status, label }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded font-label-sm text-label-sm uppercase font-semibold tracking-wider ${statusClasses[status]}`}
    >
      {label}
    </span>
  );
}