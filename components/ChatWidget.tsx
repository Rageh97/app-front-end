"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import api from "@/utils/api";
import {
  MessageSquare,
  X,
  Check,
  Image as ImageIcon,
  Smile,
  Send,
  Paperclip,
  Headphones,
  ExternalLink,
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

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [showWelcome, setShowWelcome] = useState<boolean>(false);
  const [stickToBottom, setStickToBottom] = useState<boolean>(true);
  const [showEmojiPicker, setShowEmojiPicker] = useState<boolean>(false);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { t, i18n } = useTranslation();

  const isRtl = i18n.language === "ar";

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
    const id = setInterval(fetchMessages, 5000);
    return () => clearInterval(id);
  }, [open, fetchMessages]);

  useEffect(() => {
    if (open) return;
    fetchUnreadCount();
    const id = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(id);
  }, [open, fetchUnreadCount]);

  useEffect(() => {
    if (!open) return;
    try {
      const stored = typeof window !== 'undefined' ? window.localStorage.getItem('chatWelcomeShown') : '1';
      if (!stored) {
        setShowWelcome(true);
      } else {
        setShowWelcome(false);
      }
    } catch (_) {
      setShowWelcome(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const el = messagesContainerRef.current;
    if (el && stickToBottom) {
      el.scrollTo({
        top: el.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, open, stickToBottom]);

  useEffect(() => {
    if (open) setStickToBottom(true);
  }, [open]);

  const onMessagesScroll = useCallback(() => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const threshold = 60;
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

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const addEmoji = (emoji: string) => {
    setInput(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const openImageModal = (imageUrl: string) => {
    setSelectedImageUrl(imageUrl);
  };

  const closeImageModal = () => {
    setSelectedImageUrl(null);
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
      try {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem('chatWelcomeShown', '1');
        }
      } catch (_) {}
      setShowWelcome(false);
      setInput("");
      setSelectedImage(null);
      setImagePreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      await fetchMessages();
    } finally {
      setIsSending(false);
    }
  }, [input, selectedImage, fetchMessages]);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        onSend();
      }
    },
    [onSend]
  );

  const headerTitle = useMemo(() => t("chat.supportChat"), [t]);

  return (
    <div className={`fixed bottom-6 right-2 z-[1000] font-cairo`}>
      {/* Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setOpen((v) => !v)}
        className="group relative flex items-center justify-center transition-all focus:outline-none"
        aria-label={open ? "Close chat" : "Open chat"}
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-[#190237] text-white shadow-xl"
            >
              <X size={24} />
            </motion.div>
          ) : (
            <motion.div
              key="open"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.5, opacity: 0 }}
            >
              <img src="/images/support.gif" alt="chat" className="w-15 h-15 object-contain" />
            </motion.div>
          )}
        </AnimatePresence>

        {unreadCount > 0 && !open && (
          <span className="absolute right-2 top-2 flex h-6 w-6 animate-bounce items-center justify-center rounded-full bg-[#ef4444] text-[10px] font-bold text-white shadow-lg ring-2 ring-white">
            {unreadCount > 10 ? '10+' : unreadCount}
          </span>
        )}
      </motion.button>

      {/* Chat Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9, transformOrigin: "bottom right" }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className={`absolute bottom-20 right-0 flex h-[500px] w-[320px] sm:w-[380px] flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-white shadow-[0_20px_50px_rgba(0,0,0,0.2)] dark:bg-[#150a24]`}
          >
            {/* Header */}
            <div className="relative overflow-hidden bg-gradient-to-r from-[#190237] to-[#4f008c] px-6 py-5 text-white">
              <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/5 blur-2xl" />
              <div className="relative flex items-center gap-3">
                <div className="relative">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 backdrop-blur-md">
                    <Headphones size={20} className="text-[#00c48c]" />
                  </div>
                  <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[#190237] bg-[#00c48c]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold leading-none">{headerTitle}</h3>
                  <p className="mt-1 text-[10px] text-white/60">
                    {isRtl ? "نحن متصلون لمساعدتك" : "We are online to help you"}
                  </p>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className={`${isRtl ? 'mr-auto' : 'ml-auto'} rounded-full p-2 text-white/50 transition-colors hover:bg-white/10 hover:text-white`}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Messages Container */}
            <div
              ref={messagesContainerRef}
              onScroll={onMessagesScroll}
              className="flex-1 space-y-4 overflow-y-auto p-6 scroll-smooth scrollbar-hide dark:bg-[#0d011d]/50"
            >
              {showWelcome && messages.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border border-[#ff7702]/20 bg-[#ff7702]/5 p-4 text-center"
                >
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#ff7702]/10">
                    <Smile className="text-[#ff7702]" size={24} />
                  </div>
                  <h4 className="text-sm font-bold text-gray-800 dark:text-white">
                    {isRtl ? "مرحباً بك في NEXUS Support" : "Welcome to NEXUS Support"}
                  </h4>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {isRtl ? "كيف يمكننا مساعدتك اليوم؟ سنقوم بالرد عليك خلال دقائق." : "How can we help you today? We will respond within minutes."}
                  </p>
                </motion.div>
              )}

              {messages.map((m) => {
                const isUser = m.sender_role === "user";
                return (
                  <motion.div
                    key={m.message_id}
                    initial={{ opacity: 0, x: isUser ? 20 : -20, y: 10 }}
                    animate={{ opacity: 1, x: 0, y: 0 }}
                    className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                  >
                    <div className={`group relative flex max-w-[85%] flex-col ${isUser ? "items-end" : "items-start"}`}>
                      <div
                        className={`overflow-hidden px-4 py-2.5 shadow-sm ${
                          isUser
                            ? `bg-gradient-to-br from-[#190237] to-[#4f008c] text-white ${isRtl ? 'rounded-2xl rounded-tl-none' : 'rounded-2xl rounded-tr-none'}`
                            : `bg-gray-100 dark:bg-white/5 text-gray-800 dark:text-white ${isRtl ? 'rounded-2xl rounded-tr-none' : 'rounded-2xl rounded-tl-none'}`
                        }`}
                      >
                        {m.image_url && (
                          <div className="mb-2 relative group/img overflow-hidden rounded-lg">
                            <img
                              src={`${process.env.NEXT_PUBLIC_API_URL}${m.image_url}`}
                              alt="Chat attachment"
                              className="max-h-[200px] w-full object-cover transition-transform duration-500 group-hover/img:scale-105 cursor-pointer"
                              onClick={() => openImageModal(`${process.env.NEXT_PUBLIC_API_URL}${m.image_url}`)}
                            />
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                               <ExternalLink size={18} className="text-white" />
                            </div>
                          </div>
                        )}
                        {m.content && (
                          <div className="whitespace-pre-wrap break-words text-[13px] leading-relaxed">
                            {m.content}
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-1 flex items-center gap-1.5 px-1">
                        <span className="text-[9px] text-gray-400 dark:text-gray-500">
                          {new Date(m.createdAt).toLocaleTimeString(isRtl ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {isUser && (
                          <div className="flex items-center">
                            <Check size={10} className={m.is_read_by_admin ? "text-[#00c48c]" : "text-gray-300"} />
                            {m.is_read_by_admin && <Check size={10} className="-ml-1 text-[#00c48c]" />}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Input Area */}
            <div className="border-t border-gray-100 active:p-4 bg-gray-50/50 p-4 dark:border-white/5 dark:bg-white/5">
              {/* Image Preview Overlay */}
              <AnimatePresence>
                {imagePreview && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="mb-3 relative inline-block group"
                  >
                    <div className="relative h-16 w-16 overflow-hidden rounded-xl border-2 border-[#ff7702]/30 shadow-lg">
                      <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
                      <button
                        onClick={removeImage}
                        className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-md transition-colors hover:bg-red-500"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                   <div className={`flex items-center gap-1 rounded-2xl bg-white px-2 py-1 shadow-sm transition-all focus-within:shadow-md dark:bg-white/5 border border-gray-200 dark:border-white/10 focus-within:border-[#4f008c]/30`}>
                    <button
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="p-1.5 text-gray-400 transition-colors hover:text-[#ff7702]"
                      type="button"
                    >
                      <Smile size={18} />
                    </button>
                    <input
                      className="flex-1 bg-transparent px-2 py-1.5 text-[13px] outline-none placeholder:text-gray-400 dark:text-white"
                      placeholder={t("chat.Type")}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={onKeyDown}
                      disabled={isSending}
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="p-1.5 text-gray-400 transition-colors hover:text-blue-500"
                      type="button"
                    >
                      <Paperclip size={18} />
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                   </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onSend}
                  disabled={isSending || (!input.trim() && !selectedImage)}
                  className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#190237] to-[#4f008c] text-white shadow-lg transition-all disabled:opacity-50 disabled:grayscale`}
                >
                  <Send size={16} className={isRtl ? "rotate-180" : ""} />
                </motion.button>
              </div>

              {/* Emoji Picker Popover */}
              <AnimatePresence>
                {showEmojiPicker && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute bottom-[80px] left-4 right-4 z-10 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl dark:border-white/10 dark:bg-gray-800"
                  >
                    <div className="grid grid-cols-8 gap-1 p-2 max-h-[140px] overflow-y-auto scrollbar-hide">
                      {['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😋', '😛', '😜', '😎', '🤩', '🥳', '😏', '😒', '😔', '😟', '😕', '🙁', '☹️', '😮', '😯', '😲', '😳', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😴', '🤤', '🤒', '😷', '💩', '👻', '💀', '👽', '🤖', '🎃', '😺', '🤲', '👍', '👎', '👊', '👌', '🙌', '🙏', '🤝', '🔥', '⚡', '✨', '🎈', '🎉', '❤️', '💔', '❣️', '💯'].map((emoji, index) => (
                        <button
                          key={index}
                          onClick={() => addEmoji(emoji)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-lg transition-colors hover:bg-gray-100 dark:hover:bg-white/5"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image Modal */}
      <AnimatePresence>
        {selectedImageUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
            onClick={closeImageModal}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-h-full max-w-full overflow-hidden rounded-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={selectedImageUrl}
                alt="Full size"
                className="max-h-[90vh] max-w-[90vw] object-contain shadow-2xl"
              />
              <button
                onClick={closeImageModal}
                className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-md transition-transform hover:scale-110"
              >
                <X size={20} />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
