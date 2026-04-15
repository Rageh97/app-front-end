"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "@/utils/api";
import { useTranslation } from "react-i18next";
import {
  Check,
  Image as ImageIcon,
  Smile,
  Send,
  Trash2,
  Search,
  User,
  MoreVertical,
  Paperclip,
  ExternalLink,
  MessageSquare,
  X,
} from "lucide-react";
import ConfirmationModal from "@/components/ComfirmationModal";
import { motion, AnimatePresence } from "framer-motion";

type ChatUser = {
  user_id: number;
  email: string;
  first_name: string;
  last_name: string;
  unread_user_messages: number;
};

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

export default function AdminChatPage() {
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState<boolean>(false);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { t, i18n } = useTranslation();
  const [stickToBottom, setStickToBottom] = useState(true);

  const isRtl = i18n.language === "ar";

  const selectedUser = useMemo(() => {
    if (!selectedUserId) return null;
    return users.find((u) => u.user_id === selectedUserId) || null;
  }, [users, selectedUserId]);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await axios.get("api/chat/admin/chat-users");
      setUsers(res.data || []);
    } catch (e) {
      // noop
    }
  }, []);

  const fetchMessages = useCallback(async () => {
    if (!selectedUserId) return;
    try {
      const res = await axios.post("api/chat/admin/messages", { userId: selectedUserId });
      setMessages(res.data || []);
      fetchUsers();
    } catch (e) {
      // noop
    }
  }, [selectedUserId, fetchUsers]);

  useEffect(() => {
    fetchUsers();
    const i = setInterval(fetchUsers, 8000);
    return () => clearInterval(i);
  }, [fetchUsers]);

  useEffect(() => {
    if (!selectedUserId) return;
    fetchMessages();
    const i = setInterval(fetchMessages, 5000);
    return () => clearInterval(i);
  }, [selectedUserId, fetchMessages]);

  useEffect(() => {
    const el = messagesContainerRef.current;
    if (el && stickToBottom) {
      el.scrollTo({
        top: el.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, stickToBottom]);

  useEffect(() => {
    setStickToBottom(true);
  }, [selectedUserId]);

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
    setInput((prev) => prev + emoji);
    setShowEmojiPicker(false);
  };

  const openImageModal = (imageUrl: string) => {
    setSelectedImageUrl(imageUrl);
  };

  const closeImageModal = () => {
    setSelectedImageUrl(null);
  };

  const onSend = useCallback(async () => {
    if (!selectedUserId) return;
    const trimmed = input.trim();
    if (!trimmed && !selectedImage) return;
    setIsSending(true);
    try {
      const formData = new FormData();
      formData.append("userId", selectedUserId.toString());
      if (trimmed) {
        formData.append("content", trimmed);
      }
      if (selectedImage) {
        formData.append("image", selectedImage);
      }

      await axios.post("api/chat/admin/send", formData, {
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
    } finally {
      setIsSending(false);
    }
  }, [selectedUserId, input, selectedImage, fetchMessages]);

  const headerTitle = useMemo(() => t("chat.UserSupportInbox"), [t]);

  const filteredUsers = useMemo(() => {
    return users
      .filter((u) => {
        const full = `${u.first_name} ${u.last_name} ${u.email}`.toLowerCase();
        return full.includes(searchQuery.toLowerCase());
      })
      .sort((a, b) => {
        const aHasUnread = a.unread_user_messages > 0 ? 1 : 0;
        const bHasUnread = b.unread_user_messages > 0 ? 1 : 0;
        if (bHasUnread !== aHasUnread) return bHasUnread - aHasUnread;
        return b.unread_user_messages - a.unread_user_messages;
      });
  }, [users, searchQuery]);

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const confirmDeleteChat = useCallback(async () => {
    if (!selectedUserId) return;
    setIsDeleting(true);
    try {
      await axios.delete(`api/chat/admin/delete-chat/${selectedUserId}`);
      setMessages([]);
      setSelectedUserId(null);
      setShowDeleteModal(false);
      fetchUsers();
    } catch (error) {
      console.error("Error deleting chat:", error);
    } finally {
      setIsDeleting(false);
    }
  }, [selectedUserId, fetchUsers]);

  return (
    <div className="flex h-[calc(100vh-100px)] gap-6 p-6 font-cairo">
      {/* Sidebar: User List */}
      <div className="flex w-full flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-[#150a24]/50 shadow-2xl backdrop-blur-xl lg:w-[350px]">
        <div className="border-b border-white/5 p-6">
          <h2 className="mb-4 text-xl font-bold text-white">{headerTitle}</h2>
          <div className="relative">
            <Search className={`absolute ${isRtl ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-white/40`} size={18} />
            <input
              type="text"
              placeholder={isRtl ? "بحث عن عميل..." : "Search users..."}
              className={`w-full rounded-xl bg-white/5 py-2.5 ${isRtl ? 'pr-10 pl-4 text-right' : 'pl-10 pr-4 text-left'} text-sm text-white outline-none ring-1 ring-white/10 transition-all focus:ring-primary/50`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 scrollbar-hide">
          <AnimatePresence>
            {filteredUsers.map((u) => (
              <motion.button
                key={u.user_id}
                initial={{ opacity: 0, x: isRtl ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedUserId(u.user_id)}
                className={`relative mb-3 flex w-full items-center gap-4 rounded-2xl p-4 transition-all ${
                  selectedUserId === u.user_id
                    ? "bg-gradient-to-r from-[#190237] to-[#4f008c] shadow-lg"
                    : "bg-white/5 hover:bg-white/10"
                }`}
              >
                <div className="relative shrink-0">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white">
                    <User size={24} />
                  </div>
                  <span className={`absolute bottom-0 ${isRtl ? 'left-0' : 'right-0'} h-3 w-3 rounded-full border-2 border-[#150a24] bg-[#00c48c]`} />
                </div>
                <div className={`flex-1 ${isRtl ? 'text-right' : 'text-left'}`}>
                  <h3 className="text-sm font-bold text-white">
                    {u.first_name} {u.last_name}
                  </h3>
                  <p className="max-w-[150px] truncate text-[11px] text-white/40">{u.email}</p>
                </div>
                {u.unread_user_messages > 0 && (
                  <span className="flex h-6 min-w-[24px] items-center justify-center rounded-full bg-[#ef4444] px-1.5 text-[10px] font-bold text-white shadow-lg">
                    {u.unread_user_messages}
                  </span>
                )}
              </motion.button>
            ))}
          </AnimatePresence>
          {filteredUsers.length === 0 && (
            <div className="py-20 text-center opacity-20">
              <User size={48} className="mx-auto mb-2" />
              <p className="text-sm">{isRtl ? "لا توجد محادثات" : "No chats found"}</p>
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="relative flex flex-1 flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-[#150a24]/50 shadow-2xl backdrop-blur-xl">
        {selectedUser ? (
          <>
            {/* Chat Header */}
            <div className="flex items-center justify-between border-b border-white/5 px-8 py-5">
              <div className={`flex items-center gap-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <User size={22} />
                </div>
                <div className={isRtl ? 'text-right' : 'text-left'}>
                  <h3 className="font-bold text-white">
                    {selectedUser.first_name} {selectedUser.last_name}
                  </h3>
                  <div className={`flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                    <span className="h-2 w-2 rounded-full bg-[#00c48c]" />
                    <span className="text-[10px] text-white/40 uppercase tracking-widest">{isRtl ? "متصل الآن" : "Active now"}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-white/40 transition-all hover:bg-red-500/10 hover:text-red-500"
                >
                  <Trash2 size={20} />
                </button>
                <button className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-white/40 hover:bg-white/10">
                  <MoreVertical size={20} />
                </button>
              </div>
            </div>

            {/* Messages container */}
            <div
              ref={messagesContainerRef}
              onScroll={onMessagesScroll}
              className="flex-1 space-y-4 overflow-y-auto p-8 scroll-smooth scrollbar-hide bg-[#0d011d]/30"
            >
              <div className="flex-1 min-h-0" />
              {messages.map((m) => {
                const isAdmin = m.sender_role === "admin";
                return (
                  <motion.div
                    key={m.message_id}
                    initial={{ opacity: 0, y: 10, x: isAdmin ? 20 : -20 }}
                    animate={{ opacity: 1, y: 0, x: 0 }}
                    className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}
                  >
                    <div className={`group relative flex max-w-[70%] flex-col ${isAdmin ? "items-end" : "items-start"}`}>
                      <div
                        className={`overflow-hidden px-5 py-3 shadow-md ${
                          isAdmin
                            ? `bg-gradient-to-br from-[#190237] to-[#4f008c] text-white rounded-2xl ${isRtl ? 'rounded-tl-none' : 'rounded-tr-none'}`
                            : `bg-white/5 text-white border border-white/5 rounded-2xl ${isRtl ? 'rounded-tr-none' : 'rounded-tl-none'}`
                        }`}
                      >
                        {m.image_url && (
                          <div className="mb-3 relative group/img overflow-hidden rounded-xl">
                            <img
                              src={`${process.env.NEXT_PUBLIC_API_URL}${m.image_url}`}
                              alt="Chat attachment"
                              className="max-h-[300px] w-full object-cover transition-transform duration-500 group-hover/img:scale-105 cursor-pointer"
                              onClick={() => openImageModal(`${process.env.NEXT_PUBLIC_API_URL}${m.image_url}`)}
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                               <ExternalLink size={24} className="text-white" />
                            </div>
                          </div>
                        )}
                        {m.content && (
                          <div className={`whitespace-pre-wrap break-words text-sm leading-relaxed ${isRtl ? 'text-right' : 'text-left'}`}>
                            {m.content}
                          </div>
                        )}
                      </div>
                      <div className="mt-1.5 flex items-center gap-2 px-1 text-right">
                        <span className="text-[10px] text-white/20">
                          {new Date(m.createdAt).toLocaleTimeString(isRtl ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {isAdmin && (
                          <div className="flex items-center">
                            <Check size={12} className={m.is_read_by_user ? "text-[#00c48c]" : "text-white/10"} />
                            {m.is_read_by_user && <Check size={12} className="-ml-1 text-[#00c48c]" />}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Input Area */}
            <div className="border-t border-white/5 bg-white/[0.02] p-6">
              <AnimatePresence>
                {imagePreview && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 10 }}
                    className="mb-4 relative inline-block group"
                  >
                    <div className="h-24 w-24 overflow-hidden rounded-2xl border-2 border-primary/30 shadow-2xl">
                      <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
                      <button
                        onClick={removeImage}
                        className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-white shadow-lg transition-transform hover:scale-110"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className={`flex items-center gap-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
                <div className="relative flex-1">
                  <div className={`flex items-center gap-2 rounded-2xl bg-white/5 p-2 px-4 shadow-inner ring-1 ring-white/10 transition-all focus-within:ring-primary/40 ${isRtl ? 'flex-row-reverse' : ''}`}>
                    <button
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="text-white/40 transition-colors hover:Yellow-400"
                    >
                      <Smile size={22} />
                    </button>
                    <input
                      type="text"
                      placeholder={t("chat.TypeReplay")}
                      className={`flex-1 bg-transparent py-2 text-sm text-white outline-none placeholder:text-white/20 ${isRtl ? 'text-right' : 'text-left'}`}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && onSend()}
                      disabled={isSending}
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="text-white/40 transition-colors hover:text-blue-400"
                    >
                      <Paperclip size={22} />
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                  </div>

                  {/* Emoji Picker Popover */}
                  <AnimatePresence>
                    {showEmojiPicker && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className={`absolute bottom-16 ${isRtl ? 'right-0' : 'left-0'} z-50 overflow-hidden rounded-2xl border border-white/10 bg-[#150a24] p-2 shadow-2xl`}
                      >
                        <div className="grid grid-cols-8 gap-1 max-h-[160px] overflow-y-auto scrollbar-hide">
                          {['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😋', '😛', '😜', '😎', '🤩', '🥳', '😏', '😒', '😔', '😟', '😕', '🙁', '☹️', '😮', '😯', '😲', '😳', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😴', '🤤', '🤒', '😷', '💩', '👻', '💀', '👽', '🤖', '🎃', '😺', '🤲', '👍', '👎', '👊', '👌', '🙌', '🙏', '🤝', '🔥', '⚡', '✨', '🎈', '🎉', '❤️', '💔', '❣️', '💯'].map((emoji, index) => (
                            <button
                              key={index}
                              onClick={() => addEmoji(emoji)}
                              className="flex h-9 w-9 items-center justify-center rounded-lg text-lg hover:bg-white/10"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onSend}
                  disabled={isSending || (!input.trim() && !selectedImage)}
                  className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#190237] to-[#4f008c] text-white shadow-xl shadow-primary/20 transition-all disabled:opacity-50"
                >
                  <Send size={20} className={isRtl ? "rotate-180" : ""} />
                </motion.button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center text-center opacity-20">
            <div className="mb-6 flex h-32 w-32 items-center justify-center rounded-full bg-white/5">
              <MessageSquare size={64} />
            </div>
            <h3 className="text-2xl font-bold">{t("chat.Selectuser")}</h3>
            <p className="mt-2 text-sm">{isRtl ? "قم باختيار محادثة من القائمة الجانبية للبدء" : "Select a conversation from the sidebar to start"}</p>
          </div>
        )}
      </div>

      {/* Modals & Utils */}
      <ConfirmationModal
        title={isRtl ? "تأكيد الحذف" : "Confirm Delete"}
        message={isRtl ? "هل أنت متأكد من حذف هذه المحادثة؟ لا يمكن التراجع عن هذا الإجراء." : "Are you sure you want to delete this chat? This action cannot be undone."}
        buttonMessage={isDeleting ? (isRtl ? "جاري الحذف..." : "Deleting...") : (isRtl ? "حذف" : "Delete")}
        modalOpen={showDeleteModal}
        setModalOpen={setShowDeleteModal}
        action={confirmDeleteChat}
        isLoading={isDeleting}
      />

      <AnimatePresence>
        {selectedImageUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[5000] flex items-center justify-center bg-black/95 p-8 backdrop-blur-sm"
            onClick={closeImageModal}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-h-full max-w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <img src={selectedImageUrl} alt="Full size" className="max-h-[85vh] max-w-[90vw] rounded-2xl object-contain shadow-2xl shadow-black" />
              <button
                onClick={closeImageModal}
                className="absolute -right-4 -top-12 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition-transform hover:scale-110"
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
