"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "@/utils/api";
import { useTranslation } from "react-i18next";
import { Check, Image as ImageIcon, Smile } from "lucide-react";
import ConfirmationModal from "@/components/ComfirmationModal";

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
  const [input, setInput] = useState("");//
  const [isSending, setIsSending] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState<boolean>(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { t, i18n } = useTranslation();
  const [stickToBottom, setStickToBottom] = useState(true);

  const selectedUser = useMemo(() => {
    if (!selectedUserId) return null;
    return users.find(u => u.user_id === selectedUserId) || null;
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
      // refresh users to update unread counts
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

  // Auto-scroll to bottom within the messages container (avoid scrolling the whole page)
  useEffect(() => {
    const el = messagesContainerRef.current;
    if (el && stickToBottom) {
      el.scrollTop = el.scrollHeight;
      
      // Small delay to ensure DOM is updated
      const timer = setTimeout(() => {
        if (el) el.scrollTop = el.scrollHeight;
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [messages, stickToBottom]);

  // When switching users, re-enable sticking to bottom
  useEffect(() => {
    setStickToBottom(true);
  }, [selectedUserId]);

  const onMessagesScroll = useCallback(() => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const threshold = 60; // px from bottom to consider as sticking
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

  const headerTitle = useMemo(() => t("chat.UserSupportInbox"), []);
  const orderedUsers = useMemo(() => {
    return [...users].sort((a, b) => {
      const aHasUnread = a.unread_user_messages > 0 ? 1 : 0;
      const bHasUnread = b.unread_user_messages > 0 ? 1 : 0;
      if (bHasUnread !== aHasUnread) return bHasUnread - aHasUnread; // chats with new messages first
      // then by unread count desc
      if (b.unread_user_messages !== a.unread_user_messages) return b.unread_user_messages - a.unread_user_messages;
      return 0;
    });
  }, [users]);
  const orderedMessages = useMemo(() => {
    return [...messages].sort((a, b) => {
      const aTime = new Date(a.createdAt).getTime();
      const bTime = new Date(b.createdAt).getTime();
      return aTime - bTime; // oldest first (for top to bottom display)
    });
  }, [messages]);

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleDeleteChat = useCallback(() => {
    setShowDeleteModal(true);
  }, []);

  const confirmDeleteChat = useCallback(async () => {
    if (!selectedUserId) return;
    setIsDeleting(true);
    try {
      await axios.delete(`api/chat/admin/delete-chat/${selectedUserId}`);
      setMessages([]);
      setSelectedUserId(null);
      setShowDeleteModal(false);
      fetchUsers(); // Refresh user list to update UI
    } catch (error) {
      console.error('Error deleting chat:', error);
    } finally {
      setIsDeleting(false);
    }
  }, [selectedUserId, fetchUsers]);

  return (
    <div className="grid grid-cols-12 gap-4 p-4">
      <div className="col-span-12 lg:col-span-4">
        <div className="bg-[#190237]  rounded-lg shadow  flex flex-col h-[70vh] overflow-hidden">
        <div className="p-4 border-b border-orange  text-lg font-semibold text-[#00c48c]">{headerTitle}</div>
          {users.length === 0 && <p className="text-center text-gray-500">لا يوجد محادثات</p>}
          <div className="flex-1 overflow-y-auto">
            {orderedUsers.map((u) => (
              <button
                key={u.user_id}
                onClick={() => setSelectedUserId(u.user_id)}
                className={
                  "w-full text-left px-4 py-3  " +
                  (selectedUserId === u.user_id ? "bg-gray-50 dark:bg-meta-4" : "")
                }
              >
                <div className="font-medium text-[#00c48c]">{u.first_name} {u.last_name}</div>
                <div className="text-xs text-white opacity-70">{u.email}</div>
                {u.unread_user_messages > 0 && (
                  <div className="mt-1 inline-flex text-xs px-2 py-0.5 rounded-full bg-danger text-white">
                    {u.unread_user_messages} {t("chat.NewMessages")}
                  </div>
                )}
              </button>
            ))}
          </div>
          
          {/* Delete Confirmation Modal */}
          <ConfirmationModal
            title="تأكيد الحذف"
            message="هل أنت متأكد من حذف هذه المحادثة؟ لا يمكن التراجع عن هذا الإجراء."
            buttonMessage={isDeleting ? 'جاري الحذف...' : 'حذف'}
            modalOpen={showDeleteModal}
            setModalOpen={setShowDeleteModal}
            action={confirmDeleteChat}
            isLoading={isDeleting}
          />
        </div>
      </div>
      <div className="col-span-12 lg:col-span-8">
        <div className="bg-[#190237]  rounded-lg shadow  flex flex-col h-[70vh] overflow-hidden">
          <div className="p-4 border-b border-orange text-[#00c48c] text-lg font-semibold flex justify-between items-center">
            <span>
              {selectedUser ? `${t("chat.ConversationWith")} ${selectedUser.first_name} ${selectedUser.last_name}` : t("chat.Selectuser")}
            </span>
            {selectedUser && (
              <button 
                onClick={handleDeleteChat}
                disabled={isDeleting}
                className="text-white bg-[#ef4444]  text-sm px-3 py-1  rounded-md  transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? 'جاري الحذف...' : 'حذف الشات'}
              </button>
            )}
          </div>
          <div ref={messagesContainerRef} onScroll={onMessagesScroll} className="flex-1 overflow-y-auto p-4 flex flex-col space-y-3">
            <div className="flex-1 min-h-0" /> {/* This pushes messages to bottom */}
            {orderedMessages.map((m) => (
              <div
                key={m.message_id}
                className={
                  m.sender_role === "admin" ? "flex justify-end" : "flex justify-start"
                }
              >
                <div
                  className={
                    "max-w-[75%] px-3 py-2 rounded-lg " +
                    (m.sender_role === "admin"
                      ? "bg-[#00c48c80] text-white rounded-br-none"
                      : "bg-gray-100  rounded-bl-none")
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
                    <div className="whitespace-pre-wrap text-white/80 break-words">{m.content}</div>
                  )}
                  <div className="text-[10px] opacity-60 mt-1 flex items-center gap-1">
                    <span className="text-white/80">{new Date(m.createdAt).toLocaleString()}</span>
                    <span className="inline-flex items-center gap-0.5">
                      {m.sender_role === "admin" ? (
                        m.is_read_by_user ? (
                          <>
                            <Check strokeWidth={5} size={12} className="text-[#00c48c]" />
                            <Check strokeWidth={5} size={12} className="text-[#00c48c] -ml-1" />
                          </>
                        ) : (
                          <Check strokeWidth={5} size={12} className="text-gray-400" />
                        )
                      ) : m.is_read_by_admin ? (
                        <>
                          <Check strokeWidth={5} size={12} className="text-[#00c48c]" />
                          <Check strokeWidth={5} size={12} className="text-[#00c48c] -ml-1" />
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
            <div className="px-3 py-2 border-t border-orange">
              <div className="relative inline-block">
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
          
          <div className="p-3  flex gap-2">
            <input
              className="flex-1 rounded border border-[#00c48c] bg-transparent px-3 py-2 outline-none"
              placeholder={t("chat.TypeReplay")}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={!selectedUserId || isSending}
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
              className="px-3 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300"
              disabled={!selectedUserId || isSending}
            >
              <Smile className="text-[#00c48c]" size={20} />
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300"
              disabled={!selectedUserId || isSending}
            >
              <ImageIcon className="text-[#00c48c]" size={32} />
            </button>
            <button
              onClick={onSend}
              disabled={!selectedUserId || isSending || (!input.trim() && !selectedImage)}
              className="px-4 py-2 rounded bg-primary text-white disabled:opacity-50"
            >
              {t("chat.send")}
            </button>
          </div>
          
          {/* Emoji Picker */}
          {showEmojiPicker && (
            <div className="px-3 py-2 border-t border-orange bg-[#190237]">
              <div className="grid grid-cols-8 gap-1">
                {['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '💩', '👻', '💀', '☠️', '👽', '👾', '🤖', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾', '🙈', '🙉', '🙊', '👶', '👧', '🧒', '👦', '👩', '🧑', '👨', '👵', '🧓', '👴', '👮‍♀️', '👮', '👮‍♂️', '🕵️‍♀️', '🕵️', '🕵️‍♂️', '💂‍♀️', '💂', '💂‍♂️', '👷‍♀️', '👷', '👷‍♂️', '🤴', '👸', '👳‍♀️', '👳', '👳‍♂️', '👲', '🧕', '🤵‍♀️', '🤵', '🤵‍♂️', '👰‍♀️', '👰', '👰‍♂️', '🤰', '🤱', '👼', '🎅', '🤶', '🧙‍♀️', '🧙', '🧙‍♂️', '🧝‍♀️', '🧝', '🧝‍♂️', '🧛‍♀️', '🧛', '🧛‍♂️', '🧟‍♀️', '🧟', '🧟‍♂️', '🧞‍♀️', '🧞', '🧞‍♂️', '🧜‍♀️', '🧜', '🧜‍♂️', '🧚‍♀️', '🧚', '🧚‍♂️', '👼', '🤰', '🤱', '👼', '🎅', '🤶', '🧙‍♀️', '🧙', '🧙‍♂️', '🧝‍♀️', '🧝', '🧝‍♂️', '🧛‍♀️', '🧛', '🧛‍♂️', '🧟‍♀️', '🧟', '🧟‍♂️', '🧞‍♀️', '🧞', '🧞‍♂️', '🧜‍♀️', '🧜', '🧜‍♂️', '🧚‍♀️', '🧚', '🧚‍♂️'].map((emoji, index) => (
                  <button
                    key={index}
                    onClick={() => addEmoji(emoji)}
                    className="w-8 h-8 text-lg hover:bg-gray-600 rounded flex items-center justify-center"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

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


