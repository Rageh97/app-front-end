"use client";

import { useState, useCallback } from "react";
import { toast } from "react-hot-toast";
import { AIResultCardItem } from "@/components/ai";

export interface UseAiToolHistoryOptions {
  tool: string;
  type?: "image" | "video";
  limit?: number;
}

export function useAiToolHistory({
  tool,
  type = "image",
  limit = 30,
}: UseAiToolHistoryOptions) {
  const [items, setItems] = useState<AIResultCardItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<AIResultCardItem | null>(null);

  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  const getToken = useCallback(() => {
    return typeof window !== 'undefined' 
      ? (localStorage.getItem("a") || localStorage.getItem("token")) 
      : null;
  }, []);

  const getHeaders = useCallback(() => {
    const token = getToken();
    const userClient = typeof window !== 'undefined' 
      ? (global as any)?.clientId1328 || localStorage.getItem('clientId1328') 
      : undefined;
    return {
      'Authorization': token || '',
      'User-Client': userClient || '',
    };
  }, [getToken]);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const endpoint = type === "video" 
        ? `${apiBase}/api/ai/user-videos?limit=${limit}&tool=${tool}`
        : `${apiBase}/api/ai/user-images?limit=${limit}&tool=${tool}`;

      const res = await fetch(endpoint, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          const rawItems = type === "video" ? data.videos : data.images;
          const mapped: AIResultCardItem[] = (rawItems || []).map((item: any) => ({
            id: item.image_id || item.video_id || item.id,
            url: item.image_url || item.video_url || item.cloudinary_url,
            date: item.created_at,
            prompt: item.prompt,
            is_public: item.is_public,
            type,
            raw: item,
          }));
          setItems(mapped);
        }
      }
    } catch (e) {
      console.error("[useAiToolHistory] Fetch error:", e);
    } finally {
      setLoading(false);
    }
  }, [apiBase, getHeaders, limit, tool, type]);

  const deleteItem = useCallback(async (id: number | string) => {
    try {
      const endpoint = type === "video"
        ? `${apiBase}/api/ai/user-videos/${id}`
        : `${apiBase}/api/ai/user-images/${id}`;

      const res = await fetch(endpoint, {
        method: "DELETE",
        headers: getHeaders(),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "تعذر حذف النتيجة");
      }
      setItems((prev) => prev.filter((item) => item.id !== id));
      if (selectedItem?.id === id) {
        setSelectedItem(null);
      }
      toast.success("تم حذف النتيجة بنجاح");
    } catch (err: any) {
      toast.error(err?.message || "فشل حذف النتيجة");
    }
  }, [apiBase, getHeaders, selectedItem?.id, type]);

  const deleteAll = useCallback(async () => {
    try {
      const endpoint = type === "video"
        ? `${apiBase}/api/ai/user-videos?tool=${tool}`
        : `${apiBase}/api/ai/user-images?tool=${tool}`;

      const res = await fetch(endpoint, {
        method: "DELETE",
        headers: getHeaders(),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "تعذر حذف جميع النتائج");
      }
      setItems([]);
      setSelectedItem(null);
      toast.success("تم حذف جميع النتائج السابقة بنجاح");
    } catch (err: any) {
      toast.error(err?.message || "فشل حذف النتائج");
    }
  }, [apiBase, getHeaders, tool, type]);

  const addItem = useCallback((item: any) => {
    const newItem: AIResultCardItem = {
      id: item.image_id || item.video_id || item.id || Date.now(),
      url: item.image_url || item.video_url || item.cloudinary_url || item.url,
      date: item.created_at || new Date().toISOString(),
      prompt: item.prompt,
      is_public: item.is_public || false,
      type,
      raw: item,
    };
    setItems((prev) => [newItem, ...prev]);
  }, [type]);

  return {
    items,
    setItems,
    loading,
    selectedItem,
    setSelectedItem,
    fetchItems,
    deleteItem,
    deleteAll,
    addItem,
  };
}
