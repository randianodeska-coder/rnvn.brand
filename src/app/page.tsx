"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useCartStore } from "@/store/useCartStore";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface ProductCardProps {
  id: number;
  name: string;
  price: number;
  description: string;
  images: string[];
  delay?: string;
  addItem: (item: any) => void;
  setCartActive: (active: boolean) => void;
}

function ProductCard({ id, name, price, description, images, delay = "0s", addItem, setCartActive }: ProductCardProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const handleDotClick = (index: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex(index);
  };

  return (
    <div
      className="flex flex-col cursor-pointer group reveal border border-white/8 bg-[#111] rounded-xl overflow-hidden transition-all duration-300 hover:border-white/15 hover:shadow-luxury"
      style={{ transitionDelay: delay }}
    >
      {/* ─ Square white image box (Shopee style) ─ */}
      <div className="relative w-full aspect-square bg-white overflow-hidden">

        {/* Slides */}
        {images.map((img, index) => (
          <div
            key={img}
            className={`absolute inset-0 transition-opacity duration-500 ease-in-out ${
              index === currentIndex
                ? "opacity-100 z-[2]"
                : "opacity-0 z-0 pointer-events-none"
            }`}
          >
            <Image
              src={img}
              alt={name}
              fill
              sizes="(max-width: 768px) 50vw, 300px"
              priority={index === 0}
              className="object-contain p-4"
            />
          </div>
        ))}

        {/* NEW badge */}
        {id === 1 && (
          <span className="absolute top-2 left-2 z-[5] bg-red-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-sm tracking-widest uppercase">
            NEW
          </span>
        )}

        {/* Tap/click transparent overlay for next image */}
        {images.length > 1 && (
          <button
            onClick={handleNext}
            className="absolute inset-0 z-[3] bg-transparent border-none w-full h-full"
            aria-label="Next image"
            style={{ WebkitTapHighlightColor: "transparent" }}
          />
        )}

        {/* Pill dot indicators (Shopee style) */}
        {images.length > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-[4] pointer-events-none">
            {images.map((_, idx) => (
              <span
                key={idx}
                className={`block rounded-full transition-all duration-300 ${
                  idx === currentIndex
                    ? "w-4 h-[5px] bg-gray-700"
                    : "w-[5px] h-[5px] bg-gray-400/60"
                }`}
              />
            ))}
          </div>
        )}

        {/* Add to cart (bottom-right like Shopee) */}
        <button
          className="absolute bottom-2 right-2 z-[5] w-8 h-8 rounded-full bg-black text-white flex items-center justify-center shadow-lg active:scale-90 transition-transform border border-white/10"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            addItem({ id, name, price, image_url: images[0] });
            setCartActive(true);
          }}
          aria-label="Add to cart"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {/* ─ Product info below image ─ */}
      <div className="flex flex-col gap-0.5 px-2.5 py-2.5">
        <p className="text-white text-[11px] md:text-[12px] font-medium uppercase tracking-wide leading-snug line-clamp-2 m-0">
          {name}
        </p>
        <span className="text-white font-bold text-[13px] md:text-sm">
          IDR {price.toLocaleString("id-ID")}
        </span>
        <span className="text-[#666] text-[9px] uppercase tracking-widest">{description}</span>
      </div>
    </div>
  );
}

export default function Home() {
  const heroImageRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [menuActive, setMenuActive] = useState(false);
  const [loading, setLoading] = useState(true);

  // Newsletter Subscriptions
  const [email, setEmail] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [subError, setSubError] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || submitting) return;

    setSubmitting(true);
    setSubError(false);
    setMessage("");

    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const isGoogleScript = apiBaseUrl.includes("script.google.com");

      // For Google Apps Script, we don't set Content-Type header to prevent CORS preflight issues
      const fetchUrl = isGoogleScript ? apiBaseUrl : `${apiBaseUrl}/api/v1/subscribe`;
      const fetchHeaders: HeadersInit = isGoogleScript ? {} : { "Content-Type": "application/json" };

      const response = await fetch(fetchUrl, {
        method: "POST",
        headers: fetchHeaders,
        body: JSON.stringify({ email }),
        mode: isGoogleScript ? "no-cors" : "cors",
      });

      if (isGoogleScript) {
        // In "no-cors" mode, we cannot read the response, but it successfully posts to Google Sheets
        setIsSubscribed(true);
        setMessage("THANK YOU FOR JOINING THE MOVEMENT.");
      } else {
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.detail || "Terjadi kesalahan.");
        }
        setIsSubscribed(true);
        setMessage(data.message || "THANK YOU FOR JOINING THE MOVEMENT.");
      }
    } catch (err: any) {
      setSubError(true);
      setMessage(err.message || "Failed to subscribe. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };
  
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  
  const { cartActive, setCartActive, items, addItem, removeItem, decrementItem, getCartTotal } = useCartStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const cartItems = mounted ? items : [];
  const cartTotal = mounted ? getCartTotal() : 0;


  // Loader
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1200); 
    return () => clearTimeout(timer);
  }, []);

  // Cursor & Hover Logic
  useEffect(() => {
    const cursor = cursorRef.current;
    if (!cursor) return;

    const moveCursor = (e: MouseEvent) => {
      if (window.innerWidth > 768) {
        cursor.style.left = e.clientX + "px";
        cursor.style.top = e.clientY + "px";
      }
    };

    window.addEventListener("mousemove", moveCursor);

    const hoverTargets = document.querySelectorAll(".hover-target");
    const imageTargets = document.querySelectorAll(".hover-target-image");

    const addActive = () => cursor.classList.add("active");
    const removeActive = () => cursor.classList.remove("active");
    
    const addImageActive = () => {
      cursor.classList.add("active");
      cursor.textContent = "VIEW";
    };
    const removeImageActive = () => {
      cursor.classList.remove("active");
      cursor.textContent = "";
    };

    hoverTargets.forEach((t) => {
      t.addEventListener("mouseenter", addActive);
      t.addEventListener("mouseleave", removeActive);
    });

    imageTargets.forEach((t) => {
      t.addEventListener("mouseenter", addImageActive);
      t.addEventListener("mouseleave", removeImageActive);
    });

    // Magnetic logic
    const magneticTargets = document.querySelectorAll(".magnetic");
    const handleMagnetic = (e: Event) => {
      const target = e.currentTarget as HTMLElement;
      const rect = target.getBoundingClientRect();
      const mouseEvent = e as MouseEvent;
      const x = mouseEvent.clientX - rect.left - rect.width / 2;
      const y = mouseEvent.clientY - rect.top - rect.height / 2;
      target.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px)`;
    };
    const resetMagnetic = (e: Event) => {
      const target = e.currentTarget as HTMLElement;
      target.style.transform = `translate(0px, 0px)`;
    };

    magneticTargets.forEach((t) => {
      t.addEventListener("mousemove", handleMagnetic);
      t.addEventListener("mouseleave", resetMagnetic);
    });

    return () => {
      window.removeEventListener("mousemove", moveCursor);
      hoverTargets.forEach((t) => {
        t.removeEventListener("mouseenter", addActive);
        t.removeEventListener("mouseleave", removeActive);
      });
      imageTargets.forEach((t) => {
        t.removeEventListener("mouseenter", addImageActive);
        t.removeEventListener("mouseleave", removeImageActive);
      });
      magneticTargets.forEach((t) => {
        t.removeEventListener("mousemove", handleMagnetic);
        t.removeEventListener("mouseleave", resetMagnetic);
      });
    };
  }, [loading]);

  // Scroll Reveal & Parallax
  useEffect(() => {
    const handleScroll = () => {
      if (heroImageRef.current) {
        heroImageRef.current.style.transform = `translateY(${window.scrollY * 0.3}px)`;
      }
    };
    window.addEventListener("scroll", handleScroll);

    const reveals = document.querySelectorAll(".reveal");
    const revealOptions = { threshold: 0.1, rootMargin: "0px 0px -50px 0px" };
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("active");
          observer.unobserve(entry.target);
        }
      });
    }, revealOptions);
    reveals.forEach((r) => revealObserver.observe(r));

    return () => {
      window.removeEventListener("scroll", handleScroll);
      revealObserver.disconnect();
    };
  }, [loading]);

  // Canvas Dust Animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    class Particle {
      x: number;
      y: number;
      size: number;
      speedY: number;
      opacity: number;

      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.size = Math.random() * 1.2 + 0.1;
        this.speedY = -(Math.random() * 0.15 + 0.05);
        this.opacity = Math.random() * 0.3 + 0.05;
      }

      reset() {
        this.x = Math.random() * width;
        this.y = height + 10;
        this.size = Math.random() * 1.2 + 0.1;
        this.speedY = -(Math.random() * 0.15 + 0.05);
        this.opacity = Math.random() * 0.3 + 0.05;
      }

      update() {
        this.y += this.speedY;
        this.x += Math.sin(this.y * 0.01) * 0.2;
        if (this.y < -10) this.reset();
      }

      draw() {
        if (!ctx) return;
        ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    let particles: Particle[] = [];
    const count = Math.floor((width * height) / 30000);
    for (let i = 0; i < count; i++) {
      particles.push(new Particle());
    }

    let animationId: number;
    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      for (const p of particles) {
        p.update();
        p.draw();
      }
      animationId = requestAnimationFrame(animate);
    };
    animate();

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  const closeOverlays = () => {
    setMenuActive(false);
    setCartActive(false);
  };

  return (
    <main>
      <div className="cursor" ref={cursorRef}></div>
      <div className="noise"></div>
      <canvas id="bg-canvas" ref={canvasRef}></canvas>

      {/* Backdrop Blur Overlay */}
      <div 
        className={`fixed inset-0 bg-black/70 backdrop-blur-md z-[990] transition-all duration-500 ${menuActive || cartActive ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`} 
        onClick={closeOverlays}
      ></div>
      {/* Mobile Menu */}
      <div className={`fixed top-0 w-full max-w-[380px] h-screen h-[100dvh] bg-black/95 backdrop-blur-2xl z-[1000] flex flex-col transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] left-0 border-r border-white/5 p-10 justify-between ${menuActive ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex justify-between items-center pb-6 border-b border-white/5">
          <span className="font-[family-name:var(--font-syncopate)] font-bold text-sm tracking-[3px] text-white">MENU</span>
          <button className="bg-transparent border-none text-white text-lg cursor-none opacity-50 hover:opacity-100 transition-opacity" onClick={closeOverlays}>✕</button>
        </div>
        
        <div className="flex flex-col gap-6 my-auto">
          <a href="#collection" className="font-[family-name:var(--font-bebas)] text-[4.5rem] leading-[0.9] text-white no-underline tracking-wide opacity-50 hover:opacity-100 hover:translate-x-2 transition-all cursor-none" onClick={closeOverlays}>Latest Drop</a>
          <a href="#collection" className="font-[family-name:var(--font-bebas)] text-[4.5rem] leading-[0.9] text-white no-underline tracking-wide opacity-50 hover:opacity-100 hover:translate-x-2 transition-all cursor-none" onClick={closeOverlays}>Apparel</a>
          <a href="#manifesto" className="font-[family-name:var(--font-bebas)] text-[4.5rem] leading-[0.9] text-white no-underline tracking-wide opacity-50 hover:opacity-100 hover:translate-x-2 transition-all cursor-none" onClick={closeOverlays}>Manifesto</a>
          <a href="#contact" className="font-[family-name:var(--font-bebas)] text-[4.5rem] leading-[0.9] text-white no-underline tracking-wide opacity-50 hover:opacity-100 hover:translate-x-2 transition-all cursor-none" onClick={closeOverlays}>Contact</a>
        </div>

        <div className="pt-6 border-t border-white/5 flex flex-col gap-2">
          <span className="text-[9px] text-[#555] tracking-[2px] uppercase">RNVN OFFICIAL &copy; 2026</span>
          <span className="text-[8px] text-[#444] tracking-[1.5px] uppercase">Premium Streetwear Label</span>
        </div>
      </div>

      {/* Slide-Out Cart */}
      <div className={`fixed top-0 w-full sm:w-[440px] max-w-full h-screen h-[100dvh] bg-black/95 backdrop-blur-2xl z-[1000] flex flex-col transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] right-0 border-l border-white/5 ${cartActive ? "translate-x-0" : "translate-x-full"}`}>
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-black/20">
          <h3 className="font-[family-name:var(--font-syncopate)] font-bold text-xs tracking-[3px] text-white">SHOPPING BAG ({cartItems.reduce((acc, curr) => acc + curr.quantity, 0)})</h3>
          <button className="bg-transparent border-none text-white text-lg cursor-none opacity-50 hover:opacity-100 transition-opacity" onClick={closeOverlays}>✕</button>
        </div>
        
        <div className="flex-1 p-6 flex flex-col gap-5 overflow-y-auto">
          {cartItems.length === 0 ? (
            <div className="flex-1 flex flex-col justify-center items-center text-center gap-4 text-[#888888]">
              <svg className="w-12 h-12 text-[#444] stroke-[1.25]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
              </svg>
              <div>
                <h4 className="font-semibold text-white tracking-widest text-[11px] uppercase mb-1">Your bag is empty</h4>
                <p className="text-[9px] uppercase tracking-wider text-[#666]">Add items from the collection to get started.</p>
              </div>
              <button 
                onClick={closeOverlays}
                className="mt-4 px-6 py-2.5 bg-white text-black text-[10px] font-bold tracking-widest uppercase hover:bg-gray-200 transition-colors cursor-none rounded-none"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            cartItems.map((item) => (
              <div key={item.id} className="flex gap-4 items-center border-b border-white/5 pb-4 last:border-0">
                <div className="w-[70px] aspect-[3/4] relative bg-[#0b0b0b] rounded overflow-hidden flex-shrink-0 border border-white/5">
                  <Image src={item.image_url} alt={item.name} fill className="object-cover p-1" />
                </div>
                <div className="flex-1 flex flex-col gap-1.5">
                  <span className="text-[11px] font-medium tracking-wide uppercase text-white">{item.name}</span>
                  <span className="text-[10px] text-[#888888] font-semibold">IDR {item.price.toLocaleString("id-ID")}</span>
                  
                  {/* Quantity Controller */}
                  <div className="flex items-center border border-white/10 rounded-sm self-start mt-1">
                    <button 
                      onClick={() => decrementItem(item.id)} 
                      className="px-2 py-0.5 text-white/50 hover:text-white transition-colors cursor-none text-[11px]"
                    >
                      —
                    </button>
                    <span className="px-2 py-0.5 text-[10px] text-white font-medium min-w-[18px] text-center border-x border-white/10">
                      {item.quantity}
                    </span>
                    <button 
                      onClick={() => addItem({ id: item.id, name: item.name, price: item.price, image_url: item.image_url })} 
                      className="px-2 py-0.5 text-white/50 hover:text-white transition-colors cursor-none text-[11px]"
                    >
                      +
                    </button>
                  </div>
                </div>
                <button 
                  className="text-[9px] text-[#888888] opacity-60 hover:opacity-100 hover:text-white transition-all cursor-none tracking-widest"
                  onClick={() => removeItem(item.id)}
                >
                  REMOVE
                </button>
              </div>
            ))
          )}
        </div>

        {cartItems.length > 0 && (
          <div className="px-6 py-4 border-t border-white/5 bg-black/10 flex justify-between items-center">
            <span className="text-[10px] font-semibold tracking-widest uppercase text-[#888888]">Estimated Total</span>
            <span className="text-sm font-bold tracking-wide text-white">IDR {cartTotal.toLocaleString("id-ID")}</span>
          </div>
        )}

        <div
          className="p-4 md:p-6 border-t border-white/5 flex flex-col gap-2 bg-black/20 pb-28 md:pb-6"
        >
          <button 
            disabled={cartItems.length === 0}
            className="w-full py-3 md:py-4 px-4 bg-white text-black text-[11px] font-[family-name:var(--font-syncopate)] font-bold tracking-[2px] uppercase border-none cursor-none transition-all duration-300 hover:bg-neutral-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none" 
            onClick={() => {
              setCartActive(false);
              router.push("/checkout");
            }}
          >
            SECURE CHECKOUT
          </button>
          
          <button 
            disabled={cartItems.length === 0}
            className="w-full py-2.5 px-4 bg-transparent text-white/70 text-[9px] font-bold tracking-widest uppercase border border-white/10 cursor-none transition-all duration-300 hover:bg-white/5 hover:text-white active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none" 
            onClick={() => {
              const message = `Halo RNVN, saya ingin memesan:\n\n` + 
                              cartItems.map(item => `- ${item.name} (${item.quantity}x) = IDR ${(item.price * item.quantity).toLocaleString("id-ID")}`).join("\n") +
                              `\n\nTotal: IDR ${cartTotal.toLocaleString("id-ID")}`;
              window.open(`https://wa.me/628563122123?text=${encodeURIComponent(message)}`, "_blank");
            }}
          >
            Order via WhatsApp
          </button>
          
          <div className="grid grid-cols-2 gap-2 mt-1">
            <a 
              href="https://vt.tiktok.com/ZSHKqtkr8/?page=Mall" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="py-3 px-3 bg-neutral-900/50 hover:bg-neutral-900 border border-white/10 text-white text-[9px] font-semibold tracking-widest uppercase text-center no-underline transition-all duration-300"
            >
              TikTok Shop
            </a>
            <a 
              href="#" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="py-3 px-3 bg-[#0c0c0c]/50 hover:bg-neutral-900 border border-white/10 text-white text-[9px] font-semibold tracking-widest uppercase text-center no-underline transition-all duration-300"
            >
              Shopee Store
            </a>
          </div>
        </div>
      </div>

      {/* Loader */}
      {loading && (
        <div id="loader">
          <div className="loader-logo text-white">RNVN</div>
          <div className="loader-bar" />
        </div>
      )}

      {/* Floating Cart Button (Mobile only) */}
      <button
        onClick={() => setCartActive(true)}
        className="md:hidden fixed right-5 z-[990] w-14 h-14 bg-white text-black rounded-full flex items-center justify-center border border-white/20 active:scale-95 transition-all duration-300"
        style={{
          bottom: "calc(env(safe-area-inset-bottom, 0px) + 20px)",
          boxShadow: "0 8px 32px rgba(255,255,255,0.18), 0 2px 8px rgba(0,0,0,0.5)"
        }}
        aria-label="Shopping Cart"
      >
        <div className="relative">
          <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          {cartItems.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-black text-white text-[9px] font-bold rounded-full w-5 h-5 flex items-center justify-center border border-white/20 animate-badge-pulse">
              {cartItems.reduce((total, item) => total + item.quantity, 0)}
            </span>
          )}
        </div>
      </button>

      {/* Navigation */}
      <nav className={`fixed top-0 w-full px-5 md:px-[5vw] transition-all duration-300 z-[100] flex justify-between items-center ${scrolled ? "py-4 bg-black/85 backdrop-blur-xl border-b border-white/5 shadow-luxury" : "py-6 bg-transparent border-b border-white/0"}`}>
        <div className="flex items-center gap-8">
          <a href="#" className="font-[family-name:var(--font-syncopate)] font-bold text-lg tracking-[4px] text-white no-underline hover-target">RNVN</a>
        </div>
        <div className="flex items-center gap-6">
          <ul className="hidden md:flex gap-8 list-none m-0 p-0">
            <li><a href="#collection" className="nav-link text-[11px] font-medium uppercase tracking-[2px] text-white no-underline opacity-60 hover:opacity-100 transition-opacity hover-target">Drop</a></li>
            <li><a href="#collection" className="nav-link text-[11px] font-medium uppercase tracking-[2px] text-white no-underline opacity-60 hover:opacity-100 transition-opacity hover-target">Collection</a></li>
            <li><a href="#manifesto" className="nav-link text-[11px] font-medium uppercase tracking-[2px] text-white no-underline opacity-60 hover:opacity-100 transition-opacity hover-target">Manifesto</a></li>
          </ul>
          
          <button 
            className="flex items-center gap-2 bg-transparent border-none text-white text-[11px] font-medium uppercase tracking-[2px] cursor-none transition-opacity hover:opacity-75 hover-target" 
            onClick={() => setCartActive(true)}
          >
            <span className="hidden md:inline">Cart</span>
            <div className="relative p-1">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
              </svg>
              {cartItems.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-white text-black text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center animate-badge-pulse">
                  {cartItems.reduce((total, item) => total + item.quantity, 0)}
                </span>
              )}
            </div>
          </button>

          <div className={`md:hidden flex flex-col gap-[5px] cursor-none z-[1001] hover-target ${menuActive ? "active" : ""}`} onClick={() => setMenuActive(!menuActive)}>
            <span className={`block w-6 h-[1.5px] bg-white transition-transform ${menuActive ? "translate-y-[6.5px] rotate-45" : ""}`}></span>
            <span className={`block w-6 h-[1.5px] bg-white transition-opacity ${menuActive ? "opacity-0" : ""}`}></span>
            <span className={`block w-6 h-[1.5px] bg-white transition-transform ${menuActive ? "-translate-y-[6.5px] -rotate-45" : ""}`}></span>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative h-screen flex flex-col justify-center items-center text-center overflow-hidden">
        {/* Parallax background */}
        <div
          className="absolute -top-[5%] left-0 w-full h-[110%] bg-cover bg-center opacity-20 grayscale contrast-125 z-0"
          style={{ backgroundImage: "url('/assets/whatsapp image 2026-03-20 at 21.58.30.jpeg')" }}
          ref={heroImageRef}
        />
        {/* Ambient gradient orb */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full z-0 pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(255,255,255,0.03) 0%, transparent 70%)" }}
        />
        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 w-full h-[40%] bg-gradient-to-t from-[#050505] to-transparent z-[1]" />
        {/* Top fade */}
        <div className="absolute top-0 left-0 w-full h-[20%] bg-gradient-to-b from-[#050505] to-transparent z-[1]" />

        <div className="relative z-[2] px-[5vw] max-w-[800px] flex flex-col items-center">
          <div className="section-label mb-8 opacity-0 animate-[fadeUpAnim_1s_1s_forwards]">Official Store</div>
          <h1 className="font-[family-name:var(--font-bebas)] text-[clamp(3.5rem,10vw,8rem)] text-white mb-6 opacity-0 animate-[fadeUpAnim_1s_1.2s_forwards] leading-[0.88]">
            Tak Dikenal<br/>Tak Tertandingi
          </h1>
          <p className="text-sm text-[#666] leading-[1.8] tracking-wider mb-10 max-w-[380px] opacity-0 animate-[fadeUpAnim_1s_1.4s_forwards]">
            Dibangun untuk mereka yang menolak tren dengan bahan premium dan identitas streetwear sejati.
          </p>
          <a
            href="https://vt.tiktok.com/ZSHKqtkr8/?page=Mall"
            target="_blank"
            rel="noopener noreferrer"
            className="magnetic btn-primary opacity-0 animate-[fadeUpAnim_1s_1.6s_forwards] hover-target"
          >
            SHOP NOW
          </a>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[2] scroll-indicator opacity-0 animate-[fadeInAnim_1s_2.2s_forwards]">
          <span>Scroll</span>
          <div className="arrow" />
        </div>
      </section>

      {/* Marquee */}
      <div className="marquee-fade-edge w-full py-5 bg-[#080808] text-white border-y border-white/[0.06] overflow-hidden whitespace-nowrap flex items-center relative z-[2]">
        <div className="marquee-track">
          {[...Array(4)].map((_, i) => (
            <span key={i} className="flex items-center">
              <span className="font-[family-name:var(--font-bebas)] text-xl md:text-2xl tracking-[4px] mx-8 opacity-50 hover:opacity-90 transition-opacity duration-300">RNVN OFFICIAL</span>
              <span className="text-white/20 text-[8px] mx-2">◆</span>
              <span className="font-[family-name:var(--font-bebas)] text-xl md:text-2xl tracking-[4px] mx-8 opacity-50 hover:opacity-90 transition-opacity duration-300">SIGNATURE BOXY</span>
              <span className="text-white/20 text-[8px] mx-2">◆</span>
              <span className="font-[family-name:var(--font-bebas)] text-xl md:text-2xl tracking-[4px] mx-8 opacity-50 hover:opacity-90 transition-opacity duration-300">PREMIUM STREETWEAR</span>
              <span className="text-white/20 text-[8px] mx-2">◆</span>
              <span className="font-[family-name:var(--font-bebas)] text-xl md:text-2xl tracking-[4px] mx-8 opacity-50 hover:opacity-90 transition-opacity duration-300">LIMITED DROP</span>
              <span className="text-white/20 text-[8px] mx-2">◆</span>
            </span>
          ))}
        </div>
      </div>

      {/* Collection */}
      <section id="collection" className="py-[120px] px-[5vw] relative z-[2]">
        <div className="flex justify-between items-end mb-16 pb-6 reveal">
          <div>
            <div className="section-label mb-4">Latest Drop</div>
            <h2 className="font-[family-name:var(--font-bebas)] text-white text-[clamp(2.5rem,5vw,4rem)] tracking-wide m-0 leading-none">The Archives</h2>
          </div>
          <a href="#" className="nav-link text-[10px] font-medium uppercase tracking-[2px] text-[#555] no-underline transition-colors hover:text-white hover-target hidden md:block">View Full Catalog</a>
        </div>
        <div className="divider-animated mb-16" />

        <div className="grid grid-cols-2 gap-4 md:gap-10 max-w-2xl mx-auto">
          <ProductCard
            id={1}
            name="BOXY FIT (Pre-Order)"
            price={129000}
            description="Cotton combed 20s"
            images={["/assets/rnvn4.png", "/assets/img_8767.jpg.jpeg"]}
            delay="0s"
            addItem={addItem}
            setCartActive={setCartActive}
          />
          <ProductCard
            id={2}
            name="T-SHIRT (Pre-Order)"
            price={79000}
            description="Cotton combed 24s"
            images={["/assets/tshirts rnvn.png", "/assets/img_8789.jpg.jpeg"]}
            delay="0.12s"
            addItem={addItem}
            setCartActive={setCartActive}
          />
        </div>
      </section>

      {/* Manifesto */}
      <section id="manifesto" className="py-[100px] px-[5vw] max-md:py-[80px] grid grid-cols-1 md:grid-cols-2 gap-[40px] md:gap-[6vw] items-center border-t border-white/[0.06] relative z-[2]">
        <div className="w-full aspect-[16/9] md:aspect-[4/5] relative overflow-hidden rounded-xl reveal-scale">
          <Image src="/assets/untitled-1-recovered.png" alt="RNVN Vision" fill className="object-contain" />
          {/* Subtle gradient overlay on image */}
          <div className="absolute inset-0 rounded-xl" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.02) 0%, transparent 60%)" }} />
        </div>
        <div className="py-0 md:py-10 reveal text-white flex flex-col gap-5">
          <div className="section-label">Brand Philosophy</div>
          <h2 className="font-[family-name:var(--font-bebas)] text-[clamp(3rem,6vw,4.5rem)] m-0 leading-[0.9]">The<br/>Manifesto</h2>
          <div className="w-8 h-[1px] bg-white/20" />
          <p className="text-sm leading-[1.9] text-[#666] max-w-[480px] tracking-wide">
            <strong className="text-white/90 font-medium">RNVN Hadir</strong> sebagai representasi individu modern yang bergerak dengan karakter, visi, dan identitas yang kuat. Kami percaya bahwa pakaian bukan sekedar penampilan, melainkan bentuk ekspresi yang mencerminkan cara berpikir dan cara hidup.
          </p>
          <p className="text-sm leading-[1.9] text-[#666] max-w-[480px] tracking-wide">
            Setiap koleksi dirancang melalui pemilihan material berkualitas, siluet yang presisi, dan detail yang fungsional untuk kenyamanan, estetika, dan ketahanan. Dengan desain yang minimal, modern, dan abadi, RNVN diciptakan untuk mereka yang memilih untuk tampil berbeda.
          </p>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-[100px] px-[5vw] border-t border-white/[0.06] text-center relative z-[2] bg-[#080808] reveal text-white">
        {isSubscribed ? (
          <div className="opacity-0 animate-[scale-in_0.8s_forwards] flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center mx-auto mb-2">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
            </div>
            <h3 className="font-[family-name:var(--font-bebas)] text-[clamp(2.5rem,5vw,4rem)] text-white tracking-widest leading-none">WELCOME TO THE MOVEMENT</h3>
            <p className="text-emerald-400 text-xs font-semibold tracking-widest uppercase">{message}</p>
          </div>
        ) : (
          <>
            <div className="section-label justify-center mb-6">Stay Connected</div>
            <h2 className="font-[family-name:var(--font-bebas)] text-[clamp(2rem,4vw,3.5rem)] mb-4 m-0 leading-none">JOIN THE MOVEMENT</h2>
            <p className="text-[#555] text-[12px] mb-10 tracking-[2px] uppercase">Early access to limited collections and exclusive releases.</p>
            <form onSubmit={handleSubscribe} className="flex max-w-[420px] mx-auto border-b border-white/20 transition-colors focus-within:border-white/60 hover:border-white/40">
              <input
                type="email"
                placeholder={submitting ? "SENDING..." : "YOUR EMAIL ADDRESS"}
                className="flex-1 bg-transparent border-none text-white py-3 outline-none text-[12px] tracking-widest placeholder:text-[#444] hover-target"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={submitting}
                required
              />
              <button
                type="submit"
                className="bg-transparent border-none text-white text-lg px-3 transition-transform hover:translate-x-1.5 hover-target disabled:opacity-30"
                disabled={submitting}
              >
                {submitting ? "⋯" : "→"}
              </button>
            </form>
            {subError && <p className="text-red-400 text-[10px] mt-5 tracking-wider uppercase">{message}</p>}
          </>
        )}
      </section>

      {/* Footer */}
      <footer id="contact" className="pt-[70px] pb-[40px] px-[5vw] border-t border-white/[0.06] relative z-[2] bg-[#030303] text-white">
        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr] gap-[40px] md:gap-[60px] mb-[60px]">
          <div>
            <a href="#" className="font-[family-name:var(--font-syncopate)] text-2xl font-bold tracking-[4px] mb-4 block text-white no-underline hover-target">RNVN</a>
            <p className="text-[#444] text-xs max-w-[240px] leading-[2] tracking-wide">Tak Dikenal Tak Tertandingi<br/>Indonesian premium streetwear</p>
            {/* Social Icons */}
            <div className="flex gap-3 mt-6">
              <a href="https://vt.tiktok.com/ZSHKqtkr8/?page=Mall" target="_blank" rel="noopener noreferrer" className="w-8 h-8 border border-white/10 rounded-full flex items-center justify-center text-[#666] hover:text-white hover:border-white/30 transition-all no-underline">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.26 8.26 0 004.84 1.56V6.79a4.85 4.85 0 01-1.07-.1z"/></svg>
              </a>
              <a href="https://wa.me/628563122123" target="_blank" rel="noopener noreferrer" className="w-8 h-8 border border-white/10 rounded-full flex items-center justify-center text-[#666] hover:text-white hover:border-white/30 transition-all no-underline">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              </a>
            </div>
          </div>
          <div>
            <h4 className="section-label mb-6">Collections</h4>
            <ul className="list-none flex flex-col gap-4 m-0 p-0">
              <li><a href="#" className="nav-link text-white no-underline text-xs tracking-wide opacity-50 hover:opacity-100 hover-target transition-opacity">Latest Drop</a></li>
              <li><a href="#" className="nav-link text-white no-underline text-xs tracking-wide opacity-50 hover:opacity-100 hover-target transition-opacity">Boxy T-Shirts</a></li>
              <li><a href="#" className="nav-link text-white no-underline text-xs tracking-wide opacity-50 hover:opacity-100 hover-target transition-opacity">Regular T-Shirts</a></li>
              <li><a href="#" className="nav-link text-white no-underline text-xs tracking-wide opacity-50 hover:opacity-100 hover-target transition-opacity">Lookbook</a></li>
            </ul>
          </div>
          <div>
            <h4 className="section-label mb-6">Support</h4>
            <ul className="list-none flex flex-col gap-4 m-0 p-0">
              <li><a href="#" className="nav-link text-white no-underline text-xs tracking-wide opacity-50 hover:opacity-100 hover-target transition-opacity">Size Chart</a></li>
              <li><a href="#" className="nav-link text-white no-underline text-xs tracking-wide opacity-50 hover:opacity-100 hover-target transition-opacity">Shipping Info</a></li>
              <li><a href="#" className="nav-link text-white no-underline text-xs tracking-wide opacity-50 hover:opacity-100 hover-target transition-opacity">WhatsApp Support</a></li>
            </ul>
          </div>
        </div>
        <div className="divider-animated mb-6" />
        <div className="flex flex-col md:flex-row justify-between items-center text-[9px] text-[#333] tracking-[2px] uppercase gap-3 text-center">
          <div>&copy; 2026 RNVN OFFICIAL. ALL RIGHTS RESERVED.</div>
          <div>INDONESIA</div>
        </div>
      </footer>
    </main>
  );
}
