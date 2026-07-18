import React from "react";
import { Star, ShoppingCart, Heart } from "lucide-react";
import { Product } from "../types";

interface ProductCardProps {
  key?: React.Key;
  product: Product;
  onSelectProduct: (product: Product) => void;
  onAddToFavorites?: (product: Product) => void;
  isFavorite?: boolean;
}

export default function ProductCard({
  product,
  onSelectProduct,
  onAddToFavorites,
  isFavorite = false
}: ProductCardProps) {
  // Format price in Brazilian Real
  const formattedPrice = product.price.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });

  return (
    <div 
      id={`product-card-${product.id}`}
      className="group relative bg-stone-900/40 border border-stone-800/80 hover:border-gold-400/30 rounded-2xl overflow-hidden transition-all duration-300 flex flex-col h-full shadow-lg"
    >
      {/* Product Tag/Badge */}
      {product.tag && (
        <span className="absolute top-3 left-3 z-10 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r from-gold-500 to-burgundy-600 text-white shadow-md">
          {product.tag}
        </span>
      )}

      {/* Favorite Button */}
      {onAddToFavorites && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAddToFavorites(product);
          }}
          className="absolute top-3 right-3 z-10 p-2 rounded-full bg-stone-950/80 backdrop-blur-xs border border-stone-800 text-stone-400 hover:text-rose-500 hover:scale-110 transition-all cursor-pointer"
        >
          <Heart className={`w-4 h-4 ${isFavorite ? "fill-rose-500 text-rose-500" : ""}`} />
        </button>
      )}

      {/* Product Image wrapper */}
      <div 
        onClick={() => onSelectProduct(product)}
        className="relative aspect-square overflow-hidden bg-stone-950 flex-shrink-0 cursor-pointer"
      >
        <img
          src={product.image}
          alt={product.name}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
          <span className="text-xs text-gold-300 font-medium">Toque para ver mais detalhes</span>
        </div>
      </div>

      {/* Product Info */}
      <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between">
        <div className="space-y-2">
          {/* Category & Rating */}
          <div className="flex justify-between items-center text-[10px] sm:text-xs text-stone-400">
            <span className="uppercase tracking-wider font-semibold text-gold-400">{product.category}</span>
            <div className="flex items-center space-x-1">
              <Star className="w-3 h-3 text-gold-400 fill-gold-400" />
              <span className="font-medium text-stone-200">{product.rating.toFixed(1)}</span>
              <span className="text-stone-500">({product.reviewsCount})</span>
            </div>
          </div>

          {/* Name */}
          <h3 
            onClick={() => onSelectProduct(product)}
            className="text-sm sm:text-base font-semibold text-stone-100 group-hover:text-gold-200 font-display line-clamp-2 transition-colors cursor-pointer min-h-[2.5rem]"
          >
            {product.name}
          </h3>

          {/* Description */}
          <p className="text-xs text-stone-400 line-clamp-2 leading-relaxed min-h-[2rem]">
            {product.description}
          </p>
        </div>

        {/* Footer Area: Price & Action */}
        <div className="mt-4 pt-3 border-t border-stone-800/50 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] text-stone-500 uppercase tracking-widest leading-none mb-0.5">A partir de</span>
            <span className="text-base sm:text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-gold-100 to-gold-300">
              {formattedPrice}
            </span>
          </div>

          <button
            onClick={() => onSelectProduct(product)}
            className="bg-stone-850 hover:bg-gradient-to-r hover:from-gold-400 hover:to-gold-600 border border-stone-700 hover:border-transparent text-stone-200 hover:text-burgundy-950 px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-all flex items-center space-x-1 shadow-sm"
          >
            <span>Ver</span>
            <ShoppingCart className="w-3 h-3 ml-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
