interface BookingCardProps {
  booking: {
    id: number;
    service: { name: string };
    employee: { name: string };
    start_time: string;
    status: string;
  };
}

const BookingCard = ({ booking }: BookingCardProps) => {
  return (
    <div className="bg-white p-4 rounded shadow">
      <h2>{booking.service.name} with {booking.employee.name}</h2>
      <p>{new Date(booking.start_time).toLocaleString()}</p>
      <p>Status: {booking.status}</p>
    </div>
  );
};

export default BookingCard;