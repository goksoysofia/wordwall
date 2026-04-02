"use client";

import { useState } from "react";
import type { Activity } from "@/types/activity";
import type { TemplateCategory } from "@/types/template";
import { TEMPLATE_CATEGORIES } from "@/types/template";

interface ShareTemplateModalProps {
  activity: Activity;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ShareTemplateModal({ activity, onClose, onSuccess }: ShareTemplateModalProps) {
  const [title, setTitle] = useState(activity.title);
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<TemplateCategory>("diger");
  const [tagsInput, setTagsInput] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!title.trim() || !authorName.trim()) {
      setError("Başlık ve isim zorunludur.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const tags = tagsInput
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);

      const res = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          type: activity.type,
          display_mode: activity.display_mode,
          theme: activity.theme,
          options: activity.options,
          category,
          tags,
          author_name: authorName.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Paylaşım başarısız.");

      onSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Bir hata oluştu.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="animate-scale-in relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"
        style={{ border: "2px solid rgba(45, 27, 105, 0.08)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 font-heading text-xl font-bold text-[#2D1B69]">
          Şablon Olarak Paylaş 🌟
        </h2>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-bold text-[#8B7BAD]">Şablon Adı</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="input-playful" placeholder="Şablon başlığı" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-[#8B7BAD]">Açıklama</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="input-playful min-h-[80px] resize-none" placeholder="Bu şablon ne için kullanılır?" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-[#8B7BAD]">Kategori</label>
            <div className="flex flex-wrap gap-2">
              {TEMPLATE_CATEGORIES.map((cat) => (
                <button
                  key={cat.slug}
                  type="button"
                  onClick={() => setCategory(cat.slug)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                    category === cat.slug
                      ? "bg-[#2D1B69] text-white"
                      : "bg-[#F8F5FF] text-[#8B7BAD] hover:bg-[#F0EAFF]"
                  }`}
                >
                  {cat.emoji} {cat.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-[#8B7BAD]">Etiketler (virgülle ayırın)</label>
            <input type="text" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} className="input-playful" placeholder="r-sesi, 5-7-yas, eslestirme" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-[#8B7BAD]">Adınız</label>
            <input type="text" value={authorName} onChange={(e) => setAuthorName(e.target.value)} className="input-playful" placeholder="Örn. Ayşe Öğretmen" />
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-xl bg-red-50 px-4 py-2 text-center text-xs font-bold text-red-600">{error}</div>
        )}

        <div className="mt-6 flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 rounded-2xl bg-[#F8F5FF] py-3 text-sm font-bold text-[#8B7BAD] transition hover:bg-[#F0EAFF]">
            İptal
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => void handleSubmit()}
            className="btn-candy btn-green flex flex-1 items-center justify-center gap-2 rounded-2xl py-3 text-sm"
          >
            {saving ? "Paylaşılıyor..." : "Paylaş 🚀"}
          </button>
        </div>
      </div>
    </div>
  );
}
