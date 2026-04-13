import { X } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  rating: number;
  store: string;
  inStock: boolean;
}

interface ComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  searchTerm: string;
}

export function ComparisonModal({ isOpen, onClose, products, searchTerm }: ComparisonModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <div>
            <h2 className="text-gray-800">Compare Prices</h2>
            <p className="text-sm text-gray-600">Showing results for "{searchTerm}"</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((product) => (
              <div
                key={product.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow"
              >
                <div className="aspect-square bg-gray-50 rounded-lg mb-3 overflow-hidden">
                  <ImageWithFallback
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                <h3 className="text-sm text-gray-800 mb-2">{product.name}</h3>

                <div className="flex items-center gap-2 mb-2">
                  <span className="text-yellow-500 text-sm">★</span>
                  <span className="text-sm text-gray-600">{product.rating.toFixed(1)}</span>
                </div>

                <p className="text-xs text-gray-500 mb-2">{product.store}</p>

                <div className="flex items-center justify-between">
                  <p className="text-[#6FBD7A] font-semibold text-lg">${product.price.toFixed(2)}</p>
                  {product.inStock ? (
                    <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                      In Stock
                    </span>
                  ) : (
                    <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                      Out of Stock
                    </span>
                  )}
                </div>

                <button className="w-full mt-3 bg-[#6FBD7A] text-white py-2 rounded-lg hover:bg-[#5da968] transition-colors">
                  View at {product.store}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
