import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getEmployeeSlots, createBooking } from '../api/bookings';

const Booking = () => {
  const [searchParams] = useSearchParams();
  const serviceId = parseInt(searchParams.get('service') || '0');
  const employeeId = parseInt(searchParams.get('employee') || '0');
  const [date, setDate] = useState('');
  const [slots, setSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState('');

  useEffect(() => {
    if (date) {
      getEmployeeSlots(employeeId, serviceId, date).then(data => setSlots(data.slots));
    }
  }, [date, employeeId, serviceId]);

  const handleBook = async () => {
    if (selectedSlot) {
      const startTime = new Date(selectedSlot);
      // Assume duration is known, for simplicity
      const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1 hour
      await createBooking({ service_id: serviceId, employee_id: employeeId, start_time: startTime.toISOString(), end_time: endTime.toISOString() });
      alert('Booking created!');
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Book Appointment</h1>
      <div className="mb-4">
        <label className="block mb-2">Select Date</label>
        <input type="date" value={date} onChange={e => setDate(e.target.value)} className="border p-2 rounded" />
      </div>
      <div className="mb-4">
        <h2 className="text-xl mb-2">Available Slots</h2>
        <div className="grid grid-cols-4 gap-2">
          {slots.map(slot => (
            <button
              key={slot}
              onClick={() => setSelectedSlot(slot)}
              className={`p-2 rounded ${selectedSlot === slot ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            >
              {new Date(slot).toLocaleTimeString()}
            </button>
          ))}
        </div>
      </div>
      <button onClick={handleBook} className="bg-green-500 text-white px-4 py-2 rounded">Confirm Booking</button>
    </div>
  );
};

export default Booking;