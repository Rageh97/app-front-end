"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import api from "@/utils/api";
import {
  X,
  Check,
  CheckCheck,
  Smile,
  Send,
  Paperclip,
  Headphones,
  ArrowDown,
  Loader2,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";

type Message = {
  message_id: number;
  user_id: number;
  sender_id: number;
  sender_role: "user" | "admin";
  content: string;
  image_url?: string;
  createdAt: string;
  is_read_by_user?: boolean;
  is_read_by_admin?: boolean;
};

const EMOJI_LIST = [
  "👋", "👍", "❤️", "🔥", "✨", "🚀", "😊", "🙏",
  "💯", "⚡", "💡", "🎯", "🎉", "👌", "🤝", "🤩",
  "🤔", "😅", "🙌", "😎", "💪", "💐", "🌟", "✅"
];

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [stickToBottom, setStickToBottom] = useState<boolean>(true);
  const [showEmojiPicker, setShowEmojiPicker] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const { i18n } = useTranslation();

  const isRtl = i18n.language === "ar";
  const whatsappUrl = "https://wa.me/9647702930873";

  const fetchMessages = useCallback(async () => {
    try {
      const res = await api.get("api/chat/user/messages");
      setMessages(res.data || []);
    } catch (e) {
      // ignore
    }
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await api.get("api/chat/user/unread-count");
      setUnreadCount(res.data?.unread_count || 0);
    } catch (e) {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    fetchMessages();
    setUnreadCount(0);
    const id = setInterval(fetchMessages, 4000);
    return () => clearInterval(id);
  }, [open, fetchMessages]);

  useEffect(() => {
    if (open) return;
    fetchUnreadCount();
    const id = setInterval(fetchUnreadCount, 25000);
    return () => clearInterval(id);
  }, [open, fetchUnreadCount]);

  useEffect(() => {
    const handleOpenChat = () => setOpen(true);
    window.addEventListener("open-support-chat", handleOpenChat);
    return () => window.removeEventListener("open-support-chat", handleOpenChat);
  }, []);

  const scrollToBottom = useCallback((smooth = true) => {
    const el = messagesContainerRef.current;
    if (el) {
      el.scrollTo({
        top: el.scrollHeight,
        behavior: smooth ? "smooth" : "auto",
      });
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    if (stickToBottom) {
      scrollToBottom(true);
    }
  }, [messages, open, stickToBottom, scrollToBottom]);

  useEffect(() => {
    if (open) {
      setStickToBottom(true);
      setTimeout(() => scrollToBottom(false), 100);
    }
  }, [open, scrollToBottom]);

  const onMessagesScroll = useCallback(() => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const threshold = 70;
    const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - threshold;
    setStickToBottom(atBottom);
  }, []);

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          setSelectedImage(file);
          const reader = new FileReader();
          reader.onload = (event) => {
            setImagePreview(event.target?.result as string);
          };
          reader.readAsDataURL(file);
          break;
        }
      }
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const addEmoji = (emoji: string) => {
    setInput((prev) => prev + emoji);
    setShowEmojiPicker(false);
    textareaRef.current?.focus();
  };

  const onSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed && !selectedImage) return;

    setIsSending(true);
    try {
      const formData = new FormData();
      if (trimmed) {
        formData.append("content", trimmed);
      }
      if (selectedImage) {
        formData.append("image", selectedImage);
      }

      await api.post("api/chat/user/messages", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setInput("");
      setSelectedImage(null);
      setImagePreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      await fetchMessages();
      setStickToBottom(true);
      scrollToBottom(true);
    } finally {
      setIsSending(false);
    }
  }, [input, selectedImage, fetchMessages, scrollToBottom]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[1000] font-sans select-none" dir={isRtl ? "rtl" : "ltr"}>
      {/* Floating Trigger Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen((v) => !v)}
        className="group relative flex h-14 w-14 items-center justify-center rounded-2xl bg-[#141b2d] border border-white/20 text-white shadow-[0_12px_35px_rgba(0,0,0,0.5)] transition-all duration-300 hover:border-emerald-400 hover:shadow-[0_12px_40px_rgba(0,196,140,0.3)] focus:outline-none"
        aria-label={open ? "إغلاق المحادثة" : "فتح محادثة الدعم"}
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              className="text-slate-300 group-hover:text-white"
            >
              <X size={22} />
            </motion.div>
          ) : (
            <motion.div
              key="open"
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.7, opacity: 0 }}
              className="relative flex items-center justify-center"
            >
              <Headphones size={24} className="text-emerald-400 transition-transform duration-300 group-hover:scale-110" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400 border-2 border-[#141b2d]"></span>
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Unread Messages Badge */}
        {unreadCount > 0 && !open && (
          <span className="absolute -top-2 -right-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-black text-white shadow-lg ring-2 ring-[#141b2d] animate-bounce">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </motion.button>

      {/* Chat Window Panel (High Contrast Elevated Clean Surface) */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 25, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 25, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={`absolute bottom-18 right-0 flex flex-col overflow-hidden rounded-[22px] border border-white/20 bg-[#141a2c] text-slate-100 shadow-[0_25px_70px_rgba(0,0,0,0.85)] transition-all duration-300 ${
              isExpanded
                ? "h-[620px] w-[95vw] sm:w-[520px] max-h-[88vh]"
                : "h-[540px] w-[92vw] sm:w-[390px] max-h-[82vh]"
            }`}
          >
            {/* Header */}
            <div className="relative z-10 flex items-center justify-between border-b border-white/10 bg-[#1c243c] px-4 py-3.5 shadow-sm">
              <div className="flex items-center gap-3">
                {/* Support Icon */}
                <div className="relative grid h-9 w-9 place-items-center rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                  <Headphones size={18} />
                  <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 border-2 border-[#1c243c]"></span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-white">الدعم الفني المباشر</h3>
                  <p className="text-[10px] text-emerald-400 font-medium">متصل الآن لمساعدتك</p>
                </div>
              </div>

              {/* Header Actions */}
              <div className="flex items-center gap-1.5">
                {/* Direct WhatsApp Link */}
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="تواصل عبر واتساب"
                  className="grid h-8 w-8 place-items-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 transition hover:bg-emerald-500/20 active:scale-95"
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="18"
                    height="18"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2.057 22l4.98-1.308A9.957 9.957 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm4.992 13.923c-.207.583-1.025 1.092-1.636 1.22-.418.087-.965.157-2.798-.605-2.347-.974-3.86-3.344-3.978-3.5-.115-.157-.946-1.26-.946-2.403 0-1.144.598-1.708.81-1.942.213-.234.464-.292.619-.292.155 0 .31.002.445.008.143.007.334-.055.522.398.193.465.658 1.605.716 1.722.058.117.097.253.02.408-.077.155-.116.252-.232.388-.116.136-.245.304-.35.408-.117.117-.238.243-.102.476.136.233.603.996 1.295 1.613.89.794 1.64 1.04 1.873 1.156.233.117.369.097.505-.058.136-.156.582-.68.737-.913.155-.233.31-.194.524-.116.213.077 1.357.64 1.59.757.233.116.388.174.446.271.058.098.058.563-.149 1.146z"
                      fill="#25D366"
                    />
                  </svg>
                </a>

                {/* Expand / Minimize */}
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  title={isExpanded ? "تصغير" : "تكبير"}
                  className="hidden sm:grid h-8 w-8 place-items-center rounded-lg border border-white/10 text-slate-300 transition hover:bg-white/10 hover:text-white"
                >
                  {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                </button>

                {/* Close Button */}
                <button
                  onClick={() => setOpen(false)}
                  title="إغلاق"
                  className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 text-slate-300 transition hover:bg-white/10 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Messages Container (Clean High-Contrast Background) */}
            <div
              ref={messagesContainerRef}
              onScroll={onMessagesScroll}
              className="relative flex-1 space-y-3 overflow-y-auto p-4 bg-[#0e1322] scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10"
            >
              {/* Empty / Clean Welcome State */}
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center text-center h-full py-8">
                  <div className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 shadow-sm">
                    <Headphones size={24} />
                  </div>
                  <h4 className="text-sm font-bold text-white">
                    أهلاً بك في الدعم المباشر
                  </h4>
                  <p className="mt-1 text-xs text-slate-400 max-w-[260px] leading-relaxed">
                    كيف يمكننا مساعدتك اليوم؟ اترك رسالتك وسنرد عليك فوراً.
                  </p>
                </div>
              )}

              {/* Messages Feed */}
              {messages.map((m, idx) => {
                const isUser = m.sender_role === "user";
                const isRead = m.is_read_by_admin || m.is_read_by_user;

                return (
                  <div
                    key={m.message_id || idx}
                    className={`flex items-end gap-2 ${isUser ? "justify-start flex-row-reverse" : "justify-start"}`}
                  >
                    <div className={`flex max-w-[84%] flex-col ${isUser ? "items-end" : "items-start"}`}>
                      {/* Bubble */}
                      <div
                        className={`overflow-hidden rounded-2xl px-3.5 py-2.5 text-xs sm:text-[13px] leading-relaxed select-text ${
                          isUser
                            ? "bg-[#00c48c] text-slate-950 font-semibold rounded-br-xs shadow-sm"
                            : "bg-[#1c243c] border border-white/10 text-slate-100 rounded-bl-xs shadow-sm"
                        }`}
                      >
                        {/* Attached Image */}
                        {m.image_url && (
                          <div className="mb-2 overflow-hidden rounded-xl border border-black/20 bg-black/40">
                            <img
                              src={`${process.env.NEXT_PUBLIC_API_URL}${m.image_url}`}
                              alt="مرفق"
                              className="max-h-[220px] w-full object-cover cursor-pointer hover:scale-105 transition-transform"
                              onClick={() => setSelectedImageUrl(`${process.env.NEXT_PUBLIC_API_URL}${m.image_url}`)}
                            />
                          </div>
                        )}

                        {/* Text */}
                        {m.content && (
                          <div className="whitespace-pre-wrap break-words">
                            {m.content}
                          </div>
                        )}
                      </div>

                      {/* Timestamp & Status */}
                      <div className="mt-1 flex items-center gap-1 px-1 text-[10px] text-slate-400 font-medium">
                        <span>
                          {new Date(m.createdAt).toLocaleTimeString(isRtl ? "ar-EG" : "en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        {isUser && (
                          <span className="flex items-center">
                            {isRead ? (
                              <CheckCheck size={13} className="text-emerald-400" />
                            ) : (
                              <Check size={13} className="text-slate-400" />
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Scroll Down Pill */}
            {!stickToBottom && (
              <button
                onClick={() => {
                  setStickToBottom(true);
                  scrollToBottom(true);
                }}
                className="absolute bottom-20 left-1/2 -translate-x-1/2 flex items-center gap-1 rounded-full border border-white/20 bg-[#1c243c] px-3 py-1 text-[11px] font-bold text-white shadow-lg transition hover:bg-[#252f4c]"
              >
                <ArrowDown size={12} className="text-emerald-400" />
                <span>الرسائل الأخيرة</span>
              </button>
            )}

            {/* Input Bar */}
            <div className="border-t border-white/10 bg-[#161d31] p-3">
              {/* Image Preview */}
              <AnimatePresence>
                {imagePreview && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="mb-2 inline-flex items-center gap-2 rounded-xl border border-emerald-400/40 bg-[#0e1322] p-1.5 pr-2.5"
                  >
                    <div className="h-9 w-9 overflow-hidden rounded-lg border border-emerald-400/40">
                      <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
                    </div>
                    <span className="text-[11px] font-bold text-emerald-300">صورة مرفقة</span>
                    <button
                      onClick={removeImage}
                      className="grid h-5 w-5 place-items-center rounded-full bg-white/10 text-white hover:bg-red-500 transition"
                    >
                      <X size={11} />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Emoji Picker Popover */}
              <AnimatePresence>
                {showEmojiPicker && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="absolute bottom-full mb-2 left-3 right-3 z-20 overflow-hidden rounded-2xl border border-white/20 bg-[#1c243c] p-2.5 shadow-2xl"
                  >
                    <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-white/10 text-[11px] font-bold text-slate-300">
                      <span>إيموجي</span>
                      <button onClick={() => setShowEmojiPicker(false)} className="text-slate-400 hover:text-white">
                        <X size={13} />
                      </button>
                    </div>
                    <div className="grid grid-cols-8 gap-1">
                      {EMOJI_LIST.map((emoji, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => addEmoji(emoji)}
                          className="grid h-8 w-8 place-items-center rounded-lg text-base transition hover:bg-white/10"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Input Row */}
              <div className="flex items-center gap-2">
                <div className="flex-1 relative flex items-center gap-1 rounded-xl border border-white/15 bg-[#0e1322] px-2 py-1 focus-within:border-emerald-400 transition">
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-slate-400 transition hover:text-amber-300"
                    title="إيموجي"
                  >
                    <Smile size={17} />
                  </button>

                  <textarea
                    ref={textareaRef}
                    rows={1}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={onKeyDown}
                    onPaste={handlePaste}
                    placeholder="اكتب رسالتك... (أو الصق صورة)"
                    className="flex-1 max-h-24 resize-none bg-transparent px-1 py-1 text-xs sm:text-[13px] text-white outline-none placeholder:text-slate-500 scrollbar-none"
                  />

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-slate-400 transition hover:text-sky-400"
                    title="إرفاق صورة"
                  >
                    <Paperclip size={16} />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                </div>

                {/* Send Button */}
                <button
                  type="button"
                  onClick={() => onSend()}
                  disabled={isSending || (!input.trim() && !selectedImage)}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#00c48c] text-slate-950 font-bold shadow-md transition hover:bg-emerald-400 disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
                  title="إرسال"
                >
                  {isSending ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Send size={15} className={isRtl ? "rotate-180" : ""} />
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image Modal Lightbox */}
      <AnimatePresence>
        {selectedImageUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
            onClick={() => setSelectedImageUrl(null)}
          >
            <div className="relative max-h-full max-w-full overflow-hidden rounded-2xl border border-white/20" onClick={(e) => e.stopPropagation()}>
              <img
                src={selectedImageUrl}
                alt="معاينة"
                className="max-h-[85vh] max-w-[90vw] object-contain shadow-2xl"
              />
              <button
                onClick={() => setSelectedImageUrl(null)}
                className="absolute top-3 right-3 grid h-8 w-8 place-items-center rounded-full bg-black/70 text-white transition hover:bg-red-500"
              >
                <X size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
