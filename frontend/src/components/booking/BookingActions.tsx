interface BookingActionsProps {
  bookingId: number;
  status: string;
  onCancel: (id: number) => void;
  onReschedule: (id: number) => void;
}

const BookingActions = ({ bookingId, status, onCancel, onReschedule }: BookingActionsProps) => {
  if (status === 'completed' || status === 'cancelled') return null;

  return (
    <div className="flex space-x-2">
      <button onClick={() => onCancel(bookingId)} className="bg-red-500 text-white px-4 py-2 rounded">Cancel</button>
      <button onClick={() => onReschedule(bookingId)} className="bg-yellow-500 text-white px-4 py-2 rounded">Reschedule</button>
    </div>
  );
};

export default BookingActions;