interface CategoryCardProps {
  name: string;
  icon: string;
  itemCount: number;
  onClick: () => void;
}

export function CategoryCard({ name, icon, itemCount, onClick }: CategoryCardProps) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2 p-4 bg-white border border-gray-200 rounded-xl hover:border-[#6FBD7A] hover:shadow-md transition-all"
    >
      <div className="w-16 h-16 bg-[#E8F5EA] rounded-full flex items-center justify-center text-3xl">
        {icon}
      </div>
      <h3 className="text-sm text-gray-800">{name}</h3>
      <p className="text-xs text-gray-500">{itemCount} items</p>
    </button>
  );
}
