import React, { useState, useEffect } from "react";
import { X, Star, Check, ShieldCheck, Heart, ShoppingBag, ArrowLeft, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import { Product } from "../types";

interface ProductDetailsModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number, size?: string, color?: string) => void;
  onAddToFavorites?: (product: Product) => void;
  isFavorite?: boolean;
}

export default function ProductDetailsModal({
  product,
  onClose,
  onAddToCart,
  onAddToFavorites,
  isFavorite = false
}: ProductDetailsModalProps) {
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [addedAnimation, setAddedAnimation] = useState<boolean>(false);

  // Carousel config & dragging state
  const images = product && product.images && product.images.length > 0 ? product.images : (product ? [product.image] : []);
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [dragOffset, setDragOffset] = useState<number>(0);
  const [isDraggingActive, setIsDraggingActive] = useState<boolean>(false);
  const isDragging = React.useRef<boolean>(false);
  const startX = React.useRef<number>(0);
  const currentX = React.useRef<number>(0);

  // Reset local state when product changes
  useEffect(() => {
    if (product) {
      setSelectedSize(product.sizes[0] || "");
      setSelectedColor(product.colors[0] || "");
      setQuantity(1);
      setActiveImageIndex(0);
      setDragOffset(0);
      setIsDraggingActive(false);
      isDragging.current = false;
    }
  }, [product]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (images.length <= 1) return;
    startX.current = e.touches[0].clientX;
    currentX.current = e.touches[0].clientX;
    isDragging.current = true;
    setIsDraggingActive(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current || images.length <= 1) return;
    currentX.current = e.touches[0].clientX;
    const diff = currentX.current - startX.current;
    if ((activeImageIndex === 0 && diff > 0) || (activeImageIndex === images.length - 1 && diff < 0)) {
      setDragOffset(diff * 0.4);
    } else {
      setDragOffset(diff);
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    setIsDraggingActive(false);
    const diff = currentX.current - startX.current;
    if (diff < -60 && activeImageIndex < images.length - 1) {
      setActiveImageIndex((prev) => prev + 1);
    } else if (diff > 60 && activeImageIndex > 0) {
      setActiveImageIndex((prev) => prev - 1);
    }
    setDragOffset(0);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (images.length <= 1) return;
    startX.current = e.clientX;
    currentX.current = e.clientX;
    isDragging.current = true;
    setIsDraggingActive(true);
    e.preventDefault();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || images.length <= 1) return;
    currentX.current = e.clientX;
    const diff = currentX.current - startX.current;
    if ((activeImageIndex === 0 && diff > 0) || (activeImageIndex === images.length - 1 && diff < 0)) {
      setDragOffset(diff * 0.4);
    } else {
      setDragOffset(diff);
    }
  };

  const handleMouseUpOrLeave = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    setIsDraggingActive(false);
    const diff = currentX.current - startX.current;
    if (diff < -60 && activeImageIndex < images.length - 1) {
      setActiveImageIndex((prev) => prev + 1);
    } else if (diff > 60 && activeImageIndex > 0) {
      setActiveImageIndex((prev) => prev - 1);
    }
    setDragOffset(0);
  };

  if (!product) return null;

  const handleAddToCart = () => {
    onAddToCart(product, quantity, selectedSize, selectedColor);
    setAddedAnimation(true);
    setTimeout(() => {
      setAddedAnimation(false);
      onClose();
    }, 1200);
  };

  const formattedPrice = product.price.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      {/* Background backdrop */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-stone-950/80 backdrop-blur-md transition-opacity"
      ></div>

      <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-6">
        <div className="relative transform overflow-hidden rounded-3xl bg-stone-900 border border-amber-950/20 text-left shadow-2xl transition-all sm:my-8 w-full max-w-4xl max-h-[90vh] flex flex-col md:flex-row">
          
          {/* Close button top right */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 z-10 p-2 rounded-full bg-stone-950/60 text-stone-400 hover:text-stone-100 cursor-pointer border border-stone-800 hover:border-amber-500/30 transition-all"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Left Column: Swipeable Image Carousel */}
          <div className="w-full md:w-1/2 bg-stone-950 flex flex-col justify-center relative min-h-[300px] md:min-h-[450px] overflow-hidden select-none">
            
            {/* Carousel Container */}
            <div 
              className={`w-full h-full flex items-center relative overflow-hidden ${images.length > 1 ? (isDraggingActive ? "cursor-grabbing" : "cursor-grab") : ""}`}
              style={{ touchAction: images.length > 1 ? "pan-y" : "auto" }}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onTouchCancel={handleTouchEnd}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUpOrLeave}
              onMouseLeave={handleMouseUpOrLeave}
            >
              <div 
                className={`flex h-full w-full ${isDraggingActive ? "" : "transition-transform duration-500 ease-out"}`}
                style={{ 
                  transform: `translateX(calc(-${activeImageIndex * 100}% + ${dragOffset}px))`
                }}
              >
                {images.map((imgUrl, index) => (
                  <div key={index} className="w-full h-full flex-shrink-0 flex items-center justify-center bg-stone-950">
                    <img
                      src={imgUrl}
                      alt={`${product.name} - ${index + 1}`}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover max-h-[350px] md:max-h-full opacity-90 select-none pointer-events-none"
                    />
                  </div>
                ))}
              </div>

              {/* Navigation Chevrons (only if multi-image) */}
              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (activeImageIndex > 0) setActiveImageIndex(activeImageIndex - 1);
                    }}
                    disabled={activeImageIndex === 0}
                    className={`absolute left-3 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-stone-950/60 text-stone-400 hover:text-stone-100 border border-stone-800 transition-all cursor-pointer ${
                      activeImageIndex === 0 ? "opacity-0 pointer-events-none" : "hover:scale-110 hover:border-amber-500/40"
                    }`}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (activeImageIndex < images.length - 1) setActiveImageIndex(activeImageIndex + 1);
                    }}
                    disabled={activeImageIndex === images.length - 1}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-stone-950/60 text-stone-400 hover:text-stone-100 border border-stone-800 transition-all cursor-pointer ${
                      activeImageIndex === images.length - 1 ? "opacity-0 pointer-events-none" : "hover:scale-110 hover:border-amber-500/40"
                    }`}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              )}

              {/* Bullet indicators */}
              {images.length > 1 && (
                <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-1.5 z-10">
                  {images.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setActiveImageIndex(i)}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        i === activeImageIndex 
                          ? "bg-amber-400 w-4 shadow-md" 
                          : "bg-stone-500/40 hover:bg-white/60"
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            {product.tag && (
              <span className="absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-amber-500 to-rose-600 text-white shadow-lg z-10 pointer-events-none">
                {product.tag}
              </span>
            )}
          </div>

          {/* Right Column: Interactive Details Section */}
          <div className="w-full md:w-1/2 p-6 sm:p-8 overflow-y-auto max-h-[50vh] md:max-h-[90vh] flex flex-col justify-between">
            <div className="space-y-6">
              
              {/* Product Header Info */}
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-widest text-amber-500">{product.category}</span>
                <h2 className="text-xl sm:text-2xl font-bold text-stone-100 pr-8">{product.name}</h2>
                
                {/* Rating & reviews */}
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        className={`w-4 h-4 ${
                          i < Math.floor(product.rating) 
                            ? "text-amber-400 fill-amber-400" 
                            : "text-stone-700"
                        }`} 
                      />
                    ))}
                  </div>
                  <span className="text-sm font-semibold text-stone-200">{product.rating.toFixed(1)}</span>
                  <span className="text-xs text-stone-500">• {product.reviewsCount} avaliações reais</span>
                </div>
              </div>

              {/* Price */}
              <div className="bg-stone-950/40 p-4 rounded-2xl border border-stone-800/60 flex items-center justify-between">
                <div>
                  <span className="text-xs text-stone-500 block uppercase tracking-widest">Valor à Vista</span>
                  <span className="text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-rose-300 to-amber-100">
                    {formattedPrice}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-emerald-400 block font-semibold">✓ Frete Discreto</span>
                  <span className="text-[10px] text-stone-400 block">Sem descrição na fatura</span>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <h4 className="text-xs uppercase tracking-widest text-stone-400 font-bold">Apresentação</h4>
                <p className="text-xs sm:text-sm text-stone-300 leading-relaxed font-sans">
                  {product.description}
                </p>
              </div>

              {/* Color Selection (if available) */}
              {product.colors.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex justify-between text-xs">
                    <span className="uppercase tracking-widest text-stone-400 font-bold">Opção / Fragrância</span>
                    <span className="font-semibold text-amber-200">{selectedColor}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {product.colors.map((color) => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer border transition-all flex items-center space-x-1.5 ${
                          selectedColor === color
                            ? "bg-amber-500/10 border-amber-500 text-amber-200 shadow-sm"
                            : "bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-200 hover:border-stone-700"
                        }`}
                      >
                        {selectedColor === color && <Check className="w-3.5 h-3.5 text-amber-400" />}
                        <span>{color}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Size Selection (if available) */}
              {product.sizes.length > 0 && product.sizes[0] !== "Tamanho Único" && product.sizes[0] !== "Kit Completo" && product.sizes[0] !== "120g" && product.sizes[0] !== "80ml" && (
                <div className="space-y-2.5">
                  <div className="flex justify-between text-xs">
                    <span className="uppercase tracking-widest text-stone-400 font-bold">Escolha o Tamanho</span>
                    <span className="text-stone-500 italic">Tabela padrão brasileira</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {product.sizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`w-10 h-10 rounded-full text-xs font-bold cursor-pointer border transition-all flex items-center justify-center ${
                          selectedSize === size
                            ? "bg-rose-500/20 border-rose-500 text-rose-300 scale-105"
                            : "bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-200 hover:border-stone-700"
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Specifications / Key Points */}
              <div className="space-y-2">
                <h4 className="text-xs uppercase tracking-widest text-stone-400 font-bold">Especificações e Cuidados</h4>
                <ul className="space-y-1.5 text-xs text-stone-400 font-sans">
                  {product.details.map((detail, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <span className="text-amber-500 mt-0.5">•</span>
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Segurança e Descrição do Envio */}
              <div className="space-y-2 bg-stone-950/30 p-3 rounded-2xl border border-stone-850">
                <h4 className="text-xs uppercase tracking-widest text-gold-400 font-bold flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>Segurança & Envio Discreto</span>
                </h4>
                <ul className="space-y-1 text-[11px] text-stone-300 font-sans">
                  <li className="flex items-start gap-1">
                    <span className="text-emerald-500 font-bold">✓</span>
                    <span><strong>Caixa parda:</strong> Embalagem externa em caixa parda neutra, lisa e sem nenhuma identificação da loja ou produto.</span>
                  </li>
                  <li className="flex items-start gap-1">
                    <span className="text-emerald-500 font-bold">✓</span>
                    <span><strong>Sacola preta discreta:</strong> Uso de sacola preta discreta de alta resistência e totalmente opaca para embalar o item.</span>
                  </li>
                  <li className="flex items-start gap-1">
                    <span className="text-emerald-500 font-bold">✓</span>
                    <span><strong>Entregas locais:</strong> Entregas locais realizadas exclusivamente com sacola preta discreta e sem logos externos.</span>
                  </li>
                </ul>
              </div>

            </div>

            {/* Bottom Actions: Quantity & Add to Cart */}
            <div className="mt-8 pt-5 border-t border-stone-800/80 flex flex-col space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-widest text-stone-400 font-bold">Quantidade</span>
                
                {/* Plus Minus Buttons */}
                <div className="flex items-center bg-stone-950 border border-stone-800 rounded-full p-1 w-28 justify-between">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-7 h-7 flex items-center justify-center rounded-full text-stone-400 hover:text-stone-100 hover:bg-stone-900 cursor-pointer"
                  >
                    -
                  </button>
                  <span className="text-xs font-bold text-stone-100">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-7 h-7 flex items-center justify-center rounded-full text-stone-400 hover:text-stone-100 hover:bg-stone-900 cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Add Cart Action */}
              <div className="flex space-x-3">
                {onAddToFavorites && (
                  <button
                    onClick={() => onAddToFavorites(product)}
                    className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                      isFavorite 
                        ? "bg-rose-500/10 border-rose-500 text-rose-400" 
                        : "bg-stone-900 border-stone-800 text-stone-400 hover:text-rose-500 hover:border-stone-700"
                    }`}
                  >
                    <Heart className={`w-5 h-5 ${isFavorite ? "fill-rose-500" : ""}`} />
                  </button>
                )}

                <button
                  id="add-to-cart-modal-btn"
                  onClick={handleAddToCart}
                  disabled={addedAnimation}
                  className={`flex-1 py-3 px-6 rounded-2xl text-xs font-extrabold tracking-widest uppercase shadow-lg transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                    addedAnimation 
                      ? "bg-emerald-600 text-white scale-98" 
                      : "bg-gradient-to-r from-amber-500 via-rose-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-white hover:shadow-rose-950/20"
                  }`}
                >
                  {addedAnimation ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Adicionado!</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4" />
                      <span>Adicionar ao Carrinho</span>
                    </>
                  )}
                </button>
              </div>

              {/* Confidentiality Notice badge */}
              <div className="flex items-center justify-center space-x-1.5 text-[10px] text-stone-500 bg-stone-950/20 py-2 rounded-xl">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Privacidade Garantida • Caixa parda • Sacola preta discreta • Cobrança discreta</span>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
