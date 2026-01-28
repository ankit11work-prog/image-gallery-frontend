"use client";

import { useEffect, useState, useRef } from "react";
import api from "./services/api";
import GoogleLoginButton from "./components/GoogleLoginButton";
import Link from "next/link";
import { 
  Heart, 
  Loader2, 
  ChevronLeft, 
  ChevronRight, 
  Search as SearchIcon,
  Zap,
  Filter
} from "lucide-react";

interface Image {
  _id: string;
  imageUrl: string;
  title: string;
  likeCount: number;
  likedByMe?: boolean;
}

export default function Home() {
  const [images, setImages] = useState<Image[]>([]);
  // Sorting options: latest, popular (most liked), alphabetical
  const [sort, setSort] = useState("latest");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [token, setToken] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [animatingId, setAnimatingId] = useState<string | null>(null);
  
  const lastTap = useRef<number>(0);
  const galleryTopRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHydrated(true);
    const storedToken = localStorage.getItem("user_token");
    if (storedToken) setToken(storedToken);
  }, []);

  // Smooth Scroll to Top on page change
  useEffect(() => {
    if (galleryTopRef.current && hydrated) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [page]);

  useEffect(() => {
    const handler = () => {
      const storedToken = localStorage.getItem("user_token");
      setToken(storedToken);
      fetchImages(); 
    };
    window.addEventListener("auth-changed", handler);
    return () => window.removeEventListener("auth-changed", handler);
  }, []);

  // Reset to page 1 when search or sort changes
  useEffect(() => { setPage(1); }, [sort, search]);
  
  useEffect(() => { 
    if (hydrated) {
      const timeoutId = setTimeout(() => fetchImages(), 300); // Debounce search
      return () => clearTimeout(timeoutId);
    }
  }, [sort, search, page, hydrated]);

  const fetchImages = async () => {
    setLoading(true);
    try {
      // Endpoint assumes it can handle sort=alphabetical and sort=popular
      const res = await api.get(`/images?sort=${sort}&search=${search}&page=${page}&limit=6`);
      setImages(res.data);
    } catch (err) {
      console.error("Archive fetch failed", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user_token");
    setToken(null);
    window.dispatchEvent(new Event("auth-changed"));
  };

  const handleInteraction = (id: string) => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    if (now - lastTap.current < DOUBLE_TAP_DELAY) {
      handleLikeToggle(id);
    }
    lastTap.current = now;
  };

  const handleLikeToggle = async (id: string) => {
    if (!token) return alert("Access Denied: Please Login to Like");
    const target = images.find(img => img._id === id);
    if (!target) return;
    const isCurrentlyLiked = target.likedByMe;

    if (!isCurrentlyLiked) {
      setAnimatingId(id);
      setTimeout(() => setAnimatingId(null), 800);
    }

    try {
      setImages(prev => prev.map(img => {
        if (img._id === id) {
          return {
            ...img,
            likedByMe: !isCurrentlyLiked,
            likeCount: isCurrentlyLiked ? Math.max(0, img.likeCount - 1) : img.likeCount + 1
          };
        }
        return img;
      }));
      await api.post(`/images/${id}/like`);
    } catch (err) {
      console.error("Registry update failed", err);
      fetchImages();
    }
  };

  if (!hydrated) return null;

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-zinc-900 antialiased selection:bg-zinc-900 selection:text-white">
      <div ref={galleryTopRef} className="absolute top-0 left-0" />

      {/* --- Premium Navbar with Integrated Search --- */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-2xl border-b border-zinc-200/40">
        <div className="max-w-[1600px] mx-auto px-4 md:px-12 h-20 md:h-28 flex items-center justify-between gap-4">
          
          <div className="flex items-center gap-4 shrink-0">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-zinc-950 rounded-2xl flex items-center justify-center shadow-2xl shadow-zinc-300">
                <Zap className="text-white fill-white" size={22} />
            </div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tighter text-zinc-950 italic hidden lg:block">
              STUDIO<span className="font-light not-italic text-zinc-400">GALLERY</span>
            </h1>
          </div>

          {/* Centered Search Engine */}
          <div className="flex-1 max-w-xl group">
            <div className="relative flex items-center">
              <SearchIcon size={18} className="absolute left-5 text-zinc-400 group-focus-within:text-zinc-950 transition-colors" />
              <input
                placeholder="Query asset database..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-zinc-100/80 border-2 border-transparent py-3 md:py-4 pl-14 pr-6 rounded-3xl outline-none text-sm font-medium focus:bg-white focus:border-zinc-950/10 transition-all placeholder:text-zinc-400 shadow-inner"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 md:gap-6 shrink-0">
            {token ? (
              <div className="flex items-center gap-3">
                <Link href="/liked" className="p-3 bg-zinc-100 hover:bg-zinc-200 rounded-full transition-colors hidden sm:flex">
                  <Heart size={20} className="text-zinc-600" />
                </Link>
                <button onClick={handleLogout} className="px-5 py-3 bg-zinc-950 text-white rounded-2xl text-[10px] md:text-[11px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-transform">Sign Out</button>
              </div>
            ) : (
              <GoogleLoginButton />
            )}
          </div>
        </div>
        
        {/* --- Sub-Navigation Filters --- */}
        <div className="max-w-[1600px] mx-auto px-4 md:px-12 py-4 flex items-center justify-center md:justify-start gap-2 overflow-x-auto no-scrollbar">
          <Filter size={14} className="text-zinc-400 mr-2 hidden md:block" />
          {[
            { id: "latest", label: "Newest" },
            { id: "popular", label: "Most Liked" },
            { id: "alphabetical", label: "A-Z Order" }
          ].map((option) => (
            <button
              key={option.id}
              onClick={() => setSort(option.id)}
              className={`px-6 py-2.5 text-[10px] font-bold uppercase tracking-[0.2em] rounded-full whitespace-nowrap transition-all border ${
                sort === option.id 
                ? "bg-zinc-950 text-white border-zinc-950 shadow-xl shadow-zinc-200" 
                : "bg-white text-zinc-400 border-zinc-200 hover:border-zinc-400"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-4 md:px-12 py-8 md:py-16">
        {loading && images.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-60">
            <Loader2 className="animate-spin text-zinc-200" size={64} strokeWidth={1.5} />
            <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.4em] text-zinc-400">Reconstructing Archive</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-16 transition-all duration-1000">
            {images.map((img) => (
              <div 
                key={img._id} 
                className="group relative flex flex-col"
                onClick={() => handleInteraction(img._id)}
              >
                <div className="relative aspect-[4/5] overflow-hidden rounded-[3.5rem] bg-zinc-100 shadow-sm transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] group-hover:-translate-y-4 border border-zinc-100/50">
                  <img
                    src={img.imageUrl}
                    alt={img.title}
                    className="w-full h-full object-cover transition-transform duration-[2.5s] group-hover:scale-110"
                  />

                  {animatingId === img._id && (
                    <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
                      <Heart size={140} className="text-white fill-white animate-[heart-pop_0.8s_ease-out_forwards]" />
                    </div>
                  )}

                  {/* Information Overlay */}
                  <div className="absolute inset-x-0 bottom-0 p-8 md:p-10 bg-gradient-to-t from-black/95 via-black/40 to-transparent">
                    <div className="flex items-end justify-between gap-4">
                      <div className="flex flex-col overflow-hidden">
                        <span className="text-[9px] font-black uppercase tracking-[0.4em] text-white/40 mb-2">Digital_Asset</span>
                        <h2 className="text-xl md:text-3xl font-bold text-white tracking-tighter leading-none truncate pr-4 drop-shadow-sm">
                          {img.title || "Untitled"}
                        </h2>
                      </div>
                      
                      {img.likeCount >= 0 && (
                        <div className={`flex items-center gap-2.5 backdrop-blur-3xl border px-5 py-3 rounded-3xl transition-all shadow-2xl ${
                          img.likedByMe ? "bg-red-500/10 border-red-500/20" : "bg-white/10 border-white/20"
                        }`}>
                          <Heart 
                            size={20} 
                            className={img.likedByMe ? "fill-red-500 text-red-500" : "text-white"} 
                          />
                          <span className="text-lg font-black text-white tabular-nums leading-none">{img.likeCount}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        <footer className="flex items-center justify-between mt-32 py-12 border-t border-zinc-100">
          <button 
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="group p-6 rounded-full border-2 border-zinc-100 hover:bg-zinc-950 hover:border-zinc-950 hover:text-white disabled:opacity-5 transition-all duration-700 active:scale-90"
          >
            <ChevronLeft size={32} />
          </button>

          <div className="flex flex-col items-center">
             <span className="text-[9px] font-black text-zinc-300 uppercase tracking-[0.6em] mb-3 italic">Archive_Pointer</span>
             <div className="text-6xl font-black tracking-tighter text-zinc-950/90 leading-none">0{page}</div>
          </div>

          <button 
            onClick={() => setPage((p) => p + 1)}
            disabled={images.length < 6}
            className="group p-6 rounded-full border-2 border-zinc-100 hover:bg-zinc-950 hover:border-zinc-950 hover:text-white disabled:opacity-5 transition-all duration-700 active:scale-90"
          >
            <ChevronRight size={32} />
          </button>
        </footer>
      </main>

      <style jsx global>{`
        @keyframes heart-pop {
          0% { transform: scale(0) rotate(-10deg); opacity: 0; }
          25% { transform: scale(1.4) rotate(0deg); opacity: 1; }
          45% { transform: scale(0.9) rotate(5deg); opacity: 1; }
          100% { transform: scale(1.8); opacity: 0; }
        }
        
        main {
          animation: pageReveal 1.2s cubic-bezier(0.23, 1, 0.32, 1) both;
        }

        @keyframes pageReveal {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}