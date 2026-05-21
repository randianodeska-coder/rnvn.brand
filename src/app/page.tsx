"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useCartStore } from "@/store/useCartStore";

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
          <h3 className="font-[family-name:var(--font-syncopate)] font-bold text-xs tracking-[3px] text-white">SHOPPING BAG ({items.reduce((acc, curr) => acc + curr.quantity, 0)})</h3>
          <button className="bg-transparent border-none text-white text-lg cursor-none opacity-50 hover:opacity-100 transition-opacity" onClick={closeOverlays}>✕</button>
        </div>
        
        <div className="flex-1 p-6 flex flex-col gap-5 overflow-y-auto">
          {items.length === 0 ? (
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
            items.map((item) => (
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

        {items.length > 0 && (
          <div className="px-6 py-4 border-t border-white/5 bg-black/10 flex justify-between items-center">
            <span className="text-[10px] font-semibold tracking-widest uppercase text-[#888888]">Estimated Total</span>
            <span className="text-sm font-bold tracking-wide text-white">IDR {getCartTotal().toLocaleString("id-ID")}</span>
          </div>
        )}

        <div className="p-4 pb-8 md:p-6 border-t border-white/5 flex flex-col gap-2 bg-black/20">
          <button 
            disabled={items.length === 0}
            className="w-full py-3 md:py-4 px-4 bg-white text-black text-[11px] font-bold tracking-widest uppercase border-none cursor-none transition-all duration-300 hover:bg-neutral-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none" 
            onClick={() => {
              const message = `Halo RNVN, saya ingin memesan:\n\n` + 
                              items.map(item => `- ${item.name} (${item.quantity}x) = IDR ${(item.price * item.quantity).toLocaleString("id-ID")}`).join("\n") +
                              `\n\nTotal: IDR ${getCartTotal().toLocaleString("id-ID")}`;
              window.open(`https://wa.me/628563122123?text=${encodeURIComponent(message)}`, "_blank");
            }}
          >
            Checkout via WhatsApp
          </button>
          
          <div className="grid grid-cols-2 gap-2">
            <a 
              href="https://vt.tiktok.com/ZSHKqtkr8/?page=Mall" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="py-2.5 md:py-3 px-3 bg-neutral-900/50 hover:bg-neutral-900 border border-white/10 text-white text-[9px] font-semibold tracking-widest uppercase text-center no-underline cursor-none transition-all duration-300"
            >
              TikTok Shop
            </a>
            <a 
              href="#" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="py-2.5 md:py-3 px-3 bg-[#0c0c0c]/50 hover:bg-neutral-900 border border-white/10 text-white text-[9px] font-semibold tracking-widest uppercase text-center no-underline cursor-none transition-all duration-300"
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
        </div>
      )}

      {/* Floating Cart Button (Mobile only) */}
      <button 
        onClick={() => setCartActive(true)}
        className="md:hidden fixed bottom-6 right-6 z-[990] w-14 h-14 bg-white text-black rounded-full flex items-center justify-center shadow-luxury border border-white/10 hover-target active:scale-95 transition-all"
        aria-label="Shopping Cart"
      >
        <div className="relative">
          <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
          </svg>
          {items.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-black text-white text-[9px] font-bold rounded-full w-5 h-5 flex items-center justify-center border border-white/20 animate-badge-pulse">
              {items.reduce((total, item) => total + item.quantity, 0)}
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
            <li><a href="#collection" className="text-[11px] font-medium uppercase tracking-[2px] text-white no-underline opacity-70 hover:opacity-100 transition-opacity hover-target">Drop</a></li>
            <li><a href="#collection" className="text-[11px] font-medium uppercase tracking-[2px] text-white no-underline opacity-70 hover:opacity-100 transition-opacity hover-target">Collection</a></li>
            <li><a href="#manifesto" className="text-[11px] font-medium uppercase tracking-[2px] text-white no-underline opacity-70 hover:opacity-100 transition-opacity hover-target">Manifesto</a></li>
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
              {items.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-white text-black text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center animate-badge-pulse">
                  {items.reduce((total, item) => total + item.quantity, 0)}
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
        <div 
          className="absolute -top-[5%] left-0 w-full h-[110%] bg-cover bg-center opacity-25 grayscale contrast-125 z-0"
          style={{ backgroundImage: "url('/assets/whatsapp image 2026-03-20 at 21.58.30.jpeg')" }}
          ref={heroImageRef}
        ></div>
        <div className="absolute bottom-0 left-0 w-full h-[30%] bg-gradient-to-t from-[#050505] to-transparent z-[1]"></div>
        <div className="relative z-[2] px-[5vw] max-w-[800px] flex flex-col items-center">
          <div className="text-[10px] font-medium tracking-[6px] text-[#888888] mb-6 uppercase opacity-0 animate-[fadeUpAnim_1s_1s_forwards]">Official Store</div>
          <h1 className="font-[family-name:var(--font-bebas)] text-[clamp(3.5rem,10vw,8rem)] text-white mb-6 opacity-0 animate-[fadeUpAnim_1s_1.2s_forwards]">Tak Dikenal<br/>Tak Tertandingi</h1>
          <p className="text-sm text-[#888888] leading-[1.7] tracking-wide mb-10 max-w-[400px] opacity-0 animate-[fadeUpAnim_1s_1.4s_forwards]">
            Dibangun untuk mereka yang menolak tren dengan bahan premium dan identitas streetwear sejati.
          </p>
          <a href="https://vt.tiktok.com/ZSHKqtkr8/?page=Mall" target="_blank" rel="noopener noreferrer" className="magnetic inline-block px-10 py-4 bg-white text-black text-[11px] font-semibold tracking-[2px] uppercase no-underline transition-all opacity-0 animate-[fadeUpAnim_1s_1.6s_forwards] hover-target hover:bg-gray-200">
            SHOP NOW
          </a>
        </div>
      </section>

      {/* Marquee */}
      <div className="w-full py-4 bg-[#0a0a0a] text-white border-y border-white/10 overflow-hidden whitespace-nowrap flex items-center relative z-[2]">
        <div className="inline-block animate-[scrollText_30s_linear_infinite]">
          {[...Array(2)].map((_, i) => (
            <span key={i}>
              <span className="font-[family-name:var(--font-bebas)] text-2xl tracking-[3px] mx-10 opacity-80">RNVN OFFICIAL</span><span className="text-[10px] align-middle text-[#888888]">•</span>
              <span className="font-[family-name:var(--font-bebas)] text-2xl tracking-[3px] mx-10 opacity-80">SIGNATURE BOXY</span><span className="text-[10px] align-middle text-[#888888]">•</span>
              <span className="font-[family-name:var(--font-bebas)] text-2xl tracking-[3px] mx-10 opacity-80">PREMIUM STREETWEAR</span><span className="text-[10px] align-middle text-[#888888]">•</span>
              <span className="font-[family-name:var(--font-bebas)] text-2xl tracking-[3px] mx-10 opacity-80">LIMITED DROP</span><span className="text-[10px] align-middle text-[#888888]">•</span>
            </span>
          ))}
        </div>
      </div>

      {/* Collection */}
      <section id="collection" className="py-[120px] px-[5vw] relative z-[2]">
        <div className="flex justify-between items-end mb-16 pb-5 border-b border-white/10 reveal">
          <h2 className="font-[family-name:var(--font-bebas)] text-white text-[clamp(2.5rem,5vw,4rem)] tracking-wide m-0 leading-none">The Archives</h2>
          <a href="#" className="text-[11px] font-medium uppercase tracking-wide text-[#888888] no-underline transition-colors hover:text-white hover-target">View Full Catalog</a>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-[30px]">
          
          {/* Product 1 */}
          <a href="#" className="flex flex-col no-underline text-inherit cursor-none group reveal hover-target-image border border-white/5 bg-[#080808]/40 p-2 md:p-4 rounded-lg transition-all duration-500 hover:border-white/10 hover:bg-[#080808]/80 hover:shadow-luxury relative">
            <div className="bg-white w-full aspect-[3/4] relative overflow-hidden rounded-md mb-4 border border-white/5">
              <div className="absolute top-3 left-3 text-[8px] md:text-[9px] font-semibold tracking-[1.5px] bg-black text-white py-0.5 px-1.5 uppercase z-[2] rounded-sm">New</div>
              <Image src="/assets/rnvn4.png" alt="Signature Boxy" fill className="object-contain p-1 max-md:p-0 md:p-3 scale-[1.12] transition-transform duration-700 ease-out group-hover:scale-[1.18]" />
              
              {/* Mobile Quick Add (+) */}
              <button 
                className="md:hidden absolute bottom-2.5 right-2.5 bg-black text-white w-8 h-8 rounded-full shadow-lg z-[4] flex items-center justify-center hover-target active:scale-90 transition-transform"
                onClick={(e) => {
                  e.preventDefault();
                  addItem({ id: 1, name: "BOXY FIT (Pre-Order)", price: 129000, image_url: "/assets/rnvn4.png" });
                  setCartActive(true);
                }}
                aria-label="Add to cart"
              >
                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"></path>
                </svg>
              </button>

              {/* Desktop Quick Add */}
              <div 
                className="hidden md:flex absolute bottom-0 left-0 w-full p-4 bg-black text-white justify-center items-center text-[10px] font-bold tracking-widest translate-y-full transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] z-[3] group-hover:translate-y-0 hover:bg-black/90"
                onClick={(e) => {
                  e.preventDefault();
                  addItem({ id: 1, name: "BOXY FIT (Pre-Order)", price: 129000, image_url: "/assets/rnvn4.png" });
                  setCartActive(true);
                }}
              >
                ADD TO BAG
              </div>
            </div>
            <div className="flex flex-col gap-1 px-1">
              <div className="flex justify-between items-baseline gap-1">
                <span className="text-[12px] md:text-[13px] text-white font-medium uppercase tracking-wide truncate">BOXY FIT (Pre-Order)</span>
                <span className="text-[10px] md:text-xs text-white font-semibold tracking-wide flex-shrink-0">IDR 129.000</span>
              </div>
              <div className="text-[9px] md:text-xs text-[#888888] tracking-wide uppercase">Cotton combed 20s</div>
            </div>
          </a>

          {/* Product 2 */}
          <a href="#" className="flex flex-col no-underline text-inherit cursor-none group reveal hover-target-image border border-white/5 bg-[#080808]/40 p-2 md:p-4 rounded-lg transition-all duration-500 hover:border-white/10 hover:bg-[#080808]/80 hover:shadow-luxury relative" style={{ transitionDelay: "0.1s" }}>
            <div className="bg-[#030303] w-full aspect-[3/4] relative overflow-hidden rounded-md mb-4 border border-white/5">
              <Image src="/assets/img_8767.jpg.jpeg" alt="Streetwear Core" fill className="object-cover transition-transform duration-700 ease-out group-hover:scale-105" />
              
              {/* Mobile Quick Add (+) */}
              <button 
                className="md:hidden absolute bottom-2.5 right-2.5 bg-white text-black w-8 h-8 rounded-full shadow-lg z-[4] flex items-center justify-center hover-target active:scale-90 transition-transform"
                onClick={(e) => {
                  e.preventDefault();
                  addItem({ id: 2, name: "boxy fit (Pre-Order)", price: 129000, image_url: "/assets/img_8767.jpg.jpeg" });
                  setCartActive(true);
                }}
                aria-label="Add to cart"
              >
                <svg className="w-3.5 h-3.5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"></path>
                </svg>
              </button>

              {/* Desktop Quick Add */}
              <div 
                className="hidden md:flex absolute bottom-0 left-0 w-full p-4 bg-black/75 backdrop-blur-md text-white justify-center items-center text-[10px] font-bold tracking-widest translate-y-full transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] z-[3] group-hover:translate-y-0 hover:bg-white hover:text-black"
                onClick={(e) => {
                  e.preventDefault();
                  addItem({ id: 2, name: "boxy fit (Pre-Order)", price: 129000, image_url: "/assets/img_8767.jpg.jpeg" });
                  setCartActive(true);
                }}
              >
                ADD TO BAG
              </div>
            </div>
            <div className="flex flex-col gap-1 px-1">
              <div className="flex justify-between items-baseline gap-1">
                <span className="text-[12px] md:text-[13px] text-white font-medium uppercase tracking-wide truncate">boxy fit (Pre-Order)</span>
                <span className="text-[10px] md:text-xs text-white font-semibold tracking-wide flex-shrink-0">IDR 129.000</span>
              </div>
              <div className="text-[9px] md:text-xs text-[#888888] tracking-wide uppercase">cotton combed 20s</div>
            </div>
          </a>

          {/* Product 3 */}
          <a href="#" className="flex flex-col no-underline text-inherit cursor-none group reveal hover-target-image border border-white/5 bg-[#080808]/40 p-2 md:p-4 rounded-lg transition-all duration-500 hover:border-white/10 hover:bg-[#080808]/80 hover:shadow-luxury relative" style={{ transitionDelay: "0.2s" }}>
            <div className="bg-white w-full aspect-[3/4] relative overflow-hidden rounded-md mb-4 border border-white/5">
              <Image src="/assets/tshirts rnvn.png" alt="Essential T-Shirt" fill className="object-contain p-1 max-md:p-0 md:p-3 scale-[1.12] transition-transform duration-700 ease-out group-hover:scale-[1.18]" />
              
              {/* Mobile Quick Add (+) */}
              <button 
                className="md:hidden absolute bottom-2.5 right-2.5 bg-black text-white w-8 h-8 rounded-full shadow-lg z-[4] flex items-center justify-center hover-target active:scale-90 transition-transform"
                onClick={(e) => {
                  e.preventDefault();
                  addItem({ id: 3, name: "T-shirt (Pre-Order)", price: 79000, image_url: "/assets/tshirts rnvn.png" });
                  setCartActive(true);
                }}
                aria-label="Add to cart"
              >
                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"></path>
                </svg>
              </button>

              {/* Desktop Quick Add */}
              <div 
                className="hidden md:flex absolute bottom-0 left-0 w-full p-4 bg-black text-white justify-center items-center text-[10px] font-bold tracking-widest translate-y-full transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] z-[3] group-hover:translate-y-0 hover:bg-black/90"
                onClick={(e) => {
                  e.preventDefault();
                  addItem({ id: 3, name: "T-shirt (Pre-Order)", price: 79000, image_url: "/assets/tshirts rnvn.png" });
                  setCartActive(true);
                }}
              >
                ADD TO BAG
              </div>
            </div>
            <div className="flex flex-col gap-1 px-1">
              <div className="flex justify-between items-baseline gap-1">
                <span className="text-[12px] md:text-[13px] text-white font-medium uppercase tracking-wide truncate">T-shirt (Pre-Order)</span>
                <span className="text-[10px] md:text-xs text-white font-semibold tracking-wide flex-shrink-0">IDR 79.000</span>
              </div>
              <div className="text-[9px] md:text-xs text-[#888888] tracking-wide uppercase">cotton combed 24s</div>
            </div>
          </a>

          {/* Product 4 */}
          <a href="#" className="flex flex-col no-underline text-inherit cursor-none group reveal hover-target-image border border-white/5 bg-[#080808]/40 p-2 md:p-4 rounded-lg transition-all duration-500 hover:border-white/10 hover:bg-[#080808]/80 hover:shadow-luxury relative" style={{ transitionDelay: "0.3s" }}>
            <div className="bg-[#030303] w-full aspect-[3/4] relative overflow-hidden rounded-md mb-4 border border-white/5">
              <Image src="/assets/img_8789.jpg.jpeg" alt="Urban Edition" fill className="object-cover transition-transform duration-700 ease-out group-hover:scale-105" />
              
              {/* Mobile Quick Add (+) */}
              <button 
                className="md:hidden absolute bottom-2.5 right-2.5 bg-white text-black w-8 h-8 rounded-full shadow-lg z-[4] flex items-center justify-center hover-target active:scale-90 transition-transform"
                onClick={(e) => {
                  e.preventDefault();
                  addItem({ id: 4, name: "T-shirt (Pre-Order)", price: 79000, image_url: "/assets/img_8789.jpg.jpeg" });
                  setCartActive(true);
                }}
                aria-label="Add to cart"
              >
                <svg className="w-3.5 h-3.5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"></path>
                </svg>
              </button>

              {/* Desktop Quick Add */}
              <div 
                className="hidden md:flex absolute bottom-0 left-0 w-full p-4 bg-black/75 backdrop-blur-md text-white justify-center items-center text-[10px] font-bold tracking-widest translate-y-full transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] z-[3] group-hover:translate-y-0 hover:bg-white hover:text-black"
                onClick={(e) => {
                  e.preventDefault();
                  addItem({ id: 4, name: "T-shirt (Pre-Order)", price: 79000, image_url: "/assets/img_8789.jpg.jpeg" });
                  setCartActive(true);
                }}
              >
                ADD TO BAG
              </div>
            </div>
            <div className="flex flex-col gap-1 px-1">
              <div className="flex justify-between items-baseline gap-1">
                <span className="text-[12px] md:text-[13px] text-white font-medium uppercase tracking-wide truncate">T-shirt (Pre-Order)</span>
                <span className="text-[10px] md:text-xs text-white font-semibold tracking-wide flex-shrink-0">IDR 79.000</span>
              </div>
              <div className="text-[9px] md:text-xs text-[#888888] tracking-wide uppercase">cotton combed 24s</div>
            </div>
          </a>

        </div>
      </section>

      {/* Manifesto */}
      <section id="manifesto" className="py-[100px] px-[5vw] md:py-[100px] max-md:py-[80px] grid grid-cols-1 md:grid-cols-2 gap-[40px] md:gap-[6vw] items-center border-t border-white/10 relative z-[2]">
        <div className="w-full aspect-[16/9] md:aspect-[4/5] relative overflow-hidden rounded reveal">
          <Image src="/assets/untitled-1-recovered.png" alt="RNVN Vision" fill className="object-contain" />
        </div>
        <div className="py-0 md:py-10 reveal text-white">
          <h2 className="font-[family-name:var(--font-bebas)] text-[clamp(3rem,6vw,4.5rem)] mb-8 m-0 leading-[0.9]">The<br/>Manifesto</h2>
          <p className="text-sm leading-[1.8] text-[#888888] mb-5 max-w-[480px] tracking-wide">
            <strong className="text-white font-medium">RNVN Hadir</strong> sebagai representasi individu modern yang bergerak dengan karakter, visi, dan identitas yang kuat. Kami percaya bahwa pakaian bukan sekedar penampilan, melainkan bentuk ekspresi yang mencerminkan cara berpikir dan cara hidup.
          </p>
          <p className="text-sm leading-[1.8] text-[#888888] mb-5 max-w-[480px] tracking-wide">
            Setiap koleksi dirancang melalui pemilihan material berkualitas, siluet yang presisi, dan detail yang fungsional untuk  kenyamanan, estetika, dan ketahanan.

Dengan  desain yang minimal, modern, dan abadi, RNVN diciptakan untuk mereka yang memilih untuk tampil berbeda.
          </p>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-[100px] px-[5vw] border-t border-white/10 text-center relative z-[2] bg-[#0a0a0a] reveal text-white">
        {isSubscribed ? (
          <div className="opacity-0 animate-[fadeUpAnim_0.8s_forwards] flex flex-col items-center justify-center gap-2">
            <h3 className="font-[family-name:var(--font-bebas)] text-[clamp(2.5rem,5vw,4rem)] text-white tracking-widest leading-none mb-2">WELCOME TO THE MOVEMENT</h3>
            <p className="text-[#25D366] text-xs font-semibold tracking-widest uppercase">{message}</p>
          </div>
        ) : (
          <>
            <h2 className="font-[family-name:var(--font-bebas)] text-[clamp(2rem,4vw,3.5rem)] mb-4 m-0 leading-none">JOIN THE MOVEMENT</h2>
            <p className="text-[#888888] text-[13px] mb-10 tracking-widest uppercase">Early access to limited collections and exclusive releases..</p>
            <form onSubmit={handleSubscribe} className="flex max-w-[400px] mx-auto border-b border-white/30 transition-colors focus-within:border-white hover:border-white">
              <input 
                type="email" 
                placeholder={submitting ? "SENDING..." : "ENTER YOUR EMAIL ADDRESS"} 
                className="flex-1 bg-transparent border-none text-white py-3 outline-none text-[13px] tracking-wide placeholder:text-[#666] hover-target"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={submitting}
                required
              />
              <button 
                type="submit" 
                className="bg-transparent border-none text-white text-lg px-2.5 transition-transform hover:translate-x-1 hover-target disabled:opacity-50"
                disabled={submitting}
              >
                {submitting ? "..." : "→"}
              </button>
            </form>
            {subError && (
              <p className="text-red-500 text-[11px] mt-4 tracking-wider uppercase">{message}</p>
            )}
          </>
        )}
      </section>

      {/* Footer */}
      <footer id="contact" className="pt-[60px] pb-[30px] px-[5vw] border-t border-white/10 relative z-[2] bg-[#050505] text-white">
        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr] gap-[40px] md:gap-[50px] mb-[60px]">
          <div>
            <a href="#" className="font-[family-name:var(--font-syncopate)] text-2xl font-bold tracking-[4px] mb-5 block text-white no-underline hover-target">RNVN</a>
            <p className="text-[#888888] text-xs max-w-[250px] leading-[1.8]">Tak Dikenal Tak Tertandingi<br/>Indonesian premium streetwear</p>
          </div>
          <div>
            <h4 className="text-[10px] font-semibold tracking-[2px] uppercase text-[#888888] mb-6">Collections</h4>
            <ul className="list-none flex flex-col gap-3 m-0 p-0">
              <li><a href="#" className="text-white no-underline text-xs tracking-wide opacity-80 hover:opacity-100 hover-target transition-opacity">Latest Drop</a></li>
              <li><a href="#" className="text-white no-underline text-xs tracking-wide opacity-80 hover:opacity-100 hover-target transition-opacity">Boxy T-Shirts</a></li>
              <li><a href="#" className="text-white no-underline text-xs tracking-wide opacity-80 hover:opacity-100 hover-target transition-opacity">Regular T-Shirts</a></li>
              <li><a href="#" className="text-white no-underline text-xs tracking-wide opacity-80 hover:opacity-100 hover-target transition-opacity">Lookbook</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-[10px] font-semibold tracking-[2px] uppercase text-[#888888] mb-6">Support</h4>
            <ul className="list-none flex flex-col gap-3 m-0 p-0">
              <li><a href="#" className="text-white no-underline text-xs tracking-wide opacity-80 hover:opacity-100 hover-target transition-opacity">Size Chart</a></li>
              <li><a href="#" className="text-white no-underline text-xs tracking-wide opacity-80 hover:opacity-100 hover-target transition-opacity">Shipping Info</a></li>
              
              <li><a href="#" className="text-white no-underline text-xs tracking-wide opacity-80 hover:opacity-100 hover-target transition-opacity">WhatsApp Support</a></li>
            </ul>
          </div>
        </div>
        <div className="flex flex-col md:flex-row justify-between items-center pt-6 border-t border-white/10 text-[10px] text-[#888888] tracking-widest uppercase gap-4 text-center">
          <div>&copy; 2026 RNVN OFFICIAL. ALL RIGHTS RESERVED.</div>
          <div>INDONESIA</div>
        </div>
      </footer>
    </main>
  );
}
