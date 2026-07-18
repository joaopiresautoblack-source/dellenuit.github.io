import React, { useState } from "react";
import { X, MessageCircle, Mail, Clock, ShieldCheck, Check, Send, Instagram } from "lucide-react";

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ContactModal({ isOpen, onClose }: ContactModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) return;

    setLoading(true);
    // Simulate a secure API submission
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      setName("");
      setEmail("");
      setMessage("");
    }, 1200);
  };

  const handleWhatsAppClick = () => {
    // Elegant preset text for discreet WhatsApp contact
    const text = encodeURIComponent("Olá! Gostaria de um atendimento personalizado e discreto sobre os produtos Belle Nuit.");
    try {
      window.open(`https://wa.me/5567998679457?text=${text}`, "_blank");
    } catch (err) {
      console.warn("Bloqueado pelo popup blocker do iframe:", err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto font-sans" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-stone-950/85 backdrop-blur-md transition-opacity"
      ></div>

      <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-6">
        <div className="relative transform overflow-hidden rounded-3xl bg-burgundy-950 border border-gold-600/20 text-left shadow-2xl transition-all sm:my-8 w-full max-w-xl max-h-[90vh] flex flex-col">
          
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 z-10 p-2 rounded-full bg-stone-950/60 text-gold-300 hover:text-gold-100 cursor-pointer border border-stone-850 hover:border-gold-400/30 transition-all"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="p-6 border-b border-burgundy-850 bg-stone-950/90 flex items-center space-x-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-gold-500 to-burgundy-600 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-md sm:text-lg font-display font-bold tracking-wide text-gold-200">Fale com a Belle Nuit</h2>
              <span className="block text-[10px] text-gold-400 uppercase font-semibold tracking-wider">Atendimento Especializado e Totalmente Discreto</span>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 p-6 sm:p-8 overflow-y-auto max-h-[60vh] space-y-6">
            
            {/* Quick trust banner */}
            <div className="bg-burgundy-900/40 border border-gold-600/20 rounded-2xl p-4 flex items-start space-x-3 text-xs text-gold-200">
              <ShieldCheck className="w-5 h-5 text-gold-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold block text-gold-100">Sua privacidade é nossa prioridade absoluta</span>
                <span className="text-stone-300 block">Todos os contatos são mantidos em sigilo absoluto. Não compartilhamos seus dados e respondemos de maneira totalmente discreta e impessoal no seu extrato ou e-mail.</span>
              </div>
            </div>

            {/* Support channels */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* WhatsApp card */}
              <button
                type="button"
                onClick={handleWhatsAppClick}
                className="flex items-center space-x-3 bg-stone-950/40 hover:bg-stone-950 border border-stone-800 hover:border-gold-400/40 p-4 rounded-2xl text-left transition-all cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                  <MessageCircle className="w-5 h-5 fill-emerald-400/10" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-stone-200">WhatsApp</h4>
                  <span className="block text-[10px] text-emerald-400 font-semibold uppercase tracking-wider mt-0.5">Fale Agora</span>
                  <span className="block text-[10px] text-stone-400 mt-0.5">(67) 99867-9457</span>
                </div>
              </button>

              {/* Instagram Card */}
              <a
                href="https://www.instagram.com/bellenuit.cg?igsh=MTNzMTA1dmRsZ3NlZA%3D%3D&utm_source=qr"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-3 bg-stone-950/40 hover:bg-stone-950 border border-stone-800 hover:border-gold-400/40 p-4 rounded-2xl text-left transition-all cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-xl bg-pink-500/10 text-pink-400 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                  <Instagram className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-stone-200">Instagram</h4>
                  <span className="block text-[10px] text-pink-400 font-semibold uppercase tracking-wider mt-0.5">Siga-nos</span>
                  <span className="block text-[10px] text-stone-400 mt-0.5">@bellenuit.cg</span>
                </div>
              </a>

              {/* Email Card */}
              <div className="flex items-center space-x-3 bg-stone-950/40 border border-stone-800 p-4 rounded-2xl">
                <div className="w-10 h-10 rounded-xl bg-gold-500/10 text-gold-400 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-stone-200">E-mail</h4>
                  <span className="block text-[10px] text-gold-400 font-semibold mt-0.5">contato@bellenuit...</span>
                  <span className="block text-[10px] text-stone-500 mt-0.5">Retorno rápido</span>
                </div>
              </div>
            </div>

            {/* Work hours info */}
            <div className="flex items-center space-x-2 text-[11px] text-stone-400 bg-stone-950/20 border border-stone-800/40 p-3 rounded-xl">
              <Clock className="w-3.5 h-3.5 text-gold-400" />
              <span>Horário de atendimento: Segunda a Sábado, das 09h às 21h (Horário de Brasília).</span>
            </div>

            {/* Direct Contact Form */}
            <div className="pt-4 border-t border-burgundy-800/40">
              <h3 className="text-sm font-bold text-stone-200 mb-4">Envie uma mensagem direta</h3>
              
              {submitted ? (
                <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-2xl p-5 text-center space-y-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto text-emerald-400">
                    <Check className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-stone-200">Mensagem Enviada com Sucesso!</h4>
                  <p className="text-stone-400 max-w-sm mx-auto">Sua solicitação foi enviada aos nossos atendentes de forma confidencial. Responderemos ao seu e-mail de maneira extremamente discreta em breve.</p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="text-[10px] font-bold uppercase tracking-wider text-gold-400 hover:text-gold-300 pt-2 underline cursor-pointer"
                  >
                    Enviar outra mensagem
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider">Seu Nome</label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Como gostaria de ser chamado"
                        className="w-full bg-stone-950 border border-stone-850 focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/30 rounded-xl px-4 py-2.5 text-xs text-stone-200 placeholder-stone-600 focus:outline-hidden transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider">Seu E-mail</label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Para resposta confidencial"
                        className="w-full bg-stone-950 border border-stone-850 focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/30 rounded-xl px-4 py-2.5 text-xs text-stone-200 placeholder-stone-600 focus:outline-hidden transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider">Mensagem ou Dúvida</label>
                    <textarea
                      required
                      rows={3}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Descreva o que precisa (dúvidas sobre tamanhos, materiais, envio discreto ou curadoria)..."
                      className="w-full bg-stone-950 border border-stone-850 focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/30 rounded-xl p-4 text-xs text-stone-200 placeholder-stone-600 focus:outline-hidden resize-none transition-all"
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-gold-500 to-burgundy-600 hover:from-gold-400 hover:to-burgundy-500 text-white font-extrabold uppercase tracking-widest text-xs py-3 rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-55"
                  >
                    {loading ? (
                      <span className="flex items-center space-x-1">
                        <span className="animate-pulse">Transmitindo de forma segura...</span>
                      </span>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Enviar Mensagem Segura</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>

          </div>

          {/* Secure disclaimer footer */}
          <div className="p-4 bg-stone-950 border-t border-stone-800/80 text-center text-[10px] text-stone-500">
            Todas as comunicações são protegidas por protocolos de criptografia de ponta-a-ponta.
          </div>

        </div>
      </div>
    </div>
  );
}
