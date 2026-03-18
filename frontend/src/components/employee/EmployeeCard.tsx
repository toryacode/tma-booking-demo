interface EmployeeCardProps {
  employee: {
    id: number;
    name: string;
    bio?: string;
  };
  onSelect: (id: number) => void;
}

const EmployeeCard = ({ employee, onSelect }: EmployeeCardProps) => {
  return (
    <div className="bg-white p-4 rounded shadow">
      <h2 className="text-xl font-semibold">{employee.name}</h2>
      <p>{employee.bio}</p>
      <button onClick={() => onSelect(employee.id)} className="bg-blue-500 text-white px-4 py-2 rounded mt-2">Select</button>
    </div>
  );
};

export default EmployeeCard;