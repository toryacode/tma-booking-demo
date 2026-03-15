import { useState, useEffect } from 'react';
import { getMyBookings } from '../api/bookings';

export const useBookings = () => {
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    getMyBookings().then(setBookings);
  }, []);

  return { bookings };
};