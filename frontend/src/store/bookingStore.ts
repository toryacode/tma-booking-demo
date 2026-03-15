import { create } from 'zustand';

interface BookingState {
  selectedService: number | null;
  selectedEmployee: number | null;
  selectedDate: string | null;
  selectedSlot: string | null;
  setService: (id: number) => void;
  setEmployee: (id: number) => void;
  setDate: (date: string) => void;
  setSlot: (slot: string) => void;
}

export const useBookingStore = create<BookingState>((set) => ({
  selectedService: null,
  selectedEmployee: null,
  selectedDate: null,
  selectedSlot: null,
  setService: (id) => set({ selectedService: id }),
  setEmployee: (id) => set({ selectedEmployee: id }),
  setDate: (date) => set({ selectedDate: date }),
  setSlot: (slot) => set({ selectedSlot: slot }),
}));