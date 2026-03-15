interface BookingStatusChipProps {
  status: string;
}

const BookingStatusChip = ({ status }: BookingStatusChipProps) => {
  const normalizedStatus = status.toLowerCase();
  const displayStatus = normalizedStatus.replace('_', ' ');

  const colors = {
    scheduled: 'bg-blue-500/20 text-blue-700 ring-1 ring-inset ring-blue-500/35 dark:bg-blue-400/20 dark:text-blue-200 dark:ring-blue-300/30',
    upcoming: 'bg-amber-400/25 text-amber-800 ring-1 ring-inset ring-amber-500/40 dark:bg-amber-300/20 dark:text-amber-200 dark:ring-amber-200/30',
    in_progress: 'bg-blue-500/20 text-blue-700 ring-1 ring-inset ring-blue-500/35 dark:bg-blue-400/20 dark:text-blue-200 dark:ring-blue-300/30',
    completed: 'bg-emerald-500/20 text-emerald-700 ring-1 ring-inset ring-emerald-500/35 dark:bg-emerald-400/20 dark:text-emerald-200 dark:ring-emerald-300/30',
    cancelled: 'bg-rose-500/20 text-rose-700 ring-1 ring-inset ring-rose-500/35 dark:bg-rose-400/20 dark:text-rose-200 dark:ring-rose-300/30',
    canceled: 'bg-rose-500/20 text-rose-700 ring-1 ring-inset ring-rose-500/35 dark:bg-rose-400/20 dark:text-rose-200 dark:ring-rose-300/30',
  };

  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold capitalize ${colors[normalizedStatus as keyof typeof colors] || 'bg-slate-500/20 text-slate-700 ring-1 ring-inset ring-slate-500/30 dark:bg-slate-400/20 dark:text-slate-200 dark:ring-slate-300/30'}`}>
      {displayStatus}
    </span>
  );
};

export default BookingStatusChip;