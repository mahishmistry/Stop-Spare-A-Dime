import { Plus, Heart } from 'lucide-react';
import { useState } from 'react';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  unit: string;
  image: string;
  discount?: number;
  rating?: number;
  onAddToCart: (id: string) => void;
}

export function ProductCard({ id, name, price, unit, image, discount, rating, onAddToCart }: ProductCardProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const discountedPrice = discount ? price * (1 - discount / 100) : price;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-shadow relative">
      <button
        onClick={() => setIsFavorite(!isFavorite)}
        className="absolute top-6 right-6 p-2 bg-white rounded-full shadow-sm hover:shadow-md z-10"
      >
        <Heart
          className={`w-5 h-5 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400'}`}
        />
      </button>

      <div className="aspect-square bg-gray-50 rounded-lg mb-3 overflow-hidden">
        <ImageWithFallback
          src={image}
          alt={name}
          className="w-full h-full object-cover"
        />
      </div>

      {discount && (
        <span className="inline-block px-2 py-1 bg-red-500 text-white text-xs rounded mb-2">
          {discount}% OFF
        </span>
      )}

      <h3 className="text-sm text-gray-800 mb-1 line-clamp-2">{name}</h3>
      <p className="text-xs text-gray-500 mb-2">{unit}</p>

      {rating && (
        <div className="flex items-center gap-1 mb-2">
          <span className="text-yellow-500 text-sm">★</span>
          <span className="text-xs text-gray-600">{rating.toFixed(1)}</span>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <p className="text-[#6FBD7A] font-semibold">${discountedPrice.toFixed(2)}</p>
          {discount && (
            <p className="text-xs text-gray-400 line-through">${price.toFixed(2)}</p>
          )}
        </div>
        <button
          onClick={() => onAddToCart(id)}
          className="bg-[#6FBD7A] text-white p-2 rounded-lg hover:bg-[#5da968] transition-colors"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
