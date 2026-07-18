import React from "react";
import { 
  Shield, 
  ShoppingBag, 
  Flame,
  User,
  HelpCircle,
  MessageCircle,
  Search
} from "lucide-react";
import { CartItem } from "../types";

interface HeaderProps {
  activeCategory: string;
  setActiveCategory: (cat: string) => void;
  onEnableDiscreet: () => void;
  cart: CartItem[];
  onOpenCart: () => void;
  onOpenContact: () => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  onOpenAdmin?: () => void;
}

export default function Header({
  activeCategory,
  setActiveCategory,
  onEnableDiscreet,
  cart,
  onOpenCart,
  onOpenContact,
  searchTerm,
  setSearchTerm,
  onOpenAdmin
}: HeaderProps) {
  const totalCartItems = cart.reduce((acc, item) => acc + item.quantity, 0);

  const categories = [
    "Tudo",
    "Lingerie",
    "Sex Shop"
  ];

  return (
    <header id="store-header" className="sticky top-0 z-40 bg-stone-950/95 backdrop-blur-md border-b border-gold-600/20 text-stone-100">
      {/* Top micro-bar for discreet notices */}
      <div className="bg-burgundy-950/40 border-b border-gold-600/10 py-1.5 px-6 text-center text-[11px] tracking-wide text-gold-200/80 flex justify-between items-center max-w-7xl mx-auto w-full">
        <span className="hidden md:inline">✨ Frete Expresso Grátis acima de R$250 • Parcelamento em até 6x</span>
        <span className="mx-auto md:mx-0 font-medium flex items-center gap-1">
          <Shield className="w-3 h-3 text-emerald-400" />
          Embalagens 100% Discretas e Sem Identificação Externa
        </span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          {/* Logo / Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full border border-gold-400/60 bg-gradient-to-tr from-burgundy-950 via-burgundy-900 to-burgundy-850 flex items-center justify-center shadow-lg relative flex-shrink-0">
              <span className="font-display font-bold text-sm text-gold-300 tracking-tighter">BN</span>
              <span 
                onClick={onOpenAdmin} 
                className="absolute top-0.5 right-1 text-[8px] text-gold-200 cursor-pointer select-none active:scale-125 transition-transform" 
                title="Área do Administrador"
              >
                ★
              </span>
            </div>
            <div>
              <span className="text-lg sm:text-xl font-extrabold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-gold-100 via-gold-300 to-gold-500 font-display">
                BELLE NUIT
              </span>
              <span className="block text-[8px] uppercase tracking-[0.3em] text-gold-400/90 font-medium leading-none mt-0.5">
                Moda Íntima & Sexshop
              </span>
            </div>
          </div>

          {/* Search bar */}
          <div className="hidden md:flex items-center relative max-w-xs w-full mx-8">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar lingeries, óleos ou toys..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-stone-900/60 border border-gold-600/20 rounded-full py-1.5 pl-9 pr-4 text-xs text-stone-100 placeholder-stone-400 focus:outline-hidden focus:border-gold-400/60 focus:ring-1 focus:ring-gold-400/30 transition-all"
            />
          </div>

          {/* Actions Menu */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            
            {/* Panic / Discreet Button */}
            <button
              id="discreet-mode-toggle"
              onClick={onEnableDiscreet}
              className="group flex items-center space-x-2 bg-burgundy-950/60 hover:bg-burgundy-900 border border-red-500/30 hover:border-red-400 text-red-200 px-3 py-1.5 sm:py-2 rounded-full text-xs font-semibold cursor-pointer transition-all shadow-xs"
              title="Tecla de Pânico: Esconde este site instantaneamente abrindo uma tela profissional"
            >
              <Shield className="w-3.5 h-3.5 text-red-400 animate-pulse group-hover:scale-110 transition-transform" />
              <span className="hidden sm:inline">Modo Discreto</span>
              <span className="bg-red-700 text-white text-[9px] px-1.5 py-0.2 rounded-md font-mono tracking-tighter">Pânico</span>
            </button>

            {/* Fale com a Loja Button */}
            <button
              id="contact-btn"
              onClick={onOpenContact}
              className="flex items-center space-x-1.5 bg-gold-500/10 hover:bg-gold-500/20 border border-gold-400/20 hover:border-gold-400/60 text-gold-200 px-3 py-1.5 sm:py-2 rounded-full text-xs font-semibold cursor-pointer transition-all"
            >
              <MessageCircle className="w-3.5 h-3.5 text-gold-400" />
              <span>Fale com a Loja</span>
            </button>

            {/* Shopping Cart Trigger */}
            <button
              id="cart-btn"
              onClick={onOpenCart}
              className="relative p-2 rounded-full bg-stone-900 border border-stone-800 hover:border-gold-400/40 text-stone-200 hover:text-gold-200 transition-all cursor-pointer"
            >
              <ShoppingBag className="w-5 h-5" />
              {totalCartItems > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-gradient-to-r from-gold-500 to-burgundy-600 text-white text-[10px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center shadow-md animate-bounce">
                  {totalCartItems}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center justify-between py-3 border-t border-gold-600/10 overflow-x-auto whitespace-nowrap scrollbar-none">
          <div className="flex space-x-2 sm:space-x-4">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-xs font-medium tracking-wide transition-all cursor-pointer ${
                  activeCategory === cat
                    ? "bg-gradient-to-r from-gold-500/20 to-burgundy-950/30 border border-gold-400 text-gold-200"
                    : "text-stone-400 hover:text-stone-100 hover:bg-stone-900 border border-transparent"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="text-xs text-stone-500 hidden md:block italic font-sans">
            Sensualidade com elegância e absoluto respeito.
          </div>
        </div>

        {/* Mobile Search Bar (Only shown on small screens) */}
        <div className="md:hidden pb-3">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar lingeries, óleos ou toys..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-stone-900/60 border border-gold-600/20 rounded-full py-1.5 pl-9 pr-4 text-xs text-stone-100 placeholder-stone-400 focus:outline-hidden focus:border-gold-400/60 focus:ring-1 focus:ring-gold-400/30 transition-all"
            />
          </div>
        </div>

      </div>
    </header>
  );
}
