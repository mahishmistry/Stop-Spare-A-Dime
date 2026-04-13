import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

interface Product {
  id: string;
  name: string;
  price: number;
  store: string;
  image: string;
}

interface ProductCarouselProps {
  title: string;
  products: Product[];
  onProductClick: (product: Product) => void;
}

export function ProductCarousel({ title, products, onProductClick }: ProductCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % Math.max(1, products.length - 3));
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + Math.max(1, products.length - 3)) % Math.max(1, products.length - 3));
  };

  return (
    <section className="mb-12">
      <h2 className="text-gray-800 mb-6">{title}</h2>

      <div className="relative">
        <button
          onClick={prevSlide}
          className="absolute -left-4 top-1/2 transform -translate-y-1/2 z-10 w-10 h-10 bg-white border border-gray-300 rounded-full flex items-center justify-center hover:bg-[#6FBD7A] hover:text-white hover:border-[#6FBD7A] transition-colors shadow-lg"
          disabled={products.length <= 4}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="overflow-hidden">
          <div
            className="flex gap-6 transition-transform duration-300 ease-in-out"
            style={{ transform: `translateX(-${currentIndex * 25}%)` }}
          >
            {products.map((product) => (
              <div
                key={product.id}
                className="min-w-[calc(25%-18px)] bg-white border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-shadow"
              >
                <div className="aspect-square bg-gray-100 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-sm font-medium text-gray-800 mb-1 line-clamp-2">{product.name}</h3>
                <p className="text-xs text-gray-500 mb-2">{product.store}</p>
                <div className="flex items-center justify-between">
                  <span className="text-[#6FBD7A] font-semibold">${product.price.toFixed(2)}</span>
                  <button
                    onClick={() => onProductClick(product)}
                    className="px-4 py-2 bg-[#6FBD7A] text-white rounded-lg hover:bg-[#5da968] transition-colors text-sm"
                  >
                    View
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={nextSlide}
          className="absolute -right-4 top-1/2 transform -translate-y-1/2 z-10 w-10 h-10 bg-white border border-gray-300 rounded-full flex items-center justify-center hover:bg-[#6FBD7A] hover:text-white hover:border-[#6FBD7A] transition-colors shadow-lg"
          disabled={products.length <= 4}
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </section>
  );
}
