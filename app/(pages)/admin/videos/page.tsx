"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { useTranslation } from "react-i18next";

interface Video {
  id: number;
  title:
    | {
        en: string;
        ar: string;
      }
    | string;
  description:
    | {
        en: string;
        ar: string;
      }
    | string;
  videoUrl: string;
  createdAt: string;
}

function extractYoutubeId(url: string): string {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : "";
}

const AdminVideosPage = () => {
  const { t, i18n } = useTranslation();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorVideo, setErrorVideo] = useState<string | null>(null);

  // Form states
  const [titleEn, setTitleEn] = useState("");
  const [titleAr, setTitleAr] = useState("");
  const [descriptionEn, setDescriptionEn] = useState("");
  const [descriptionAr, setDescriptionAr] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/videos`);
        setVideos(response.data.videos || []);
      } catch (err: any) {
        const errorMsg = err.response?.data?.message || t("videos.failedToLoad") || "فشل تحميل الفيديوهات";
        setErrorVideo(errorMsg);
        toast.error(errorMsg);
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, [t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!titleEn.trim() || !titleAr.trim()) {
      toast.error(t("videos.titleRequired") || "يرجى كتابة العنوان باللغتين");
      return;
    }

    if (!videoUrl.trim()) {
      toast.error(t("videos.urlRequired") || "يرجى إدخال رابط يوتيوب");
      return;
    }

    setIsSubmitting(true);
    try {
      const titleObj = {
        en: titleEn.trim(),
        ar: titleAr.trim(),
      };
      const descriptionObj = {
        en: descriptionEn.trim(),
        ar: descriptionAr.trim(),
      };

      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/videos/add`, {
        title: titleObj,
        description: descriptionObj,
        videoUrl: videoUrl.trim(),
      });

      setVideos((prev) => [...prev, response.data.video]);
      toast.success(t("videos.videoAdded") || "تمت إضافة الفيديو بنجاح");
      setTitleEn("");
      setTitleAr("");
      setDescriptionEn("");
      setDescriptionAr("");
      setVideoUrl("");
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || t("videos.failedToAdd") || "فشل في إضافة الفيديو";
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (videoId: number) => {
    if (isDeleting === videoId) return;
    if (!confirm("هل أنت متأكد من حذف هذا الفيديو؟")) return;

    setIsDeleting(videoId);
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/api/videos/${videoId}`);
      setVideos((prev) => prev.filter((video) => video.id !== videoId));
      toast.success(t("videos.videoDeleted") || "تم حذف الفيديو بنجاح");
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || t("videos.failedToDelete") || "فشل في حذف الفيديو";
      toast.error(errorMsg);
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <>
      <Toaster position="top-right" reverseOrder={false} />
      <div className="p-4 md:p-6 min-h-screen text-slate-200 font-sans" dir="rtl">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="pb-4 border-b border-white/[0.08]">
            <h1 className="text-xl font-black tracking-tight text-emerald-400">
              إدارة مقاطع الفيديو والدروس
            </h1>
            <p className="text-slate-400 text-xs mt-1">
              إضافة مقاطع فيديو يوتيوب وإدارتها في الموقع باللغتين العربية والإنجليزية
            </p>
          </div>

          {errorVideo && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-md text-rose-400 text-xs font-semibold">
              {errorVideo}
            </div>
          )}

          {/* Form Card */}
          <div className="border border-white/[0.08] rounded-lg p-5 bg-[#0B0E17]">
            <h2 className="text-base font-bold text-emerald-400 mb-4 pb-2 border-b border-white/[0.06]">
              إضافة مقطع فيديو جديد
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Titles Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="titleAr" className="block text-xs font-semibold text-slate-300">
                    عنوان الفيديو (باللغة العربية)
                  </label>
                  <input
                    type="text"
                    id="titleAr"
                    value={titleAr}
                    onChange={(e) => setTitleAr(e.target.value)}
                    className="w-full p-2.5 bg-[#07090F] border border-white/10 text-white rounded-md text-xs outline-none focus:border-emerald-500 placeholder:text-slate-600"
                    placeholder="أدخل عنوان الفيديو بالعربية..."
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="titleEn" className="block text-xs font-semibold text-slate-300">
                    Video Title (English)
                  </label>
                  <input
                    type="text"
                    id="titleEn"
                    value={titleEn}
                    onChange={(e) => setTitleEn(e.target.value)}
                    className="w-full p-2.5 bg-[#07090F] border border-white/10 text-white rounded-md text-xs outline-none focus:border-emerald-500 placeholder:text-slate-600 text-left"
                    dir="ltr"
                    placeholder="Enter video title in English..."
                    required
                  />
                </div>
              </div>

              {/* Descriptions Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="descriptionAr" className="block text-xs font-semibold text-slate-300">
                    وصف الفيديو (باللغة العربية)
                  </label>
                  <textarea
                    id="descriptionAr"
                    value={descriptionAr}
                    onChange={(e) => setDescriptionAr(e.target.value)}
                    className="w-full p-2.5 bg-[#07090F] border border-white/10 text-white rounded-md text-xs outline-none focus:border-emerald-500 placeholder:text-slate-600"
                    placeholder="أدخل وصف الفيديو بالعربية..."
                    rows={2}
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="descriptionEn" className="block text-xs font-semibold text-slate-300">
                    Description (English)
                  </label>
                  <textarea
                    id="descriptionEn"
                    value={descriptionEn}
                    onChange={(e) => setDescriptionEn(e.target.value)}
                    className="w-full p-2.5 bg-[#07090F] border border-white/10 text-white rounded-md text-xs outline-none focus:border-emerald-500 placeholder:text-slate-600 text-left"
                    dir="ltr"
                    placeholder="Enter description in English..."
                    rows={2}
                  />
                </div>
              </div>

              {/* URL Field */}
              <div className="space-y-1.5">
                <label htmlFor="videoUrl" className="block text-xs font-semibold text-slate-300">
                  رابط فيديو يوتيوب (YouTube URL)
                </label>
                <input
                  type="url"
                  id="videoUrl"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  className="w-full p-2.5 bg-[#07090F] border border-white/10 text-white rounded-md text-xs outline-none focus:border-emerald-500 placeholder:text-slate-600 text-left"
                  dir="ltr"
                  placeholder="https://www.youtube.com/watch?v=..."
                  required
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="py-2.5 px-6 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-md transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? "جاري الإضافة..." : "إضافة الفيديو"}
                </button>
              </div>
            </form>
          </div>

          {/* Videos Table */}
          <div className="border border-white/[0.08] rounded-lg p-5 bg-[#0B0E17]">
            <h2 className="text-base font-bold text-emerald-400 mb-4 pb-2 border-b border-white/[0.06]">
              مقاطع الفيديو المسجلة ({videos.length})
            </h2>

            {loading ? (
              <div className="py-10 text-center text-slate-400 text-xs font-semibold">
                جاري تحميل الفيديوهات...
              </div>
            ) : videos.length === 0 ? (
              <div className="py-10 text-center text-slate-500 text-xs font-semibold">
                لا توجد مقاطع فيديو مسجلة حالياً
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr className="border-b border-white/[0.08] text-slate-400 text-[11px] font-bold">
                      <th className="pb-3 pr-2 w-14">المعرف</th>
                      <th className="pb-3 w-56">الفيديو</th>
                      <th className="pb-3 w-48">العنوان</th>
                      <th className="pb-3">الوصف</th>
                      <th className="pb-3 text-center w-24">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.05]">
                    {videos.map((video) => {
                      const ytId = extractYoutubeId(video.videoUrl);
                      const title =
                        typeof video.title === "string"
                          ? { en: video.title, ar: video.title }
                          : video.title || { en: "", ar: "" };
                      const desc =
                        typeof video.description === "string"
                          ? { en: video.description, ar: video.description }
                          : video.description || { en: "", ar: "" };
                      const isDel = isDeleting === video.id;

                      return (
                        <tr key={video.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-3 pr-2 font-mono text-slate-500">#{video.id}</td>
                          <td className="py-3">
                            <div className="w-48 aspect-video rounded-md overflow-hidden border border-white/10 bg-black/50">
                              {ytId ? (
                                <iframe
                                  width="100%"
                                  height="100%"
                                  src={`https://www.youtube.com/embed/${ytId}`}
                                  frameBorder="0"
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                  allowFullScreen
                                />
                              ) : (
                                <div className="h-full flex items-center justify-center text-[10px] text-slate-500">
                                  رابط غير صالح
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="py-3 font-semibold text-white space-y-1">
                            <div>{title.ar || title.en}</div>
                            {title.en && title.ar && (
                              <div className="text-[10px] text-slate-400 font-normal" dir="ltr">
                                {title.en}
                              </div>
                            )}
                          </td>
                          <td className="py-3 text-slate-300 leading-relaxed space-y-1">
                            <p className="line-clamp-2">{desc.ar || desc.en || "-"}</p>
                            {desc.en && desc.ar && (
                              <p className="text-[10px] text-slate-500 line-clamp-1" dir="ltr">
                                {desc.en}
                              </p>
                            )}
                          </td>
                          <td className="py-3">
                            <div className="flex items-center justify-center">
                              <button
                                onClick={() => handleDelete(video.id)}
                                disabled={isDel}
                                className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white rounded text-xs font-bold transition-colors disabled:opacity-50"
                              >
                                {isDel ? "جاري..." : "حذف"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminVideosPage;