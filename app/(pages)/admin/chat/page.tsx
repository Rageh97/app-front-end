"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "@/utils/api";
import { useTranslation } from "react-i18next";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  Check,
  CheckCheck,
  Image as ImageIcon,
  Smile,
  Send,
  Trash2,
  Search,
  User,
  Paperclip,
  ExternalLink,
  MessageSquare,
  X,
  ChevronLeft,
  ChevronRight,
  Copy,
  ArrowDown,
  RefreshCw,
  Zap,
  CheckCircle2,
} from "lucide-react";
import ConfirmationModal from "@/components/ComfirmationModal";
import { motion, AnimatePresence } from "framer-motion";

type LastMessage = {
  content: string;
  image_url?: string | null;
  sender_role: "user" | "admin";
  createdAt: string;
};

type ChatUser = {
  user_id: number;
  email: string;
  first_name: string;
  last_name: string;
  avatar?: string | null;
  unread_user_messages: number;
  last_message_at?: string;
  last_message?: LastMessage | null;
};

type Message = {
  message_id: number;
  user_id: number;
  sender_id: number;
  sender_role: "user" | "admin";
  content: string;
  image_url?: string | null;
  createdAt: string;
  is_read_by_user?: boolean;
  is_read_by_admin?: boolean;
};

type PaginationMeta = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
};

const CANNED_RESPONSES = [
  { ar: "أهلاً بك! كيف يمكنني مساعدتك اليوم؟", en: "Hello! How can I help you today?" },
  { ar: "تم استلام استفسارك وجاري مراجعته والعمل عليه حالياً.", en: "Your inquiry has been received and is being reviewed." },
  { ar: "يرجى تزويدنا بصورة توضيحية أو رابط للمشكلة لمساعدتك بشكل أفضل.", en: "Please provide a screenshot or link so we can assist you better." },
  { ar: "تم حل المشكلة وتحديث حسابك بنجاح! يرجى التجربة الآن.", en: "The issue has been resolved successfully! Please test now." },
  { ar: "هل هناك أي شيء آخر يمكنني مساعدتك به؟", en: "Is there anything else I can help you with?" },
];

const EMOJI_LIST = [
  "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇",
  "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😋", "😛",
  "😎", "🤩", "🥳", "😏", "👍", "👎", "👌", "✌️", "🙌", "👏",
  "🤝", "🙏", "🔥", "⚡", "✨", "💯", "❤️", "🎯", "🚀", "🎉"
];

function formatTimeAgo(dateStr?: string, isRtl = true): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return isRtl ? "الآن" : "Just now";
    if (diffMins < 60) return isRtl ? `منذ ${diffMins} د` : `${diffMins}m ago`;
    if (diffHours < 24 && now.getDate() === d.getDate()) {
      return d.toLocaleTimeString(isRtl ? "ar-EG" : "en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    if (diffDays === 1 || (diffDays === 0 && now.getDate() !== d.getDate())) {
      return isRtl ? "أمس" : "Yesterday";
    }
    if (diffDays < 7) {
      return d.toLocaleDateString(isRtl ? "ar-EG" : "en-US", { weekday: "short" });
    }
    return d.toLocaleDateString(isRtl ? "ar-EG" : "en-US", {
      month: "numeric",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

function formatDateSeparator(dateStr: string, isRtl = true): string {
  try {
    const d = new Date(dateStr);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) {
      return isRtl ? "اليوم" : "Today";
    }
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) {
      return isRtl ? "أمس" : "Yesterday";
    }
    return d.toLocaleDateString(isRtl ? "ar-EG" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export default function AdminChatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === "ar";

  // Conversations & pagination state
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
    hasMore: false,
  });
  const [totalUnread, setTotalUnread] = useState<number>(0);
  const [isLoadingUsers, setIsLoadingUsers] = useState<boolean>(true);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeFilter, setActiveFilter] = useState<"all" | "unread">("all");

  // Selected User ID from query param
  const selectedUserId = useMemo(() => {
    const u = searchParams.get("u");
    return u ? parseInt(u, 10) : null;
  }, [searchParams]);

  const selectedImageUrl = searchParams.get("img");

  const setSelectedUserId = useCallback(
    (id: number | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (id) {
        params.set("u", id.toString());
      } else {
        params.delete("u");
      }
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const setSelectedImageUrl = useCallback(
    (url: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (url) {
        params.set("img", url);
      } else {
        params.delete("img");
      }
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  // Active messages state
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState<boolean>(false);
  const [input, setInput] = useState<string>("");
  const [isSending, setIsSending] = useState<boolean>(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState<boolean>(false);
  const [showCannedMenu, setShowCannedMenu] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [copiedEmail, setCopiedEmail] = useState<boolean>(false);

  // Scrolling state
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [stickToBottom, setStickToBottom] = useState<boolean>(true);
  const [showScrollBottomBtn, setShowScrollBottomBtn] = useState<boolean>(false);

  // Selected user record
  const selectedUser = useMemo(() => {
    if (!selectedUserId) return null;
    return users.find((u) => u.user_id === selectedUserId) || null;
  }, [users, selectedUserId]);

  // Fetch conversations (page 1 or load more)
  const fetchUsers = useCallback(
    async (
      pageToFetch = 1,
      overrideSearch?: string,
      overrideFilter?: "all" | "unread",
      isBackground = false
    ) => {
      const search = overrideSearch !== undefined ? overrideSearch : searchQuery;
      const filter = overrideFilter !== undefined ? overrideFilter : activeFilter;

      if (!isBackground) {
        if (pageToFetch === 1) setIsLoadingUsers(true);
        else setIsLoadingMore(true);
      }

      try {
        const res = await axios.get("api/chat/admin/chat-users", {
          params: {
            page: pageToFetch,
            limit: 20,
            search: search.trim() || undefined,
            filter,
            paginate: "true",
          },
        });

        const data = res.data;
        let fetchedUsers: ChatUser[] = [];
        let meta: PaginationMeta = {
          total: 0,
          page: pageToFetch,
          limit: 20,
          totalPages: 1,
          hasMore: false,
        };

        if (Array.isArray(data)) {
          fetchedUsers = data;
          meta = {
            total: data.length,
            page: pageToFetch,
            limit: 20,
            totalPages: 1,
            hasMore: false,
          };
        } else if (data && Array.isArray(data.users)) {
          fetchedUsers = data.users;
          if (data.pagination) meta = data.pagination;
          if (typeof data.totalUnread === "number") setTotalUnread(data.totalUnread);
        }

        setUsers((prev) => {
          if (pageToFetch === 1) {
            return fetchedUsers;
          }
          const existingIds = new Set(prev.map((u) => u.user_id));
          const newUnique = fetchedUsers.filter((u) => !existingIds.has(u.user_id));
          return [...prev, ...newUnique];
        });

        setPagination(meta);
      } catch (err) {
        // quiet error
      } finally {
        setIsLoadingUsers(false);
        setIsLoadingMore(false);
        setIsRefreshing(false);
      }
    },
    [searchQuery, activeFilter]
  );

  // Initial load and filter/search changes
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers(1, searchQuery, activeFilter);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery, activeFilter, fetchUsers]);

  // Background light polling for page 1 every 15 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchUsers(1, searchQuery, activeFilter, true);
    }, 15000);
    return () => clearInterval(interval);
  }, [searchQuery, activeFilter, fetchUsers]);

  // Fetch messages for selected user
  const fetchMessages = useCallback(
    async (isBackground = false) => {
      if (!selectedUserId) return;
      if (!isBackground) setIsLoadingMessages(true);
      try {
        const res = await axios.post("api/chat/admin/messages", {
          userId: selectedUserId,
        });
        const incomingMessages: Message[] = res.data || [];
        setMessages(incomingMessages);

        // Mark user unread count as 0 locally
        setUsers((prev) =>
          prev.map((u) =>
            u.user_id === selectedUserId ? { ...u, unread_user_messages: 0 } : u
          )
        );
      } catch (err) {
        // quiet error
      } finally {
        if (!isBackground) setIsLoadingMessages(false);
      }
    },
    [selectedUserId]
  );

  // Initial messages fetch on user select
  useEffect(() => {
    if (!selectedUserId) {
      setMessages([]);
      return;
    }
    fetchMessages(false);
    setStickToBottom(true);
  }, [selectedUserId, fetchMessages]);

  // Live polling for current conversation messages every 4 seconds
  useEffect(() => {
    if (!selectedUserId) return;
    const interval = setInterval(() => {
      fetchMessages(true);
    }, 4000);
    return () => clearInterval(interval);
  }, [selectedUserId, fetchMessages]);

  // Auto scroll logic
  const scrollToBottom = useCallback((smooth = true) => {
    const el = messagesContainerRef.current;
    if (!el) return;
    el.scrollTo({
      top: el.scrollHeight,
      behavior: smooth ? "smooth" : "auto",
    });
    setShowScrollBottomBtn(false);
  }, []);

  useEffect(() => {
    if (stickToBottom) {
      scrollToBottom(false);
    }
  }, [messages, stickToBottom, scrollToBottom]);

  const onMessagesScroll = useCallback(() => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const threshold = 120;
    const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - threshold;
    setStickToBottom(atBottom);
    setShowScrollBottomBtn(!atBottom);
  }, []);

  // Image upload handling
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
    inputRef.current?.focus();
  };

  const insertCannedResponse = (text: string) => {
    setInput(text);
    setShowCannedMenu(false);
    inputRef.current?.focus();
  };

  // Send message
  const onSend = useCallback(async () => {
    if (!selectedUserId) return;
    const trimmed = input.trim();
    if (!trimmed && !selectedImage) return;

    setIsSending(true);
    try {
      const formData = new FormData();
      formData.append("userId", selectedUserId.toString());
      if (trimmed) formData.append("content", trimmed);
      if (selectedImage) formData.append("image", selectedImage);

      const res = await axios.post("api/chat/admin/send", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const sentMsg: Message = res.data;

      // Optimistic message append
      setMessages((prev) => [...prev, sentMsg]);
      setInput("");
      removeImage();
      setStickToBottom(true);
      scrollToBottom(true);

      // Bump this user to the top of users list
      setUsers((prev) => {
        const found = prev.find((u) => u.user_id === selectedUserId);
        if (!found) return prev;
        const updatedUser: ChatUser = {
          ...found,
          last_message_at: sentMsg.createdAt,
          last_message: {
            content: sentMsg.content,
            image_url: sentMsg.image_url,
            sender_role: "admin",
            createdAt: sentMsg.createdAt,
          },
        };
        return [updatedUser, ...prev.filter((u) => u.user_id !== selectedUserId)];
      });
    } catch (err) {
      // quiet error
    } finally {
      setIsSending(false);
    }
  }, [selectedUserId, input, selectedImage, scrollToBottom]);

  // Delete chat
  const confirmDeleteChat = useCallback(async () => {
    if (!selectedUserId) return;
    setIsDeleting(true);
    try {
      await axios.delete(`api/chat/admin/delete-chat/${selectedUserId}`);
      setMessages([]);
      setUsers((prev) => prev.filter((u) => u.user_id !== selectedUserId));
      setSelectedUserId(null);
      setShowDeleteModal(false);
      fetchUsers(1, searchQuery, activeFilter);
    } catch (error) {
      console.error("Error deleting chat:", error);
    } finally {
      setIsDeleting(false);
    }
  }, [selectedUserId, searchQuery, activeFilter, fetchUsers, setSelectedUserId]);

  // Copy email
  const copyEmailToClipboard = (email: string) => {
    navigator.clipboard.writeText(email);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  // Group messages by day
  const groupedMessages = useMemo(() => {
    const groups: { date: string; items: Message[] }[] = [];
    messages.forEach((msg) => {
      const dateKey = new Date(msg.createdAt).toDateString();
      const lastGroup = groups[groups.length - 1];
      if (lastGroup && lastGroup.date === dateKey) {
        lastGroup.items.push(msg);
      } else {
        groups.push({ date: dateKey, items: [msg] });
      }
    });
    return groups;
  }, [messages]);

  return (
    <div className="flex h-[calc(100vh-105px)] w-full gap-4 p-3 md:p-6 font-cairo text-slate-200">
      {/* 1. Sidebar: Conversations List */}
      <div
        className={`flex flex-col overflow-hidden rounded-xl border border-white/[0.08] bg-[#0A0D14] transition-all duration-200 ${
          selectedUserId ? "hidden lg:flex lg:w-[380px]" : "flex w-full lg:w-[380px]"
        }`}
      >
        {/* Sidebar Header */}
        <div className="border-b border-white/[0.06] p-3.5 bg-[#0D101A]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/20">
                <MessageSquare size={16} />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white leading-none">
                  {isRtl ? "محادثات الدعم الفني" : "Support Conversations"}
                </h2>
                <span className="text-[11px] text-white/40 mt-0.5 block">
                  {pagination.total > 0
                    ? isRtl
                      ? `${pagination.total} محادثة مسجلة`
                      : `${pagination.total} total chats`
                    : isRtl
                    ? "لا توجد محادثات"
                    : "No chats"}
                </span>
              </div>
            </div>

            {/* Refresh Button */}
            <button
              onClick={() => {
                setIsRefreshing(true);
                fetchUsers(1, searchQuery, activeFilter);
              }}
              title={isRtl ? "تحديث المحادثات" : "Refresh chats"}
              className="flex h-7 w-7 items-center justify-center rounded-md border border-white/[0.08] bg-white/[0.02] text-white/60 hover:text-white hover:bg-white/[0.06] transition-all"
            >
              <RefreshCw size={13} className={isRefreshing ? "animate-spin text-indigo-400" : ""} />
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative mb-2.5">
            <Search
              className={`absolute top-1/2 -translate-y-1/2 text-white/30 ${
                isRtl ? "right-3" : "left-3"
              }`}
              size={15}
            />
            <input
              type="text"
              placeholder={isRtl ? "بحث بالاسم أو البريد الإلكتروني..." : "Search by name or email..."}
              className={`w-full rounded-lg bg-[#07090F] py-2 text-xs text-white placeholder:text-white/30 outline-none border border-white/[0.08] transition-all focus:border-indigo-500/50 ${
                isRtl ? "pr-9 pl-8 text-right" : "pl-9 pr-8 text-left"
              }`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className={`absolute top-1/2 -translate-y-1/2 text-white/40 hover:text-white ${
                  isRtl ? "left-2.5" : "right-2.5"
                }`}
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-lg bg-[#07090F] border border-white/[0.06]">
            <button
              onClick={() => setActiveFilter("all")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-md transition-all ${
                activeFilter === "all"
                  ? "bg-indigo-600 text-white"
                  : "text-white/60 hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              <span>{isRtl ? "الكل" : "All"}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  activeFilter === "all" ? "bg-white/20 text-white" : "bg-white/[0.06] text-white/50"
                }`}
              >
                {pagination.total}
              </span>
            </button>

            <button
              onClick={() => setActiveFilter("unread")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-md transition-all ${
                activeFilter === "unread"
                  ? "bg-indigo-600 text-white"
                  : "text-white/60 hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              <span>{isRtl ? "غير مقروءة" : "Unread"}</span>
              {totalUnread > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-600 text-white">
                  {totalUnread}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* User Conversation Items */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin scrollbar-thumb-white/10">
          {isLoadingUsers ? (
            <div className="space-y-1.5 p-1">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04]"
                >
                  <div className="h-9 w-9 rounded-full bg-white/[0.06]" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 w-28 rounded bg-white/[0.06]" />
                    <div className="h-2.5 w-40 rounded bg-white/[0.03]" />
                  </div>
                </div>
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className="py-20 text-center text-white/30">
              <User size={36} className="mx-auto mb-2 opacity-30 stroke-1" />
              <p className="text-xs font-medium">
                {searchQuery
                  ? isRtl
                    ? "لا توجد نتائج مطابقة لبحثك"
                    : "No chats match your search"
                  : activeFilter === "unread"
                  ? isRtl
                    ? "لا توجد رسائل غير مقروءة"
                    : "No unread messages"
                  : isRtl
                  ? "لا توجد أي محادثات حالياً"
                  : "No conversations found"}
              </p>
            </div>
          ) : (
            users.map((u) => {
              const isSelected = selectedUserId === u.user_id;
              const hasUnread = u.unread_user_messages > 0;
              const initials =
                `${u.first_name?.[0] || ""}${u.last_name?.[0] || ""}`.toUpperCase() || "U";
              const lastMsgText = u.last_message?.content || "";
              const hasAttachment = Boolean(u.last_message?.image_url);

              return (
                <button
                  key={u.user_id}
                  onClick={() => setSelectedUserId(u.user_id)}
                  className={`group relative flex w-full items-center gap-3 rounded-lg p-2.5 text-start transition-all border ${
                    isSelected
                      ? "bg-[#181E30] border-indigo-500/40"
                      : hasUnread
                      ? "bg-[#101422] border-white/[0.1] hover:bg-[#141A2C]"
                      : "bg-[#0D101A]/60 border-transparent hover:bg-white/[0.04]"
                  }`}
                >
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold border ${
                        isSelected
                          ? "bg-indigo-600 text-white border-indigo-400"
                          : hasUnread
                          ? "bg-indigo-950 text-indigo-300 border-indigo-500/40"
                          : "bg-[#141824] text-white/80 border-white/[0.08]"
                      }`}
                    >
                      {initials}
                    </div>
                    {/* Active dot */}
                    <span
                      className={`absolute bottom-0 ${
                        isRtl ? "left-0" : "right-0"
                      } h-2.5 w-2.5 rounded-full border-2 border-[#0A0D14] bg-emerald-500`}
                    />
                  </div>

                  {/* Info & snippet */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <h3
                        className={`truncate text-xs font-bold ${
                          isSelected ? "text-white" : hasUnread ? "text-white" : "text-slate-300"
                        }`}
                      >
                        {u.first_name} {u.last_name}
                      </h3>
                      <span className="shrink-0 text-[10px] text-white/40 font-mono">
                        {formatTimeAgo(u.last_message_at, isRtl)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <p
                        className={`truncate text-[11px] leading-tight flex items-center gap-1 ${
                          hasUnread
                            ? "font-semibold text-indigo-300"
                            : isSelected
                            ? "text-white/70"
                            : "text-white/40"
                        }`}
                      >
                        {u.last_message?.sender_role === "admin" && (
                          <span className="text-indigo-400 font-medium shrink-0">
                            {isRtl ? "أنت: " : "You: "}
                          </span>
                        )}
                        {hasAttachment && !lastMsgText && (
                          <span className="flex items-center gap-1 shrink-0 text-indigo-300">
                            <ImageIcon size={12} />
                            <span>{isRtl ? "صورة مرفقة" : "Photo"}</span>
                          </span>
                        )}
                        {lastMsgText && <span>{lastMsgText}</span>}
                        {!lastMsgText && !hasAttachment && (
                          <span className="italic opacity-60">
                            {isRtl ? "محادثة جديدة" : "New conversation"}
                          </span>
                        )}
                      </p>

                      {/* Unread badge */}
                      {hasUnread && (
                        <span className="shrink-0 flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white">
                          {u.unread_user_messages}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}

          {/* Load More Button */}
          {pagination.hasMore && (
            <div className="pt-2 pb-1 text-center">
              <button
                onClick={() => fetchUsers(pagination.page + 1)}
                disabled={isLoadingMore}
                className="w-full py-2 px-3 rounded-lg border border-white/[0.08] bg-[#0E121E] text-xs font-semibold text-white/70 hover:text-white hover:bg-white/[0.06] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoadingMore ? (
                  <>
                    <RefreshCw size={13} className="animate-spin text-indigo-400" />
                    <span>{isRtl ? "جاري جلب المزيد..." : "Loading more..."}</span>
                  </>
                ) : (
                  <>
                    <span>
                      {isRtl
                        ? `عرض المزيد من المحادثات (${pagination.total - users.length} متبقية)`
                        : `Load older chats (${pagination.total - users.length} remaining)`}
                    </span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. Main Chat Area */}
      <div className="relative flex flex-1 flex-col overflow-hidden rounded-xl border border-white/[0.08] bg-[#0B0E17]">
        {selectedUser ? (
          <>
            {/* Chat Header */}
            <div className="flex items-center justify-between border-b border-white/[0.06] px-4 md:px-6 py-3 bg-[#0D101A]">
              <div className="flex items-center gap-3 min-w-0">
                {/* Mobile Back Button */}
                <button
                  onClick={() => setSelectedUserId(null)}
                  className="lg:hidden flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04] text-white/70 hover:text-white"
                  title={isRtl ? "الرجوع للقائمة" : "Back to list"}
                >
                  {isRtl ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                </button>

                {/* User Avatar */}
                <div className="relative shrink-0">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-white text-xs font-bold border border-indigo-400/30">
                    {`${selectedUser.first_name?.[0] || ""}${
                      selectedUser.last_name?.[0] || ""
                    }`.toUpperCase() || "U"}
                  </div>
                  <span
                    className={`absolute bottom-0 ${
                      isRtl ? "left-0" : "right-0"
                    } h-2.5 w-2.5 rounded-full border-2 border-[#0D101A] bg-emerald-500`}
                  />
                </div>

                {/* Name & details */}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate font-bold text-sm text-white">
                      {selectedUser.first_name} {selectedUser.last_name}
                    </h3>
                    <span className="shrink-0 rounded bg-white/[0.06] border border-white/[0.06] px-1.5 py-0.2 text-[10px] font-mono text-white/50">
                      #{selectedUser.user_id}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-white/40">
                    <button
                      onClick={() => copyEmailToClipboard(selectedUser.email)}
                      className="hover:text-indigo-300 flex items-center gap-1 transition-colors group truncate"
                      title={isRtl ? "نسخ البريد الإلكتروني" : "Copy email"}
                    >
                      <span className="truncate">{selectedUser.email}</span>
                      {copiedEmail ? (
                        <CheckCircle2 size={12} className="text-emerald-400 shrink-0" />
                      ) : (
                        <Copy size={11} className="opacity-40 group-hover:opacity-100 shrink-0" />
                      )}
                    </button>
                    <span>•</span>
                    <span className="text-emerald-400 font-medium shrink-0">
                      {isRtl ? "متصل الآن" : "Active"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <a
                  href={`/admin/users?search=${encodeURIComponent(selectedUser.email)}`}
                  target="_blank"
                  rel="noreferrer"
                  title={isRtl ? "فتح صفحة المستخدم" : "Open user profile"}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-white/50 hover:text-white hover:bg-white/[0.08] transition-all"
                >
                  <ExternalLink size={14} />
                </a>

                <button
                  onClick={() => setShowDeleteModal(true)}
                  title={isRtl ? "حذف سجل المحادثة" : "Delete chat history"}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-white/50 hover:text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/20 transition-all"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            {/* Messages Viewport */}
            <div
              ref={messagesContainerRef}
              onScroll={onMessagesScroll}
              className="relative flex-1 space-y-4 overflow-y-auto p-4 md:p-6 scrollbar-thin scrollbar-thumb-white/10 bg-[#080B12]"
            >
              {isLoadingMessages ? (
                <div className="flex h-full items-center justify-center">
                  <div className="flex flex-col items-center gap-2.5 text-white/40">
                    <RefreshCw size={22} className="animate-spin text-indigo-400" />
                    <span className="text-xs font-medium">
                      {isRtl ? "جاري تحميل الرسائل..." : "Loading messages..."}
                    </span>
                  </div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center text-white/30">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/[0.03] border border-white/[0.06] mb-3">
                    <MessageSquare size={24} className="opacity-40" />
                  </div>
                  <h4 className="text-xs font-semibold text-white/60">
                    {isRtl ? "لا توجد رسائل سابقة" : "No messages yet"}
                  </h4>
                  <p className="text-[11px] text-white/30 max-w-xs mt-1">
                    {isRtl
                      ? "ابدأ بكتابة أول رسالة للرد على العميل عبر الشريط بالأسفل"
                      : "Send a message below to start the conversation"}
                  </p>
                </div>
              ) : (
                groupedMessages.map((group) => (
                  <div key={group.date} className="space-y-3">
                    {/* Date separator */}
                    <div className="flex items-center justify-center my-3">
                      <span className="rounded-full bg-[#121624] border border-white/[0.08] px-3 py-0.5 text-[10px] font-medium text-white/50">
                        {formatDateSeparator(group.date, isRtl)}
                      </span>
                    </div>

                    {/* Messages in this group */}
                    {group.items.map((m) => {
                      const isAdmin = m.sender_role === "admin";
                      return (
                        <div
                          key={m.message_id}
                          className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`group relative flex max-w-[85%] md:max-w-[70%] flex-col ${
                              isAdmin ? "items-end" : "items-start"
                            }`}
                          >
                            <div
                              className={`overflow-hidden px-4 py-2.5 rounded-xl transition-all ${
                                isAdmin
                                  ? "bg-[#4F46E5] text-white rounded-tr-none"
                                  : "bg-[#151926] text-slate-100 border border-white/[0.08] rounded-tl-none"
                              }`}
                            >
                              {/* Attachment preview if image exists */}
                              {m.image_url && (
                                <div className="mb-2 relative group/img overflow-hidden rounded-lg border border-white/10 bg-black/30">
                                  <img
                                    src={`${process.env.NEXT_PUBLIC_API_URL}${m.image_url}`}
                                    alt="Chat attachment"
                                    className="max-h-[260px] w-full object-cover cursor-pointer"
                                    onClick={() =>
                                      setSelectedImageUrl(
                                        `${process.env.NEXT_PUBLIC_API_URL}${m.image_url}`
                                      )
                                    }
                                  />
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                                    <ExternalLink size={18} className="text-white" />
                                  </div>
                                </div>
                              )}

                              {/* Text content */}
                              {m.content && (
                                <p
                                  className={`whitespace-pre-wrap break-words text-xs leading-relaxed font-sans ${
                                    isRtl ? "text-right" : "text-left"
                                  }`}
                                >
                                  {m.content}
                                </p>
                              )}
                            </div>

                            {/* Timestamp & read receipts */}
                            <div className="mt-1 flex items-center gap-1.5 px-1">
                              <span className="text-[10px] text-white/30 font-mono">
                                {new Date(m.createdAt).toLocaleTimeString(
                                  isRtl ? "ar-EG" : "en-US",
                                  { hour: "2-digit", minute: "2-digit" }
                                )}
                              </span>
                              {isAdmin && (
                                <div className="flex items-center">
                                  {m.is_read_by_user ? (
                                    <CheckCheck size={13} className="text-emerald-400" />
                                  ) : (
                                    <Check size={12} className="text-white/30" />
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))
              )}

              {/* Floating scroll to bottom button */}
              {showScrollBottomBtn && (
                <button
                  onClick={() => scrollToBottom(true)}
                  className="fixed bottom-24 left-1/2 -translate-x-1/2 lg:bottom-28 z-20 flex items-center gap-1.5 rounded-full bg-[#1C2234] hover:bg-[#252D44] text-white px-3 py-1.5 text-xs font-semibold border border-white/10 transition-all active:scale-95"
                >
                  <ArrowDown size={13} />
                  <span>{isRtl ? "أحدث الرسائل" : "Scroll to bottom"}</span>
                </button>
              )}
            </div>

            {/* Input Bar */}
            <div className="border-t border-white/[0.06] bg-[#0D101A] p-3 md:p-3.5">
              {/* Image Preview Drawer if selected */}
              <AnimatePresence>
                {imagePreview && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="mb-2.5 relative inline-flex items-center gap-3 p-2 rounded-lg bg-white/[0.04] border border-white/[0.08]"
                  >
                    <div className="h-12 w-12 overflow-hidden rounded-md border border-white/20">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="text-xs">
                      <p className="font-semibold text-white">
                        {isRtl ? "صورة جاهزة للإرسال" : "Image ready to send"}
                      </p>
                      <p className="text-[10px] text-white/40">{selectedImage?.name}</p>
                    </div>
                    <button
                      onClick={removeImage}
                      className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white transition-all ml-2"
                      title={isRtl ? "إلغاء الصورة" : "Cancel image"}
                    >
                      <X size={11} />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Quick canned replies menu popover */}
              <AnimatePresence>
                {showCannedMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className={`absolute bottom-16 ${
                      isRtl ? "right-4" : "left-4"
                    } z-50 w-80 max-w-[90vw] overflow-hidden rounded-xl border border-white/[0.1] bg-[#111624] p-2`}
                  >
                    <div className="p-2 border-b border-white/[0.06] flex items-center justify-between">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Zap size={13} className="text-amber-400" />
                        {isRtl ? "ردود سريعة جاهزة" : "Canned Replies"}
                      </span>
                      <button
                        onClick={() => setShowCannedMenu(false)}
                        className="text-white/40 hover:text-white"
                      >
                        <X size={13} />
                      </button>
                    </div>
                    <div className="max-h-56 overflow-y-auto p-1 space-y-0.5 scrollbar-thin scrollbar-thumb-white/10">
                      {CANNED_RESPONSES.map((r, i) => (
                        <button
                          key={i}
                          onClick={() => insertCannedResponse(isRtl ? r.ar : r.en)}
                          className="w-full text-start p-2 rounded-md text-xs text-white/80 hover:text-white hover:bg-white/[0.06] transition-all"
                        >
                          {isRtl ? r.ar : r.en}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Emoji Picker Popover */}
              <AnimatePresence>
                {showEmojiPicker && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className={`absolute bottom-16 ${
                      isRtl ? "right-16" : "left-16"
                    } z-50 overflow-hidden rounded-xl border border-white/[0.1] bg-[#111624] p-2.5`}
                  >
                    <div className="grid grid-cols-8 gap-1 max-h-[150px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
                      {EMOJI_LIST.map((emoji, index) => (
                        <button
                          key={index}
                          onClick={() => addEmoji(emoji)}
                          className="flex h-7 w-7 items-center justify-center rounded text-sm hover:bg-white/[0.1] transition-colors"
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
                <div className="relative flex-1 flex items-center gap-2 rounded-lg bg-[#07090F] px-3 py-1 border border-white/[0.08] focus-within:border-indigo-500/50 transition-colors">
                  {/* Emoji Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowEmojiPicker(!showEmojiPicker);
                      setShowCannedMenu(false);
                    }}
                    className="text-white/40 hover:text-amber-400 transition-colors p-1"
                    title={isRtl ? "إيموجي" : "Emoji"}
                  >
                    <Smile size={18} />
                  </button>

                  {/* Canned Responses Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowCannedMenu(!showCannedMenu);
                      setShowEmojiPicker(false);
                    }}
                    className="text-white/40 hover:text-indigo-400 transition-colors p-1"
                    title={isRtl ? "ردود سريعة" : "Quick canned response"}
                  >
                    <Zap size={17} />
                  </button>

                  {/* Input field */}
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder={
                      isRtl
                        ? "اكتب ردك للعميل هنا... (اضغط Enter للإرسال)"
                        : "Type your reply... (Press Enter to send)"
                    }
                    className={`flex-1 bg-transparent py-2 text-xs md:text-sm text-white outline-none placeholder:text-white/30 ${
                      isRtl ? "text-right" : "text-left"
                    }`}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        onSend();
                      }
                    }}
                    disabled={isSending}
                  />

                  {/* Paperclip file uploader */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-white/40 hover:text-indigo-400 transition-colors p-1"
                    title={isRtl ? "إرفاق صورة" : "Attach image"}
                  >
                    <Paperclip size={17} />
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
                  onClick={onSend}
                  disabled={isSending || (!input.trim() && !selectedImage)}
                  className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#4F46E5] hover:bg-[#4338CA] text-white transition-colors disabled:opacity-40 shrink-0"
                  title={isRtl ? "إرسال" : "Send"}
                >
                  {isSending ? (
                    <RefreshCw size={16} className="animate-spin text-white" />
                  ) : (
                    <Send size={16} className={isRtl ? "rotate-180" : ""} />
                  )}
                </button>
              </div>
            </div>
          </>
        ) : (
          /* Empty state: No user selected */
          <div className="flex flex-1 flex-col items-center justify-center text-center p-6 text-white/30">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#101422] border border-white/[0.08] text-white/40 mb-3">
              <MessageSquare size={32} className="stroke-[1.5]" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">
              {isRtl ? "محادثات الدعم الفني وخدمة العملاء" : "Support Chat Inbox"}
            </h3>
            <p className="max-w-md text-xs leading-relaxed text-white/40">
              {isRtl
                ? "قم باختيار محادثة من القائمة الجانبية لبدء التواصل مع العميل والرد على استفساراته بشكل فوري."
                : "Select a conversation from the sidebar to start assisting users with live support."}
            </p>
          </div>
        )}
      </div>

      {/* Confirmation Modal for Delete Chat */}
      <ConfirmationModal
        title={isRtl ? "تأكيد حذف المحادثة" : "Confirm Chat Deletion"}
        message={
          isRtl
            ? "هل أنت متأكد من حذف هذه المحادثة بالكامل؟ سيتم مسح كافة الرسائل والمرفقات ولا يمكن استرجاعها."
            : "Are you sure you want to completely delete this chat? All messages and attachments will be permanently removed."
        }
        buttonMessage={
          isDeleting
            ? isRtl
              ? "جاري الحذف..."
              : "Deleting..."
            : isRtl
            ? "تأكيد الحذف"
            : "Confirm Delete"
        }
        modalOpen={showDeleteModal}
        setModalOpen={setShowDeleteModal}
        action={confirmDeleteChat}
        isLoading={isDeleting}
      />

      {/* Image Lightbox Modal */}
      <AnimatePresence>
        {selectedImageUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/95 p-4"
            onClick={() => setSelectedImageUrl(null)}
          >
            <button
              onClick={() => setSelectedImageUrl(null)}
              className={`fixed top-6 ${
                isRtl ? "right-6" : "left-6"
              } z-[100000] flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-xs font-bold text-white border border-white/10 hover:bg-white/20 transition-all`}
            >
              <X size={16} />
              <span>{isRtl ? "إغلاق" : "Close"}</span>
            </button>

            <motion.div
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.98, opacity: 0 }}
              className="relative max-h-[90vh] max-w-[90vw] overflow-hidden rounded-xl border border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={selectedImageUrl}
                alt="Full size attachment"
                className="max-h-[85vh] max-w-[85vw] object-contain"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
