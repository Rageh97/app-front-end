"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import api from "@/utils/api";
import { MessageSquare, X, Check, Image as ImageIcon, Smile } from "lucide-react";
import { useTranslation } from "react-i18next";

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
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { t, i18n } = useTranslation();

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
    // Clear unread count when chat is opened
    setUnreadCount(0);
    const id = setInterval(fetchMessages, 5000);
    return () => clearInterval(id);
  }, [open, fetchMessages]);

  // Fetch unread count when widget is not open
  useEffect(() => {
    if (open) return;
    fetchUnreadCount();
    const id = setInterval(fetchUnreadCount, 30000); // Poll every 30 seconds instead of 5
    return () => clearInterval(id);
  }, [open, fetchUnreadCount]);

  // Show welcome message only the first time the user opens the chat
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

  // Auto-scroll to bottom when user is near the bottom
  useEffect(() => {
    if (!open) return;
    const el = messagesContainerRef.current;
    if (el && stickToBottom) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages, open, stickToBottom]);

  // Re-enable sticking when opening
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
      // Mark welcome as shown after user sends the first message
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

  const headerTitle = useMemo(() => t("chat.supportChat"), []);

  return (
    <div className="fixed bottom-4 right-4 z-[1000]">
      {/* Toggle Button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="rounded-full animate-bounce shadow-lg bg-primary text-white p-3 hover:opacity-90 focus:outline-none relative"
        aria-label={open ? "Close chat" : "Open chat"}
        data-chat-widget-toggle
      >
        <MessageSquare size={22} />
        {unreadCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 10 ? '10+' : unreadCount}
          </span>
        )}
      </button>

      {/* Chat Panel */}
      {open && (
        <div className="mt-3 w-[320px] sm:w-[360px] h-[420px] bg-white rounded-xl shadow-2xl border border-stroke dark:border-strokedark flex flex-col">
          <div className="px-3 py-2 border-b border-stroke dark:border-strokedark flex items-center justify-between">
            <div className="text-sm font-semibold">{headerTitle}</div>
            <button
              className="text-xs text-gray-500 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
              onClick={() => setOpen(false)}
            >
              <X size={16} />
            </button>
          </div>
          <div ref={messagesContainerRef} onScroll={onMessagesScroll} className="flex-1 overflow-y-auto p-3 space-y-2">
            {showWelcome && messages.length === 0 && (
              <div className="flex justify-start">
                <div className="max-w-[80%] px-3 py-2 rounded-lg bg-orange text-white rounded-bl-none">
                  <div className="whitespace-pre-wrap break-words text-md ">
                    {/* Simple welcome text; replace with i18n if desired */}
                    مرحبًا! كيف يمكننا مساعدتك اليوم؟
                  </div>
                  <div className="whitespace-pre-wrap break-words text-md ">
                    {/* Simple welcome text; replace with i18n if desired */}
                    سيتم الرد عليك خلال دقائق...
                  </div>
                  {/* <div className="text-[9px] text-black opacity-60 mt-1">{new Date().toLocaleString()}</div> */}
                </div>
              </div>
            )}
            {messages.map((m) => (
              <div
                key={m.message_id}
                className={m.sender_role === "user" ? "flex justify-end" : "flex justify-start"}
              >
                <div
                  className={
                    "max-w-[80%] px-3 py-2 rounded-lg " +
                    (m.sender_role === "user"
                      ? "bg-[#190237] text-white rounded-br-none"
                      : "bg-gray-100  text-gray-900  rounded-bl-none")
                  }
                >
                  {m.image_url && (
                    <div className="mb-2">
                      <img
                        src={`${process.env.NEXT_PUBLIC_API_URL}${m.image_url}`}
                        alt="Chat image"
                        className="max-w-full h-auto rounded cursor-pointer hover:opacity-80 transition-opacity"
                        style={{ maxHeight: "200px" }}
                        onClick={() => openImageModal(`${process.env.NEXT_PUBLIC_API_URL}${m.image_url}`)}
                      />
                    </div>
                  )}
                  {m.content && (
                    <div className="whitespace-pre-wrap break-words text-xs">{m.content}</div>
                  )}
                  <div className="text-[9px] opacity-60 mt-1 flex items-center gap-1">
                    <span>{new Date(m.createdAt).toLocaleString()}</span>
                    <span className="inline-flex items-center ">
                      {m.sender_role === "user" ? (
                        m.is_read_by_admin ? (
                          <>
                            <Check strokeWidth={5} size={12} className="text-[#00c48c]" />
                            <Check strokeWidth={5} size={12} className="text-[#00c48c] " />
                          </>
                        ) : (
                          <Check strokeWidth={5} size={12} className="text-gray-400" />
                        )
                      ) : m.is_read_by_user ? (
                        <>
                          <Check strokeWidth={5} size={12} className="text-[#00c48c]" />
                          <Check strokeWidth={5} size={12} className="text-[#00c48c] " />
                        </>
                      ) : (
                        <Check strokeWidth={5} size={12} className="text-gray-400" />
                      )}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
          
          {/* Image Preview */}
          {imagePreview && (
            <div  className="px-2 py-1 border-t border-stroke dark:border-strokedark">
              <div  className="relative inline-block">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="max-w-full h-auto rounded"
                  style={{ maxHeight: "100px" }}
                />
                <button
                  onClick={removeImage}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                >
                  ×
                </button>
              </div>
            </div>
          )}
          
          <div className="p-2 border-t border-stroke dark:border-strokedark flex gap-2">
            <input
              className="flex-1 rounded border border-stroke dark:border-strokedark bg-transparent px-2 py-1 text-sm outline-none"
              placeholder={t("chat.Type")}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              disabled={isSending}
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
            
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="px-2 py-1 rounded bg-gray-200 text-gray-700 hover:bg-gray-300"
              disabled={isSending}
            >
              <Smile className="text-primary" size={16} />
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-2 py-1 rounded bg-gray-200 text-gray-700 hover:bg-gray-300"
              disabled={isSending}
            >
              <ImageIcon className="text-primary" size={16} />
            </button>
            <button
              onClick={onSend}
              disabled={isSending || (!input.trim() && !selectedImage)}
              className="px-3 py-1 rounded bg-primary text-white text-sm disabled:opacity-50"
            >
              {t("chat.send")}
            </button>
          </div>
          
          {/* Emoji Picker */}
          {showEmojiPicker && (
            <div className="px-2 py-1 border-t border-stroke dark:border-strokedark bg-white dark:bg-gray-800">
              <div className="grid grid-cols-8 gap-1">
                {['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '💩', '👻', '💀', '☠️', '👽', '👾', '🤖', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾', '🙈', '🙉', '🙊', '👶', '👧', '🧒', '👦', '👩', '🧑', '👨', '👵', '🧓', '👴', '👮‍♀️', '👮', '👮‍♂️', '🕵️‍♀️', '🕵️', '🕵️‍♂️', '💂‍♀️', '💂', '💂‍♂️', '👷‍♀️', '👷', '👷‍♂️', '🤴', '👸', '👳‍♀️', '👳', '👳‍♂️', '👲', '🧕', '🤵‍♀️', '🤵', '🤵‍♂️', '👰‍♀️', '👰', '👰‍♂️', '🤰', '🤱', '👼', '🎅', '🤶', '🧙‍♀️', '🧙', '🧙‍♂️', '🧝‍♀️', '🧝', '🧝‍♂️', '🧛‍♀️', '🧛', '🧛‍♂️', '🧟‍♀️', '🧟', '🧟‍♂️', '🧞‍♀️', '🧞', '🧞‍♂️', '🧜‍♀️', '🧜', '🧜‍♂️', '🧚‍♀️', '🧚', '🧚‍♂️', '👼', '🤰', '🤱', '👼', '🎅', '🤶', '🧙‍♀️', '🧙', '🧙‍♂️', '🧝‍♀️', '🧝', '🧝‍♂️', '🧛‍♀️', '🧛', '🧛‍♂️', '🧟‍♀️', '🧟', '🧟‍♂️', '🧞‍♀️', '🧞', '🧞‍♂️', '🧜‍♀️', '🧜', '🧜‍♂️', '🧚‍♀️', '🧚', '🧚‍♂️'].map((emoji, index) => (
                  <button
                    key={index}
                    onClick={() => addEmoji(emoji)}
                    className="w-8 h-8 text-lg hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center justify-center"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Image Modal */}
      {selectedImageUrl && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[2000] p-4"
          onClick={closeImageModal}
        >
          <div className="relative max-w-full max-h-full">
            <img
              src={selectedImageUrl}
              alt="Full size image"
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}


