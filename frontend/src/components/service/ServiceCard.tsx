interface ServiceCardProps {
  service: {
    id: number;
    name: string;
    description?: string;
    duration: number;
    price: number;
  };
  onBook: (id: number) => void;
}

const ServiceCard = ({ service, onBook }: ServiceCardProps) => {
  return (
    <div className="bg-white p-4 rounded shadow">
      <h2 className="text-xl font-semibold">{service.name}</h2>
      <p>{service.description}</p>
      <p>Duration: {service.duration} min</p>
      <p>Price: ${service.price}</p>
      <button onClick={() => onBook(service.id)} className="bg-blue-500 text-white px-4 py-2 rounded mt-2">Book</button>
    </div>
  );
};

export default ServiceCard;