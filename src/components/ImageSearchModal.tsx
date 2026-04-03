"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface PexelsPhoto {
  id: number;
  src: string;
  thumb: string;
  alt: string;
  photographer: string;
}

interface ImageSearchModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
}

export default function ImageSearchModal({ open, onClose, onSelect }: ImageSearchModalProps) {
  const [query, setQuery] = useState("");
  const [photos, setPhotos] = useState<PexelsPhoto[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery("");
      setPhotos([]);
      setSearched(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const search = useCallback(async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(`/api/search-images?q=${encodeURIComponent(query.trim())}`);
      const data = await res.json();
      if (res.ok) {
        setPhotos(data.photos ?? []);
      } else {
        setPhotos([]);
      }
    } catch {
      setPhotos([]);
    } finally {
      setLoading(false);
    }
  }, [query]);

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="relative mx-4 flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#E8E0F5] px-5 py-4">
            <h3 className="font-heading text-lg font-bold text-[#2D1B69]">Görsel Ara</h3>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-1.5 text-[#8B7BAD] transition hover:bg-[#F8F5FF]"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Search bar */}
          <div className="flex gap-2 px-5 py-3">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && search()}
              placeholder="Örn: kedi, okul, meyve..."
              className="flex-1 rounded-xl border-2 border-[#E8E0F5] bg-[#F8F5FF] px-4 py-2.5 text-sm font-semibold text-[#2D1B69] outline-none transition placeholder:text-[#B8A0E0] focus:border-[#A78BFA]"
            />
            <button
              type="button"
              onClick={search}
              disabled={loading || !query.trim()}
              className="rounded-xl bg-gradient-to-r from-[#A78BFA] to-[#818CF8] px-5 py-2.5 text-sm font-bold text-white shadow-md transition hover:shadow-lg disabled:opacity-50"
            >
              {loading ? "..." : "Ara"}
            </button>
          </div>

          {/* Results */}
          <div className="flex-1 overflow-y-auto px-5 pb-4">
            {loading && (
              <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#E8E0F5] border-t-[#A78BFA]" />
              </div>
            )}

            {!loading && searched && photos.length === 0 && (
              <p className="py-12 text-center text-sm font-semibold text-[#8B7BAD]">
                Sonuç bulunamadı. Farklı bir terim deneyin.
              </p>
            )}

            {!loading && photos.length > 0 && (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {photos.map((photo) => (
                  <button
                    key={photo.id}
                    type="button"
                    onClick={() => {
                      onSelect(photo.src);
                      onClose();
                    }}
                    className="group relative aspect-square overflow-hidden rounded-xl border-2 border-transparent transition hover:border-[#A78BFA] hover:shadow-lg"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.thumb}
                      alt={photo.alt}
                      className="h-full w-full object-cover transition group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 transition group-hover:opacity-100" />
                    <span className="absolute bottom-1 left-1 right-1 truncate text-[10px] font-semibold text-white opacity-0 transition group-hover:opacity-100">
                      {photo.photographer}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {!loading && !searched && (
              <p className="py-12 text-center text-sm font-semibold text-[#8B7BAD]">
                Pexels&apos;ten ücretsiz görseller arayın
              </p>
            )}
          </div>

          {/* Pexels attribution */}
          <div className="border-t border-[#E8E0F5] px-5 py-2 text-center">
            <span className="text-[11px] font-semibold text-[#B8A0E0]">
              Görseller{" "}
              <a href="https://www.pexels.com" target="_blank" rel="noopener noreferrer" className="underline">
                Pexels
              </a>
              {" "}tarafından sağlanmaktadır
            </span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
