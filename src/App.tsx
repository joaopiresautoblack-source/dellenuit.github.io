import React, { useState, useEffect } from "react";
import { 
  Flame, 
  ShieldCheck, 
  Truck, 
  MessageCircle, 
  Heart, 
  Star,
  Trash2,
  Lock,
  Compass,
  ChevronRight,
  Info,
  Instagram
} from "lucide-react";
import { Product, CartItem } from "./types";
import { EXAMPLE_PRODUCTS } from "./data";

// Import custom structured sub-components
import Header from "./components/Header";
import ProductCard from "./components/ProductCard";
import ProductDetailsModal from "./components/ProductDetailsModal";
import CartDrawer from "./components/CartDrawer";
import ContactModal from "./components/ContactModal";
import DiscreetView from "./components/DiscreetView";
import AdminModal from "./components/AdminModal";

export default function App() {
  // Discreet Mode (Panic button state)
  const [discreetMode, setDiscreetMode] = useState<boolean>(false);

  // Products list from local storage or empty by default
  const [products, setProducts] = useState<Product[]>([]);
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);

  // Search & Catalog Filter states
  const [activeCategory, setActiveCategory] = useState<string>("Tudo");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Drawer & Modal control states
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isContactOpen, setIsContactOpen] = useState<boolean>(false);

  // Local storage persisted state: Cart & Favorites
  const [cart, setCart] = useState<CartItem[]>([]);
  const [favorites, setFavorites] = useState<Product[]>([]);

  // Toast / Feedback state
  const [toastMessage, setToastMessage] = useState<string>("");

  // Load products, cart & favorites on mount
  useEffect(() => {
    const savedCart = localStorage.getItem("bellenuit_cart");
    const savedFavorites = localStorage.getItem("bellenuit_favorites");
    const savedProducts = localStorage.getItem("bellenuit_products");

    if (savedProducts) {
      try {
        setProducts(JSON.parse(savedProducts));
      } catch (e) {
        console.error("Erro carregando produtos:", e);
        setProducts(EXAMPLE_PRODUCTS);
        localStorage.setItem("bellenuit_products", JSON.stringify(EXAMPLE_PRODUCTS));
      }
    } else {
      setProducts(EXAMPLE_PRODUCTS);
      localStorage.setItem("bellenuit_products", JSON.stringify(EXAMPLE_PRODUCTS));
    }

    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error("Erro carregando carrinho:", e);
      }
    }
    if (savedFavorites) {
      try {
        setFavorites(JSON.parse(savedFavorites));
      } catch (e) {
        console.error("Erro carregando favoritos:", e);
      }
    }
  }, []);

  // Save products on changes
  const saveProductsToLocalStorage = (newProducts: Product[]) => {
    setProducts(newProducts);
    localStorage.setItem("bellenuit_products", JSON.stringify(newProducts));
  };

  // Save cart on changes
  const saveCartToLocalStorage = (newCart: CartItem[]) => {
    setCart(newCart);
    localStorage.setItem("bellenuit_cart", JSON.stringify(newCart));
  };

  // Save favorites on changes
  const saveFavoritesToLocalStorage = (newFavorites: Product[]) => {
    setFavorites(newFavorites);
    localStorage.setItem("bellenuit_favorites", JSON.stringify(newFavorites));
  };

  // Add item to cart
  const handleAddToCart = (product: Product, quantity: number, size?: string, color?: string) => {
    const existingIndex = cart.findIndex(
      item => 
        item.product.id === product.id && 
        item.selectedSize === size && 
        item.selectedColor === color
    );

    let updatedCart = [...cart];
    if (existingIndex > -1) {
      updatedCart[existingIndex].quantity += quantity;
    } else {
      updatedCart.push({
        product,
        quantity,
        selectedSize: size,
        selectedColor: color
      });
    }

    saveCartToLocalStorage(updatedCart);
    showToast(`Adicionado ao Carrinho: ${product.name}`);
  };

  // Update item quantity in cart
  const handleUpdateQuantity = (productId: string, quantity: number, size?: string, color?: string) => {
    const updatedCart = cart.map(item => {
      if (item.product.id === productId && item.selectedSize === size && item.selectedColor === color) {
        return { ...item, quantity };
      }
      return item;
    });
    saveCartToLocalStorage(updatedCart);
  };

  // Remove item from cart
  const handleRemoveItem = (productId: string, size?: string, color?: string) => {
    const updatedCart = cart.filter(
      item => 
        !(item.product.id === productId && item.selectedSize === size && item.selectedColor === color)
    );
    saveCartToLocalStorage(updatedCart);
    showToast("Item removido do carrinho.");
  };

  // Clear entire cart
  const handleClearCart = () => {
    saveCartToLocalStorage([]);
  };

  // Toggle favorite product
  const handleToggleFavorite = (product: Product) => {
    const isFav = favorites.some(fav => fav.id === product.id);
    let updatedFavs;
    if (isFav) {
      updatedFavs = favorites.filter(fav => fav.id !== product.id);
      showToast("Removido dos Favoritos.");
    } else {
      updatedFavs = [...favorites, product];
      showToast("Adicionado aos Favoritos!");
    }
    saveFavoritesToLocalStorage(updatedFavs);
  };

  // Toast feedback triggering
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage("");
    }, 3000);
  };

  // Filter products based on search term and category
  const filteredProducts = products.filter((p) => {
    const matchesCategory = activeCategory === "Tudo" || p.category === activeCategory;
    const matchesSearch = 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Revert / Exit discreet mode
  const disableDiscreetMode = () => {
    setDiscreetMode(false);
    showToast("Sessão reestabelecida com segurança.");
  };

  // If in Discreet Mode, render corporate system instantly
  if (discreetMode) {
    return <DiscreetView onDisable={disableDiscreetMode} />;
  }

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans antialiased selection:bg-rose-500/30 selection:text-amber-200">
      
      {/* Dynamic Toast Popup */}
      {toastMessage && (
        <div className="fixed bottom-6 left-6 z-50 bg-stone-900 border border-amber-500/40 text-amber-200 text-xs font-semibold px-4 py-3 rounded-xl shadow-2xl flex items-center space-x-2 animate-bounce">
          <Flame className="w-4 h-4 text-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Header Component */}
      <Header
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
        onEnableDiscreet={() => setDiscreetMode(true)}
        cart={cart}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenContact={() => setIsContactOpen(true)}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        onOpenAdmin={() => setIsAdminOpen(true)}
      />

      {/* Hero / Banner Section (Only shown when category is "Tudo" and search is empty) */}
      {activeCategory === "Tudo" && !searchTerm && (
        <section className="relative overflow-hidden bg-radial from-burgundy-900/40 via-stone-950 to-stone-950 py-20 sm:py-28 border-b border-gold-600/10">
          {/* Subtle Ambient Background Ornaments */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-burgundy-800/15 rounded-full filter blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gold-600/5 rounded-full filter blur-3xl pointer-events-none"></div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-8">
            <div className="space-y-5 max-w-3xl mx-auto">
              {/* Premium Floating Badge */}
              <div className="inline-flex items-center space-x-1.5 bg-gold-500/10 border border-gold-400/20 text-gold-200 px-4 py-1.5 rounded-full text-[10px] uppercase tracking-[0.2em] font-semibold">
                <Flame className="w-3.5 h-3.5 text-gold-400 animate-pulse" />
                <span>Alta Lingerie & Cosmética Sensorial Premium</span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-medium tracking-wide text-stone-100 font-display leading-tight">
                Elegância que desperta os{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-100 via-gold-300 to-gold-500 italic">
                  sentidos
                </span>
              </h1>
              
              <p className="text-sm sm:text-base text-stone-400 leading-relaxed max-w-2xl mx-auto font-sans font-light">
                Descubra uma curadoria exclusiva de lingeries luxuosas e sensuais, moda noite refinada e tecnologia íntima silenciosa de alto bem-estar. Compre com entrega 100% segura, discreta e confidencial.
              </p>
            </div>

            {/* Core Action triggers */}
            <div className="flex flex-col sm:flex-row justify-center items-center gap-3 pt-4">
              <button
                onClick={() => setIsContactOpen(true)}
                className="w-full sm:w-auto bg-gradient-to-r from-gold-500 via-gold-300 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-burgundy-950 font-extrabold uppercase tracking-[0.2em] text-xs py-4 px-12 rounded-full shadow-xl hover:scale-102 cursor-pointer transition-all flex items-center justify-center space-x-2.5 border border-gold-300/30"
              >
                <MessageCircle className="w-4.5 h-4.5 text-burgundy-950 fill-burgundy-950/10" />
                <span>Fale com a Loja</span>
              </button>
            </div>

            {/* Quick trust metrics row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto pt-12 border-t border-gold-600/10">
              <div className="flex items-center space-x-3 text-left">
                <div className="p-2.5 bg-burgundy-950/40 rounded-xl border border-gold-600/15">
                  <ShieldCheck className="w-5 h-5 text-gold-400" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-stone-200 uppercase tracking-wide">Embalagem Neutra</h4>
                  <p className="text-[10px] text-stone-500 mt-0.5">Sem logotipo ou referências externas.</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 text-left">
                <div className="p-2.5 bg-burgundy-950/40 rounded-xl border border-gold-600/15">
                  <Truck className="w-5 h-5 text-gold-400" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-stone-200 uppercase tracking-wide">Frete Expresso</h4>
                  <p className="text-[10px] text-stone-500 mt-0.5">Recebimento no conforto de sua casa.</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 text-left">
                <div className="p-2.5 bg-burgundy-950/40 rounded-xl border border-gold-600/15">
                  <Lock className="w-5 h-5 text-gold-400" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-stone-200 uppercase tracking-wide">Teclado de Pânico</h4>
                  <p className="text-[10px] text-stone-500 mt-0.5">Modo Discreto com um clique para sua privacidade.</p>
                </div>
              </div>
            </div>

          </div>
        </section>
      )}

      {/* Main Catalog View Area */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8">
        
        {/* Title indicating what is active */}
        <div className="flex justify-between items-center pb-4 border-b border-gold-600/10">
          <div>
            <span className="text-xs text-stone-500 font-bold uppercase tracking-widest">Nossa Curadoria</span>
            <h2 className="text-lg sm:text-2xl font-bold tracking-tight text-stone-100 flex items-center space-x-2 font-display">
              <Compass className="w-5 h-5 text-gold-400" />
              <span>{activeCategory === "Tudo" ? "Coleção Completa" : activeCategory}</span>
              {searchTerm && <span className="text-xs font-normal text-stone-500">• Buscando por "{searchTerm}"</span>}
            </h2>
          </div>
          
          <div className="text-xs text-stone-400 font-medium">
            Exibindo <span className="text-gold-300 font-bold">{filteredProducts.length}</span> produtos
          </div>
        </div>

        {/* Catalog Grid */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16 space-y-4">
            <div className="w-16 h-16 bg-stone-900 border border-stone-850 rounded-full flex items-center justify-center mx-auto text-stone-500">
              <Info className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-stone-300 font-display">Nenhum produto encontrado</h3>
              <p className="text-xs text-stone-500 max-w-xs mx-auto">Não encontramos itens que correspondam ao seu termo de busca nesta categoria.</p>
            </div>
            <button
              onClick={() => {
                setSearchTerm("");
                setActiveCategory("Tudo");
              }}
              className="bg-stone-900 hover:bg-stone-850 border border-stone-800 text-gold-300 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer"
            >
              Limpar Filtros e Busca
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onSelectProduct={(p) => setSelectedProduct(p)}
                onAddToFavorites={handleToggleFavorite}
                isFavorite={favorites.some(fav => fav.id === product.id)}
              />
            ))}
          </div>
        )}

        {/* Favorites section (Only shown if user has any favorited items) */}
        {favorites.length > 0 && (
          <section className="pt-12 border-t border-gold-600/10 space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-xs text-stone-500 font-bold uppercase tracking-widest">Favoritos</span>
                <h3 className="text-base sm:text-lg font-bold text-stone-200 flex items-center space-x-1.5 font-display">
                  <Heart className="w-4 h-4 text-red-600 fill-red-600" />
                  <span>Sua lista de desejos salvos</span>
                </h3>
              </div>
              <button
                onClick={() => saveFavoritesToLocalStorage([])}
                className="text-[10px] sm:text-xs text-stone-500 hover:text-stone-300 underline cursor-pointer"
              >
                Limpar Favoritos
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {favorites.map((product) => (
                <div 
                  key={`fav-${product.id}`}
                  className="flex items-center justify-between bg-stone-950/40 p-3 rounded-2xl border border-stone-900"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <img
                      src={product.image}
                      alt={product.name}
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 object-cover rounded-xl bg-stone-900"
                    />
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-stone-100 truncate font-display">{product.name}</h4>
                      <span className="text-xs text-gold-300 font-semibold">
                        {product.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => setSelectedProduct(product)}
                      className="text-xs text-stone-300 hover:text-gold-200 bg-stone-900 px-3 py-1.5 rounded-lg border border-stone-850 cursor-pointer"
                    >
                      Ver
                    </button>
                    <button
                      onClick={() => handleToggleFavorite(product)}
                      className="text-stone-600 hover:text-red-500 p-1.5 rounded-md cursor-pointer"
                      title="Excluir favorito"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

      </main>

      {/* Footer Area */}
      <footer className="bg-stone-950 border-t border-gold-600/10 mt-20 py-12 text-stone-400 text-xs font-sans">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full border border-gold-400/40 bg-gradient-to-tr from-burgundy-950 to-burgundy-900 flex items-center justify-center">
                <span className="font-display font-bold text-xs text-gold-300">BN</span>
              </div>
              <span className="font-bold text-stone-200 tracking-widest uppercase font-display">BELLE NUIT</span>
            </div>
            <p className="text-stone-500 leading-relaxed max-w-xs">
              A melhor e mais discreta experiência de e-commerce de moda íntima de luxo, lingerie sofisticada e bem-estar sensorial do país.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="font-bold text-stone-200 uppercase tracking-widest">Segurança e Discrição</h4>
            <ul className="space-y-2 text-stone-500">
              <li className="flex items-center gap-1.5">✓ Caixa parda (uso de sacola preta discreta).</li>
              <li className="flex items-center gap-1.5">✓ Entregas locais apenas com sacola preta discreta.</li>
              <li className="flex items-center gap-1.5">✓ Sem referência a sexshop ou produtos na fatura do cartão.</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-bold text-stone-200 uppercase tracking-widest">Precisa de Ajuda?</h4>
            <p className="text-stone-500 leading-relaxed">
              Fale diretamente com nossa equipe de atendimento exclusiva para esclarecer dúvidas sobre produtos, tamanhos ou frete de forma segura e confidencial.
            </p>
            <div className="pt-2">
              <button 
                onClick={() => setIsContactOpen(true)}
                className="text-xs text-gold-400 hover:text-gold-300 font-bold underline flex items-center cursor-pointer gap-1"
              >
                Falar com Atendimento <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 mt-8 border-t border-stone-900/60 flex flex-col sm:flex-row justify-between items-center text-stone-600">
          <p 
            onDoubleClick={() => setIsAdminOpen(true)} 
            className="cursor-default select-none hover:text-stone-500 transition-colors" 
            title="Acesso Restrito (Duplo clique)"
          >
            © 2026 Belle Nuit Moda Íntima Ltda. Campo Grande - MS.
          </p>
          <p className="mt-2 sm:mt-0 flex items-center gap-1">
            Desenvolvido com elegância, respeito e total confidencialidade.
            <span 
              onClick={() => setIsAdminOpen(true)} 
              className="cursor-pointer text-stone-950/20 hover:text-gold-400/30 transition-all ml-1" 
              title="Acesso do Administrador"
            >
              <Lock className="w-3 h-3" />
            </span>
          </p>
        </div>
      </footer>

      {/* Cart Drawer Panel (Slide out right) */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
      />

      {/* Product Details Modal (Overlay centered) */}
      <ProductDetailsModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={handleAddToCart}
        onAddToFavorites={handleToggleFavorite}
        isFavorite={selectedProduct ? favorites.some(fav => fav.id === selectedProduct.id) : false}
      />

      {/* Contact & Support Modal (Overlay centered) */}
      <ContactModal
        isOpen={isContactOpen}
        onClose={() => setIsContactOpen(false)}
      />

      {/* Admin Panel Modal (Hidden) */}
      <AdminModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        products={products}
        onSaveProducts={saveProductsToLocalStorage}
        showToast={showToast}
      />

      {/* Floating Action Buttons */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col sm:flex-row items-end sm:items-center gap-3">
        {/* Floating Instagram Button */}
        <a
          href="https://www.instagram.com/bellenuit.cg?igsh=MTNzMTA1dmRsZ3NlZA%3D%3D&utm_source=qr"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-600 hover:opacity-95 text-stone-100 p-4 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all flex items-center justify-center border border-pink-500/20 group cursor-pointer"
          title="Siga-nos no Instagram"
        >
          <Instagram className="w-6 h-6 group-hover:rotate-12 transition-transform" />
          <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 ease-in-out whitespace-nowrap text-xs font-bold font-sans tracking-wide">
            <span className="pl-2 pr-1 font-sans">Instagram</span>
          </span>
        </a>

        {/* Floating WhatsApp Button */}
        <a
          href="https://wa.me/5567998679457?text=Ol%C3%A1%21%20Gostaria%20de%20um%20atendimento%20personalizado%20e%20discreto%20sobre%20os%20produtos%20Belle%20Nuit."
          target="_blank"
          rel="noopener noreferrer"
          className="bg-emerald-600 hover:bg-emerald-500 text-stone-100 p-4 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all flex items-center justify-center border border-emerald-400/20 group cursor-pointer relative"
          title="Falar com a Loja no WhatsApp"
        >
          <MessageCircle className="w-6 h-6 fill-stone-100/10 group-hover:rotate-12 transition-transform" />
          <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 ease-in-out whitespace-nowrap text-xs font-bold font-sans tracking-wide">
            <span className="pl-2 pr-1 font-sans">Falar com a Loja</span>
          </span>
          <span className="absolute -top-1 -right-1 bg-gold-400 w-3 h-3 rounded-full border border-stone-900 animate-pulse"></span>
        </a>
      </div>

    </div>
  );
}
