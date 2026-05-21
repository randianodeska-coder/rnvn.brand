"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useCartStore } from "@/store/useCartStore";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getCartTotal } = useCartStore();
  const [mounted, setMounted] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [postcode, setPostcode] = useState("");

  // UI states
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSummaryMobile, setShowSummaryMobile] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const cartItems = mounted ? items : [];
  const cartSubtotal = mounted ? getCartTotal() : 0;
  const shippingFee = 20000; // Flat Rate
  const grandTotal = cartSubtotal + shippingFee;

  // Redirect if cart is empty on mount
  useEffect(() => {
    if (mounted && items.length === 0) {
      router.push("/");
    }
  }, [mounted, items, router]);

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();

    if (cartItems.length === 0) {
      setNotification({ type: "error", message: "Keranjang belanja Anda kosong." });
      return;
    }

    if (!name || !email || !phone || !address || !city || !postcode) {
      setNotification({ type: "error", message: "Harap isi semua detail pengiriman." });
      return;
    }

    setIsProcessing(true);
    setNotification(null);

    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      
      const payload = {
        customer_name: name,
        customer_email: email,
        customer_phone: phone,
        shipping_address: address,
        shipping_city: city,
        shipping_postcode: postcode,
        items: cartItems.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image_url: item.image_url
        }))
      };

      const response = await fetch(`${apiBaseUrl}/api/v1/checkout/create-token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || "Gagal membuat transaksi.");
      }

      const snapToken = data.token;
      
      if (!snapToken) {
        throw new Error("Token Snap Midtrans tidak ditemukan.");
      }

      // Trigger Snap Modal
      if (typeof window !== "undefined" && (window as any).snap) {
        (window as any).snap.pay(snapToken, {
          onSuccess: function (result: any) {
            router.push(`/checkout/success?order_id=RNVN-${data.order_id}&payment_type=${result.payment_type || ""}`);
          },
          onPending: function (result: any) {
            router.push(`/checkout/success?order_id=RNVN-${data.order_id}&payment_type=${result.payment_type || ""}&status=pending`);
          },
          onError: function (result: any) {
            router.push(`/checkout/success?order_id=RNVN-${data.order_id}&status=failed`);
          },
          onClose: function () {
            setIsProcessing(false);
            setNotification({ type: "error", message: "Pembayaran dibatalkan. Anda dapat mencoba lagi." });
          }
        });
      } else {
        // Fallback to Midtrans Redirect URL
        window.location.href = data.redirect_url;
      }

    } catch (err: any) {
      console.error(err);
      setIsProcessing(false);
      setNotification({ type: "error", message: err.message || "Koneksi ke payment gateway gagal." });
    }
  };

  if (!mounted || cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-[#050505] flex justify-center items-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
          <span className="text-[10px] uppercase tracking-[3px] text-white/50">SECURE LOADING...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white font-[family-name:var(--font-inter)] selection:bg-white selection:text-black">
      {/* Background elements to match the luxury main page */}
      <div className="noise"></div>
      <div className="fixed inset-0 bg-[#050505] z-[-2]"></div>

      {/* Header */}
      <header className="border-b border-white/5 bg-black/60 backdrop-blur-md sticky top-0 z-[100] px-4 py-4 md:px-[5vw]">
        <div className="flex justify-between items-center max-w-7xl mx-auto w-full">
          <Link href="/" className="font-[family-name:var(--font-syncopate)] font-bold text-base tracking-[4px] text-white no-underline">
            RNVN
          </Link>
          <div className="flex items-center gap-2 text-[#888888] text-[9px] font-bold tracking-[2px] uppercase">
            <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
            </svg>
            SECURE CHECKOUT
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <main className="max-w-7xl mx-auto px-4 pt-8 pb-36 md:px-[5vw] md:py-16 grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-8 lg:gap-16">
        
        {/* Left Column: Form */}
        <section className="order-2 lg:order-1 animate-[fadeUpAnim_0.8s_ease]">
          <h2 className="font-[family-name:var(--font-bebas)] text-3xl tracking-wide mb-6">PENGIRIMAN & KONTAK</h2>
          
          {notification && (
            <div className={`p-4 mb-6 rounded text-xs tracking-wider uppercase font-semibold border ${notification.type === "error" ? "bg-red-950/20 border-red-500/30 text-red-400" : "bg-emerald-950/20 border-emerald-500/30 text-emerald-400"}`}>
              {notification.message}
            </div>
          )}

          <form onSubmit={handlePay} className="flex flex-col gap-6">
            {/* Contact Information */}
            <div className="glass-premium p-6 rounded-lg glow-premium flex flex-col gap-4">
              <h3 className="text-[11px] font-[family-name:var(--font-syncopate)] font-bold tracking-[2px] text-white/90 border-b border-white/5 pb-3">1. DETAIL KONTAK</h3>
              
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-bold tracking-[2px] text-[#888888] uppercase">Email</label>
                <input 
                  type="email" 
                  required
                  placeholder="name@example.com"
                  className="bg-black/40 border border-white/10 rounded px-4 py-3 text-xs text-white outline-none focus:border-white transition-colors"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-bold tracking-[2px] text-[#888888] uppercase">Nomor Telepon</label>
                <input 
                  type="tel" 
                  required
                  placeholder="081234567890"
                  className="bg-black/40 border border-white/10 rounded px-4 py-3 text-xs text-white outline-none focus:border-white transition-colors"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>

            {/* Delivery Address */}
            <div className="glass-premium p-6 rounded-lg glow-premium flex flex-col gap-4">
              <h3 className="text-[11px] font-[family-name:var(--font-syncopate)] font-bold tracking-[2px] text-white/90 border-b border-white/5 pb-3">2. ALAMAT PENGIRIMAN</h3>

              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-bold tracking-[2px] text-[#888888] uppercase">Nama Lengkap Penerima</label>
                <input 
                  type="text" 
                  required
                  placeholder="John Doe"
                  className="bg-black/40 border border-white/10 rounded px-4 py-3 text-xs text-white outline-none focus:border-white transition-colors"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-bold tracking-[2px] text-[#888888] uppercase">Alamat Lengkap</label>
                <textarea 
                  required
                  rows={3}
                  placeholder="Nama jalan, Nomor rumah, RT/RW, Kecamatan/Kelurahan"
                  className="bg-black/40 border border-white/10 rounded px-4 py-3 text-xs text-white outline-none focus:border-white transition-colors resize-none"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-bold tracking-[2px] text-[#888888] uppercase">Kota / Kabupaten</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Jakarta Selatan"
                    className="bg-black/40 border border-white/10 rounded px-4 py-3 text-xs text-white outline-none focus:border-white transition-colors"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-bold tracking-[2px] text-[#888888] uppercase">Kode Pos</label>
                  <input 
                    type="text" 
                    required
                    placeholder="12345"
                    className="bg-black/40 border border-white/10 rounded px-4 py-3 text-xs text-white outline-none focus:border-white transition-colors"
                    value={postcode}
                    onChange={(e) => setPostcode(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Desktop Pay Button */}
            <button
              type="submit"
              disabled={isProcessing}
              className="hidden lg:block w-full py-4 bg-white text-black font-[family-name:var(--font-syncopate)] font-bold text-xs tracking-[2px] uppercase rounded transition-all duration-300 hover:bg-neutral-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none mt-2"
            >
              {isProcessing ? "PROCESSING ORDER..." : `PLACE ORDER & PAY • IDR ${grandTotal.toLocaleString("id-ID")}`}
            </button>
          </form>
        </section>

        {/* Right Column: Order Summary */}
        <section className="order-1 lg:order-2 lg:sticky lg:top-24 h-fit animate-[fadeUpAnim_0.8s_ease] transition-all">
          {/* Mobile Accordion Toggle Header */}
          <div 
            onClick={() => setShowSummaryMobile(!showSummaryMobile)}
            className="flex lg:hidden justify-between items-center glass-premium p-4 rounded-lg border border-white/10 mb-4 cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <svg className={`w-4 h-4 text-white transition-transform ${showSummaryMobile ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
              </svg>
              <span className="text-[10px] font-bold tracking-[2px] uppercase">
                {showSummaryMobile ? "TUTUP RINGKASAN" : "TAMPILKAN RINGKASAN"}
              </span>
            </div>
            <span className="text-sm font-bold">IDR {grandTotal.toLocaleString("id-ID")}</span>
          </div>

          {/* Checkout items container */}
          <div className={`lg:block glass-premium rounded-lg glow-premium p-6 flex flex-col gap-6 ${showSummaryMobile ? "block" : "hidden"}`}>
            <h3 className="text-[11px] font-[family-name:var(--font-syncopate)] font-bold tracking-[2px] text-white/90 border-b border-white/5 pb-3">RINGKASAN PESANAN</h3>
            
            {/* Scrollable list */}
            <div className="flex flex-col gap-4 max-h-[300px] overflow-y-auto pr-1">
              {cartItems.map((item) => (
                <div key={item.id} className="flex gap-4 items-center">
                  <div className="w-[60px] aspect-[3/4] relative bg-[#0b0b0b] rounded border border-white/5 overflow-hidden flex-shrink-0">
                    <Image src={item.image_url} alt={item.name} fill className="object-cover p-1" />
                  </div>
                  <div className="flex-1 flex flex-col gap-1">
                    <span className="text-[10px] font-medium tracking-wide uppercase text-white/90 truncate max-w-[180px]">{item.name}</span>
                    <span className="text-[9px] text-[#888888] font-bold">QTY: {item.quantity}</span>
                  </div>
                  <span className="text-xs font-semibold text-white/90">IDR {(item.price * item.quantity).toLocaleString("id-ID")}</span>
                </div>
              ))}
            </div>

            {/* Calculations */}
            <div className="border-t border-white/5 pt-4 flex flex-col gap-2.5 text-xs text-[#888888]">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="text-white/80">IDR {cartSubtotal.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between">
                <span>Biaya Pengiriman (Flat)</span>
                <span className="text-white/80">IDR {shippingFee.toLocaleString("id-ID")}</span>
              </div>
              <div className="border-t border-white/5 pt-4 flex justify-between text-sm font-bold text-white">
                <span className="font-[family-name:var(--font-syncopate)] text-[10px] tracking-[1.5px] uppercase">TOTAL PEMBAYARAN</span>
                <span>IDR {grandTotal.toLocaleString("id-ID")}</span>
              </div>
            </div>

            {/* Trust badge footer */}
            <div className="border-t border-white/5 pt-4 flex justify-center gap-4 text-[#555] text-[9px] tracking-wider uppercase font-semibold">
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                </svg>
                SSL SECURE
              </span>
              <span>•</span>
              <span>MIDTRANS INTEGRATED</span>
            </div>
          </div>
        </section>
      </main>

      {/* Mobile Sticky Pay Button */}
      <div className="lg:hidden fixed bottom-0 left-0 w-full bg-black/95 backdrop-blur-xl border-t border-white/5 z-[990]"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 16px)" }}
      >
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <div className="flex flex-col gap-0.5">
            <span className="text-[8px] font-bold text-[#888888] tracking-[1.5px] uppercase">Grand Total</span>
            <span className="text-sm font-extrabold text-white">IDR {grandTotal.toLocaleString("id-ID")}</span>
          </div>
          <button
            onClick={handlePay}
            disabled={isProcessing}
            className="px-6 py-3.5 bg-white text-black font-[family-name:var(--font-syncopate)] font-bold text-[10px] tracking-[1.5px] uppercase rounded transition-all duration-300 hover:bg-neutral-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
          >
            {isProcessing ? "PROCESSING..." : "PAY NOW"}
          </button>
        </div>
      </div>

      {/* Loading Overlay */}
      {isProcessing && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[2000] flex flex-col justify-center items-center gap-4">
          <div className="w-10 h-10 border-2 border-white/10 border-t-white rounded-full animate-spin"></div>
          <p className="text-[10px] font-bold uppercase tracking-[3px] text-white animate-pulse">Menghubungkan ke Gateway Pembayaran...</p>
        </div>
      )}
    </div>
  );
}
