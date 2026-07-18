import React, { useState } from "react";
import { X, Trash2, Shield, CreditCard, Sparkles, ShoppingBag, ArrowRight } from "lucide-react";
import { CartItem } from "../types";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number, size?: string, color?: string) => void;
  onRemoveItem: (productId: string, size?: string, color?: string) => void;
  onClearCart: () => void;
}

export default function CartDrawer({
  isOpen,
  onClose,
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart
}: CartDrawerProps) {
  const [coupon, setCoupon] = useState("");
  const [discount, setDiscount] = useState(0); // Percentage
  const [couponError, setCouponError] = useState("");
  const [couponSuccess, setCouponSuccess] = useState("");
  const [isCheckoutSimulated, setIsCheckoutSimulated] = useState(false);
  const [checkoutName, setCheckoutName] = useState("");
  const [checkoutPhone, setCheckoutPhone] = useState("");
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [validationError, setValidationError] = useState("");

  if (!isOpen) return null;

  // Pricing math
  const subtotal = cart.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
  const freeShippingThreshold = 250;
  const leftForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);
  const shippingCost = subtotal >= freeShippingThreshold || subtotal === 0 ? 0 : 19.90;
  
  const discountAmount = subtotal * (discount / 100);
  const total = subtotal - discountAmount + shippingCost;

  // Coupon handling
  const applyCoupon = () => {
    const cleanCoupon = coupon.trim().toUpperCase();
    if (cleanCoupon === "AMOR10" || cleanCoupon === "SENSUELLE") {
      setDiscount(10);
      setCouponSuccess("Cupom aplicado com sucesso! 10% de desconto.");
      setCouponError("");
    } else if (cleanCoupon === "TOYS20") {
      setDiscount(20);
      setCouponSuccess("Cupom de Inauguração de 20% aplicado!");
      setCouponError("");
    } else {
      setCouponError("Cupom inválido ou expirado.");
      setCouponSuccess("");
    }
  };

  // WhatsApp dispatch generation
  const handleWhatsAppCheckout = () => {
    if (!checkoutName || !checkoutPhone) {
      setValidationError("Por favor, preencha seu nome e contato para finalizar.");
      return;
    }
    setValidationError("");

    const itemDetails = cart.map((item, idx) => {
      const sizeText = item.selectedSize ? ` (Tamanho: ${item.selectedSize})` : "";
      const colorText = item.selectedColor ? ` (Opção: ${item.selectedColor})` : "";
      return `${idx + 1}. ${item.product.name} x${item.quantity}${sizeText}${colorText} - R$ ${(item.product.price * item.quantity).toFixed(2)}`;
    }).join("\n");

    const message = `Olá Sensuelle! Gostaria de finalizar meu pedido:

*Cliente:* ${checkoutName}
*Contato:* ${checkoutPhone}

*Produtos:*
${itemDetails}

*Subtotal:* R$ ${subtotal.toFixed(2)}
*Desconto:* R$ ${discountAmount.toFixed(2)}
*Frete:* ${shippingCost === 0 ? "Expresso" : `R$ ${shippingCost.toFixed(2)}`}
*Total:* R$ ${total.toFixed(2)}

_Aguardo instruções para o envio discreto._`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://api.whatsapp.com/send?phone=5511999999999&text=${encodedMessage}`;
    
    // Simulate order success
    setCheckoutSuccess(true);
    setTimeout(() => {
      try {
        window.open(whatsappUrl, "_blank");
      } catch (err) {
        console.warn("Bloqueado pelo popup blocker:", err);
      }
    }, 1000);
  };

  const handleMockPayment = () => {
    if (!checkoutName || !checkoutPhone) {
      setValidationError("Por favor, preencha seu nome e telefone para prosseguir.");
      return;
    }
    setValidationError("");
    setCheckoutSuccess(true);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" aria-labelledby="slide-over-title" role="dialog" aria-modal="true">
      <div className="absolute inset-0 overflow-hidden">
        
        {/* Backdrop filter */}
        <div 
          onClick={onClose}
          className="absolute inset-0 bg-stone-950/70 backdrop-blur-xs transition-opacity"
        ></div>

        <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
          <div className="pointer-events-auto w-screen max-w-md">
            <div className="flex h-full flex-col bg-stone-900 border-l border-amber-950/20 text-stone-100 shadow-2xl">
              
              {/* Drawer Header */}
              <div className="p-6 border-b border-stone-800 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <ShoppingBag className="w-5 h-5 text-amber-500" />
                  <h2 className="text-lg font-bold tracking-wide">Meu Carrinho</h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-stone-800 text-stone-400 hover:text-stone-100 cursor-pointer transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Scroll Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* Free Shipping Progress Meter */}
                {cart.length > 0 && (
                  <div className="bg-stone-950/50 p-4 rounded-2xl border border-stone-800/80 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-stone-400 font-medium">
                        {leftForFreeShipping > 0 
                          ? `Faltam R$ ${leftForFreeShipping.toFixed(2)} para Frete Expresso!` 
                          : "🎉 Você ganhou Frete Expresso!"}
                      </span>
                      <span className="font-bold text-amber-400">Meta: R$ 250,00</span>
                    </div>
                    <div className="w-full bg-stone-800 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-amber-500 to-rose-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, (subtotal / 250) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Cart Items List */}
                {cart.length === 0 ? (
                  <div className="text-center py-12 space-y-4">
                    <div className="w-16 h-16 bg-stone-800/50 rounded-full flex items-center justify-center mx-auto">
                      <ShoppingBag className="w-8 h-8 text-stone-500" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-stone-300">Seu carrinho está vazio</h3>
                      <p className="text-xs text-stone-500 mt-1 max-w-xs mx-auto">
                        Explore nosso catálogo de lingeries de luxo e bem-estar íntimo para começar.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cart.map((item, index) => (
                      <div 
                        key={`${item.product.id}-${item.selectedSize}-${item.selectedColor}`} 
                        className="flex space-x-3 bg-stone-950/30 p-3 rounded-2xl border border-stone-800/60"
                      >
                        <img
                          src={item.product.image}
                          alt={item.product.name}
                          referrerPolicy="no-referrer"
                          className="w-16 h-16 object-cover rounded-xl bg-stone-900"
                        />
                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                          <div>
                            <h4 className="text-xs sm:text-sm font-bold text-stone-100 truncate">{item.product.name}</h4>
                            <div className="flex flex-wrap gap-1.5 mt-1 text-[10px] text-stone-400">
                              {item.selectedSize && (
                                <span className="bg-stone-850 px-1.5 py-0.5 rounded-sm border border-stone-800">
                                  Tam: {item.selectedSize}
                                </span>
                              )}
                              {item.selectedColor && (
                                <span className="bg-stone-850 px-1.5 py-0.5 rounded-sm border border-stone-800 truncate max-w-[120px]">
                                  {item.selectedColor}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center justify-between mt-2">
                            {/* Quantity Controls */}
                            <div className="flex items-center bg-stone-950 p-0.5 rounded-full border border-stone-800">
                              <button
                                onClick={() => onUpdateQuantity(item.product.id, Math.max(1, item.quantity - 1), item.selectedSize, item.selectedColor)}
                                className="w-5 h-5 flex items-center justify-center text-stone-400 hover:text-stone-200 cursor-pointer text-xs"
                              >
                                -
                              </button>
                              <span className="text-xs font-bold px-2 text-stone-200">{item.quantity}</span>
                              <button
                                onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1, item.selectedSize, item.selectedColor)}
                                className="w-5 h-5 flex items-center justify-center text-stone-400 hover:text-stone-200 cursor-pointer text-xs"
                              >
                                +
                              </button>
                            </div>

                            {/* Price / Delete */}
                            <div className="flex items-center space-x-2">
                              <span className="text-xs font-bold text-amber-200">
                                R$ {(item.product.price * item.quantity).toFixed(2)}
                              </span>
                              <button
                                onClick={() => onRemoveItem(item.product.id, item.selectedSize, item.selectedColor)}
                                className="text-stone-500 hover:text-rose-400 p-1 rounded-md cursor-pointer transition-colors"
                                title="Remover item"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Promo Coupon Module */}
                {cart.length > 0 && !isCheckoutSimulated && (
                  <div className="space-y-2 pt-4 border-t border-stone-800">
                    <label className="text-xs font-bold text-stone-400 uppercase tracking-wider">Cupom de Desconto</label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        placeholder="Ex: AMOR10, TOYS20"
                        value={coupon}
                        onChange={(e) => setCoupon(e.target.value)}
                        className="flex-1 bg-stone-950 border border-stone-800 rounded-xl px-3 py-1.5 text-xs text-stone-100 placeholder-stone-600 focus:outline-hidden focus:border-amber-500"
                      />
                      <button
                        onClick={applyCoupon}
                        className="bg-stone-800 hover:bg-stone-700 text-stone-200 px-4 py-1.5 rounded-xl text-xs font-semibold cursor-pointer border border-stone-700 transition-colors"
                      >
                        Aplicar
                      </button>
                    </div>
                    {couponError && <p className="text-[10px] text-rose-400">{couponError}</p>}
                    {couponSuccess && <p className="text-[10px] text-emerald-400">{couponSuccess}</p>}
                    <p className="text-[9px] text-stone-500 italic">Dica: Use AMOR10 para ganhar 10% de desconto!</p>
                  </div>
                )}

                {/* Checkout Simulation Pane */}
                {cart.length > 0 && isCheckoutSimulated && !checkoutSuccess && (
                  <div className="bg-stone-950/40 p-4 rounded-2xl border border-amber-950/10 space-y-3 pt-4">
                    <div className="flex justify-between items-center pb-2 border-b border-stone-800">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400">Dados do Destinatário</h3>
                      <button 
                        onClick={() => setIsCheckoutSimulated(false)}
                        className="text-[10px] text-stone-400 hover:text-stone-200 underline cursor-pointer"
                      >
                        Voltar ao Carrinho
                      </button>
                    </div>

                    <div className="space-y-2.5">
                      <div>
                        <label className="text-[10px] text-stone-400 font-semibold block mb-1">Nome Completo (Discreto)</label>
                        <input
                          type="text"
                          required
                          value={checkoutName}
                          onChange={(e) => setCheckoutName(e.target.value)}
                          placeholder="Ex: João da Silva"
                          className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-1.5 text-xs text-stone-100"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-stone-400 font-semibold block mb-1">Celular / WhatsApp</label>
                        <input
                          type="tel"
                          required
                          value={checkoutPhone}
                          onChange={(e) => setCheckoutPhone(e.target.value)}
                          placeholder="Ex: (11) 99999-9999"
                          className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-1.5 text-xs text-stone-100"
                        />
                      </div>
                    </div>
                    {validationError && (
                      <p className="text-xs text-red-400 font-medium mt-1">{validationError}</p>
                    )}
                  </div>
                )}

                {/* Checkout Success screen */}
                {checkoutSuccess && (
                  <div className="text-center py-8 space-y-4 bg-emerald-950/10 p-5 rounded-2xl border border-emerald-500/20">
                    <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                      ✓
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-emerald-400">Pedido Simulado com Sucesso!</h3>
                      <p className="text-xs text-stone-400 mt-2">
                        Seu pedido foi formatado e estamos redirecionando você para o nosso suporte personalizado via WhatsApp.
                      </p>
                      <p className="text-[10px] text-stone-500 mt-1">
                        Sua privacidade é nossa prioridade. Em breve entraremos em contato de forma discreta!
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setCheckoutSuccess(false);
                        setIsCheckoutSimulated(false);
                        onClearCart();
                        onClose();
                      }}
                      className="text-xs text-amber-400 underline hover:text-amber-300 font-semibold cursor-pointer"
                    >
                      Limpar Carrinho e Iniciar Novo
                    </button>
                  </div>
                )}

              </div>

              {/* Drawer Footer Price Summary */}
              {cart.length > 0 && !checkoutSuccess && (
                <div className="p-6 border-t border-stone-800 bg-stone-950/80 space-y-4">
                  
                  {/* Ledger Breakdown */}
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between text-stone-400">
                      <span>Subtotal</span>
                      <span>R$ {subtotal.toFixed(2)}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-emerald-400 font-medium">
                        <span>Desconto ({discount}%)</span>
                        <span>- R$ {discountAmount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-stone-400">
                      <span>Frete (Embalagem Discreta)</span>
                      <span>{shippingCost === 0 ? "Expresso" : `R$ ${shippingCost.toFixed(2)}`}</span>
                    </div>
                    <div className="flex justify-between text-base font-bold text-stone-100 pt-2 border-t border-stone-800">
                      <span>Total Geral</span>
                      <span className="text-amber-200">R$ {total.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Actions buttons */}
                  {!isCheckoutSimulated ? (
                    <button
                      onClick={() => setIsCheckoutSimulated(true)}
                      className="w-full bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-white py-3 rounded-2xl text-xs font-extrabold uppercase tracking-widest flex items-center justify-center space-x-2 shadow-lg hover:scale-101 cursor-pointer transition-all"
                    >
                      <span>Prosseguir para Checkout</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={handleWhatsAppCheckout}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 px-3 rounded-xl text-[11px] font-extrabold uppercase tracking-wide flex items-center justify-center space-x-1 cursor-pointer transition-colors"
                      >
                        <span>Finalizar Whats</span>
                      </button>
                      <button
                        onClick={handleMockPayment}
                        className="bg-amber-500 hover:bg-amber-400 text-stone-950 py-2.5 px-3 rounded-xl text-[11px] font-extrabold uppercase tracking-wide flex items-center justify-center space-x-1 cursor-pointer transition-colors"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Pagar Seguro</span>
                      </button>
                    </div>
                  )}

                  {/* Anti-compromise guarantee icon bar */}
                  <div className="flex items-center justify-center space-x-1.5 text-[10px] text-stone-500">
                    <Shield className="w-3.5 h-3.5 text-amber-500" />
                    <span>Embalagem Parda • Sem Nome da Loja na Caixa</span>
                  </div>

                </div>
              )}

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
