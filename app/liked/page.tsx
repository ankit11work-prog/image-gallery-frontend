"use client";

import { useEffect, useState } from "react";
import api from "../services/api";
import Link from "next/link";
import { 
  ArrowLeft, 
  Heart, 
  Loader2,
  Bookmark,
  Grid,
  LogOut
} from "lucide-react";

export default function LikedPage() {
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hydrated, setHydrated] = useState(false);
  const [animatingId, setAnimatingId] = useState<string | null>(null);

  useEffect(() => {
    setHydrated(true);
    const token = localStorage.getItem("user_token");
    if (!token) {
      window.location.href = "/";
      return;
    }
    fetchLiked();
  }, []);

  const fetchLiked = async () => {
    try {
      const res = await api.get("/auth/me/likes");
      setImages(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user_token");
    window.location.href = "/";
  };

  if (!hydrated) return null;

  return (
    <div className="min-h-screen bg-white text-[#262626] font-sans antialiased">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-bold hover:text-[#ee2a7b] transition-colors"
          >
            <ArrowLeft size={24} />
            <span>EXIT VAULT</span>
          </Link>

          <h1 className="text-sm font-black uppercase tracking-[0.4em] absolute left-1/2 -translate-x-1/2 text-gray-400">
            Favorites
          </h1>

          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-red-50 text-gray-600 hover:text-red-600 rounded-lg text-xs font-bold transition-all"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-16">
        <div className="flex flex-col items-center mb-16 gap-6">
          <div className="w-28 h-28 rounded-full border-2 border-gray-100 p-1">
            <div className="w-full h-full rounded-full bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] flex items-center justify-center shadow-xl">
               <Bookmark size={40} className="text-white" />
            </div>
          </div>
          <div className="text-center">
            <h2 className="text-3xl font-black tracking-tight">Saved Assets</h2>
            <p className="text-sm text-gray-400 font-medium uppercase tracking-widest mt-2">
              <span className="text-black">{images.length}</span> Records in Collection
            </p>
          </div>
        </div>

        <div className="flex justify-center border-t border-gray-100 mb-12">
          <div className="flex items-center gap-2 border-t-2 border-black -mt-[2px] py-4 px-6">
            <Grid size={16} />
            <span className="text-xs font-black uppercase tracking-[0.2em]">Grid View</span>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-gray-300" size={32} /></div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-10">
            {images.map((img: any) => (
              <div 
                key={img._id} 
                onDoubleClick={() => { setAnimatingId(img._id); setTimeout(() => setAnimatingId(null), 800); }}
                className="relative aspect-square rounded-[2.5rem] md:rounded-[4rem] overflow-hidden bg-gray-50 shadow-sm hover:shadow-2xl transition-all duration-500 cursor-pointer"
              >
                <img src={img.imageUrl} alt={img.title} className="w-full h-full object-cover transition-transform duration-700 hover:scale-110" />
                {animatingId === img._id && (
                  <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
                    <Heart size={100} className="text-white fill-red-500 animate-ping" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-10 text-white">
                  <h3 className="text-xl font-bold truncate">{img.title}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <Heart size={16} className="fill-red-500 text-red-500" />
                    <span className="text-sm font-black tracking-widest">{img.likeCount}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}