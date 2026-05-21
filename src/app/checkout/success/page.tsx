"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useCartStore } from "@/store/useCartStore";

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { clearCart } = useCartStore();
  
  const orderIdParam = searchParams.get("order_id") || "";
  const paymentTypeParam = searchParams.get("payment_type") || "";
  const statusParam = searchParams.get("status") || ""; 
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<any>(null);

  useEffect(() => {
    if (!orderIdParam) {
      setError("ID Pesanan tidak ditemukan.");
      setLoading(false);
      return;
    }

    const fetchOrderStatus = async () => {
      try {
        const rawId = orderIdParam.replace("RNVN-", "");
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const response = await fetch(`${apiBaseUrl}/api/v1/checkout/status/${rawId}`);
        if (!response.ok) {
          throw new Error("Gagal mengambil data pesanan.");
        }
        const data = await response.json();
        setOrder(data);
        
        // Clear cart if transaction is successful or pending
        if (data.status === "SETTLEMENT" || data.status === "PENDING") {
          clearCart();
        }
      } catch (err: any) {
        setError(err.message || "Gagal menghubungi server.");
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchOrderStatus();

    // Poll status every 5 seconds if order is pending to see if it changes
    const interval = setInterval(fetchOrderStatus, 5000);
    return () => clearInterval(interval);
  }, [orderIdParam, clearCart]);

  if (loading) {
    return (
      <div className="w-full max-w-xl glass-premium p-8 rounded-lg border border-white/5 flex flex-col gap-6 animate-pulse">
        <div className="h-16 w-16 bg-white/5 rounded-full mx-auto"></div>
        <div className="h-4 w-48 bg-white/5 mx-auto rounded"></div>
        <div className="h-3 w-32 bg-white/5 mx-auto rounded mb-4"></div>
        <div className="border-t border-white/5 pt-6 flex flex-col gap-3">
          <div className="h-3 w-full bg-white/5 rounded"></div>
          <div className="h-3 w-5/6 bg-white/5 rounded"></div>
          <div className="h-3 w-4/6 bg-white/5 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="w-full max-w-xl glass-premium p-8 rounded-lg border border-white/5 text-center flex flex-col items-center gap-6">
        <div className="w-16 h-16 rounded-full border border-red-500/20 flex items-center justify-center bg-red-950/10">
          <span className="text-2xl text-red-500 font-bold">✕</span>
        </div>
        <div>
          <h2 className="font-[family-name:var(--font-bebas)] text-3xl text-red-500 uppercase tracking-wide">Terjadi Kesalahan</h2>
          <p className="text-xs text-[#888888] mt-2 uppercase tracking-wide">{error || "Pesanan tidak ditemukan."}</p>
        </div>
        <Link href="/" className="px-8 py-3 bg-white text-black text-[10px] font-bold tracking-widest uppercase rounded no-underline hover:bg-neutral-200 transition-colors">
          Kembali ke Beranda
        </Link>
      </div>
    );
  }

  // Check if status failed
  const isFailed = statusParam === "failed" || order.status === "EXPIRED" || order.status === "CANCEL" || order.status === "DENY";
  const isPending = order.status === "PENDING";
  const isSuccess = order.status === "SETTLEMENT";

  return (
    <div className="w-full max-w-2xl glass-premium rounded-lg glow-premium p-6 md:p-8 flex flex-col gap-8 animate-[fadeUpAnim_0.8s_ease]">
      
      {/* Styles for animated icons */}
      <style jsx global>{`
        .checkmark-circle {
          stroke-dasharray: 166;
          stroke-dashoffset: 166;
          stroke-width: 2;
          stroke-miterlimit: 10;
          stroke: #10b981;
          fill: none;
          animation: stroke 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards;
        }
        .checkmark {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          display: block;
          stroke-width: 2;
          stroke: #fff;
          stroke-miterlimit: 10;
          box-shadow: inset 0px 0px 0px #10b981;
          animation: fill-success .4s ease-in-out .4s forwards, scale .3s ease-in-out .9s forwards;
        }
        .checkmark-check {
          transform-origin: 50% 50%;
          stroke-dasharray: 48;
          stroke-dashoffset: 48;
          animation: stroke 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.8s forwards;
        }
        @keyframes stroke {
          100% { stroke-dashoffset: 0; }
        }
        @keyframes scale {
          0%, 100% { transform: none; }
          50% { transform: scale3d(1.1, 1.1, 1); }
        }
        @keyframes fill-success {
          100% { box-shadow: inset 0px 0px 0px 30px #10b981; }
        }
      `}</style>

      {/* Header status */}
      <div className="flex flex-col items-center text-center gap-4">
        {isSuccess && (
          <>
            <div className="checkmark-wrapper">
              <svg className="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                <circle className="checkmark-circle" cx="26" cy="26" r="25" fill="none"/>
                <path className="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
              </svg>
            </div>
            <div>
              <h2 className="font-[family-name:var(--font-bebas)] text-4xl tracking-wide text-emerald-500">PEMBAYARAN BERHASIL</h2>
              <p className="text-[10px] text-[#888888] tracking-widest uppercase mt-1">Terima kasih telah memesan. Pesanan Anda sedang diproses.</p>
            </div>
          </>
        )}

        {isPending && (
          <>
            <div className="w-14 h-14 rounded-full border border-amber-500/30 flex items-center justify-center bg-amber-950/10 text-amber-500 text-3xl font-extrabold animate-pulse">
              !
            </div>
            <div>
              <h2 className="font-[family-name:var(--font-bebas)] text-4xl tracking-wide text-amber-500">MENUNGGU PEMBAYARAN</h2>
              <p className="text-[10px] text-[#888888] tracking-widest uppercase mt-1">Harap selesaikan pembayaran sesuai instruksi di aplikasi e-wallet / m-banking Anda.</p>
            </div>
          </>
        )}

        {isFailed && (
          <>
            <div className="w-14 h-14 rounded-full border border-red-500/30 flex items-center justify-center bg-red-950/10 text-red-500 text-3xl font-bold">
              ✕
            </div>
            <div>
              <h2 className="font-[family-name:var(--font-bebas)] text-4xl tracking-wide text-red-500">PEMBAYARAN GAGAL</h2>
              <p className="text-[10px] text-[#888888] tracking-widest uppercase mt-1">Transaksi Anda kedaluwarsa atau dibatalkan. Silakan hubungi support jika ada kendala.</p>
            </div>
          </>
        )}
      </div>

      {/* Invoice receipt */}
      <div className="border-t border-b border-white/5 py-6 flex flex-col gap-4 text-xs">
        <div className="grid grid-cols-2 gap-y-3 gap-x-4 border-b border-white/5 pb-4 text-[#888888]">
          <div>
            <span className="text-[9px] font-bold tracking-widest uppercase">Nomor Pesanan</span>
            <p className="text-white font-medium text-sm mt-1">{orderIdParam}</p>
          </div>
          <div>
            <span className="text-[9px] font-bold tracking-widest uppercase">Metode Pembayaran</span>
            <p className="text-white font-medium text-sm mt-1 uppercase">{order.payment_type || paymentTypeParam || "-"}</p>
          </div>
          <div>
            <span className="text-[9px] font-bold tracking-widest uppercase">Nama Penerima</span>
            <p className="text-white font-medium mt-1">{order.customer_name}</p>
          </div>
          <div>
            <span className="text-[9px] font-bold tracking-widest uppercase">Telepon</span>
            <p className="text-white font-medium mt-1">{order.customer_phone}</p>
          </div>
          <div className="col-span-2">
            <span className="text-[9px] font-bold tracking-widest uppercase">Alamat Pengiriman</span>
            <p className="text-white font-medium mt-1 leading-relaxed">{order.shipping_address}, {order.shipping_city} - {order.shipping_postcode}</p>
          </div>
        </div>

        {/* Item details */}
        <div className="flex flex-col gap-3">
          <span className="text-[9px] font-bold tracking-widest uppercase text-[#888888] mb-1">Rincian Barang</span>
          {order.items && order.items.map((item: any, idx: number) => (
            <div key={idx} className="flex justify-between items-center text-xs">
              <span className="text-white/80 uppercase font-medium">{item.name} <span className="text-[#666] font-bold">x {item.quantity}</span></span>
              <span className="text-white font-bold">IDR {(item.price * item.quantity).toLocaleString("id-ID")}</span>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="border-t border-white/5 pt-4 flex flex-col gap-2 text-xs text-[#888888]">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span className="text-white/80">IDR {order.subtotal?.toLocaleString("id-ID")}</span>
          </div>
          <div className="flex justify-between">
            <span>Biaya Pengiriman</span>
            <span className="text-white/80">IDR {order.shipping_cost?.toLocaleString("id-ID")}</span>
          </div>
          <div className="border-t border-white/5 pt-3 flex justify-between text-sm font-bold text-white">
            <span className="font-[family-name:var(--font-syncopate)] text-[9px] tracking-[1.5px] uppercase">Total Pembayaran</span>
            <span className="text-emerald-500">IDR {order.grand_total?.toLocaleString("id-ID")}</span>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
        {isFailed ? (
          <Link href="/checkout" className="w-full sm:w-auto px-8 py-3.5 bg-white text-black text-[10px] font-bold tracking-widest uppercase rounded text-center no-underline hover:bg-neutral-200 transition-colors">
            Coba Pembayaran Lagi
          </Link>
        ) : (
          <Link href="/" className="w-full sm:w-auto px-8 py-3.5 bg-white text-black text-[10px] font-bold tracking-widest uppercase rounded text-center no-underline hover:bg-neutral-200 transition-colors">
            Belanja Kembali
          </Link>
        )}
        <a 
          href={`https://wa.me/628563122123?text=Halo%20RNVN,%20saya%20ingin%20bertanya%20mengenai%20pesanan%20saya%20dengan%20ID%20${orderIdParam}`} 
          target="_blank" 
          rel="noopener noreferrer"
          className="w-full sm:w-auto px-8 py-3.5 bg-transparent border border-white/10 text-white text-[10px] font-bold tracking-widest uppercase rounded text-center no-underline hover:bg-white/5 hover:border-white/20 transition-all"
        >
          Hubungi Layanan Support
        </a>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <div className="min-h-screen bg-[#050505] text-white flex justify-center items-center p-4 relative">
      <div className="noise"></div>
      <div className="fixed inset-0 bg-[#050505] z-[-2]"></div>
      
      <Suspense fallback={
        <div className="w-full max-w-xl glass-premium p-8 rounded-lg border border-white/5 flex flex-col gap-6 animate-pulse">
          <div className="h-16 w-16 bg-white/5 rounded-full mx-auto"></div>
          <div className="h-4 w-48 bg-white/5 mx-auto rounded"></div>
          <div className="h-3 w-32 bg-white/5 mx-auto rounded mb-4"></div>
          <div className="border-t border-white/5 pt-6 flex flex-col gap-3">
            <div className="h-3 w-full bg-white/5 rounded"></div>
            <div className="h-3 w-5/6 bg-white/5 rounded"></div>
            <div className="h-3 w-4/6 bg-white/5 rounded"></div>
          </div>
        </div>
      }>
        <SuccessContent />
      </Suspense>
    </div>
  );
}
