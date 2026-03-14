interface SlotPickerProps {
  slots: string[];
  selectedSlot: string | null;
  onSelectSlot: (slot: string) => void;
}

const SlotPicker = ({ slots, selectedSlot, onSelectSlot }: SlotPickerProps) => {
  return (
    <div className="grid grid-cols-4 gap-2">
      {slots.map(slot => (
        <button
          key={slot}
          onClick={() => onSelectSlot(slot)}
          className={`p-2 rounded ${selectedSlot === slot ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          {new Date(slot).toLocaleTimeString()}
        </button>
      ))}
    </div>
  );
};

export default SlotPicker;