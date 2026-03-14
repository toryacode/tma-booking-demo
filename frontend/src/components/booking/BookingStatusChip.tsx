interface BookingStatusChipProps {
  status: string;
}

const BookingStatusChip = ({ status }: BookingStatusChipProps) => {
  const colors = {
    scheduled: 'bg-yellow-500',
    upcoming: 'bg-orange-500',
    in_progress: 'bg-blue-500',
    completed: 'bg-green-500',
    cancelled: 'bg-red-500',
  };

  return (
    <span className={`px-2 py-1 rounded text-white text-sm ${colors[status as keyof typeof colors] || 'bg-gray-500'}`}>
      {status}
    </span>
  );
};

export default BookingStatusChip;