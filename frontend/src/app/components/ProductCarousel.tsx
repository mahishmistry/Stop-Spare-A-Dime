import { Carousel } from './OtherRetailerCarousel.tsx';

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
  const cards = products.map((product) => (
    <button
      key={product.id}
      onClick={() => onProductClick(product)}
      className="w-full bg-white border border-gray-200 rounded-xl p-3 hover:shadow-lg hover:border-[#6FBD7A]/40 active:scale-[0.98] transition-all duration-200 text-left flex flex-col cursor-pointer"
    >
      <div className="aspect-square bg-gray-100 rounded-lg mb-2 overflow-hidden w-full">
        <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
      </div>
      <h3 className="text-xs font-medium text-gray-800 mb-1 line-clamp-2 leading-tight">{product.name}</h3>
      <p className="text-[11px] text-gray-500 mb-1">{product.store}</p>
      <p className="text-[#6FBD7A] font-semibold text-sm mt-auto">${product.price.toFixed(2)}</p>
    </button>
  ));

  return (
    <section className="mb-10">
      <h2 className="text-gray-800 text-lg font-semibold mb-4 px-1">{title}</h2>
      <Carousel items={cards} responsive gapPx={12} />
    </section>
  );
}