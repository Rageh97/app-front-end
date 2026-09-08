'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import FingerprintJS from '@fingerprintjs/fingerprintjs';
import toast from 'react-hot-toast';
import { useSpacesStore } from '@/stores/spacesStore';
import { LogsDrawer } from './LogsDrawer';
import { ResultPreviewModal } from './ResultPreviewModal';
import { SpacesCanvas } from './SpacesCanvas';
import { SpacesToolbar } from './SpacesToolbar';
import { SpacesTopBar } from './SpacesTopBar';
import { TemplatesPanel } from './TemplatesPanel';

interface SpacesEditorProps {
  spaceId: string;
}

export const SpacesEditor: React.FC<SpacesEditorProps> = ({ spaceId }) => {
  const router = useRouter();
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [isLogsOpen, setIsLogsOpen] = useState(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const loadedIdRef = useRef<string | null>(null);
  const apiBase = useMemo(() => process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001', []);
  const {
    hasHydrated,
    workflowId,
    workflowName,
    nodes,
    edges,
    openWorkflow,
    saveWorkflow,
  } = useSpacesStore();

  useEffect(() => {
    document.title = `${workflowName || 'Spaces'} | NEXUS`;
  }, [workflowName]);

  useEffect(() => {
    if (!hasHydrated || loadedIdRef.current === spaceId) return;
    if (workflowId !== spaceId && !openWorkflow(spaceId)) {
      toast.error('لم نتمكن من العثور على هذه المساحة');
      router.replace('/ai/spaces');
      return;
    }
    loadedIdRef.current = spaceId;
  }, [hasHydrated, openWorkflow, router, spaceId, workflowId]);

  useEffect(() => {
    if (!hasHydrated || loadedIdRef.current !== spaceId || workflowId !== spaceId) return;
    const timer = window.setTimeout(() => {
      void saveWorkflow();
    }, 700);
    return () => window.clearTimeout(timer);
  }, [edges, hasHydrated, nodes, saveWorkflow, spaceId, workflowId, workflowName]);

  useEffect(() => () => {
    if (useSpacesStore.getState().workflowId === spaceId) {
      void useSpacesStore.getState().saveWorkflow();
    }
  }, [spaceId]);

  useEffect(() => {
    const initFingerprint = async () => {
      try {
        if (!(global as any)?.clientId1328) {
          const fp = await FingerprintJS.load();
          const result = await fp.get();
          (global as any).clientId1328 = result.visitorId;
          localStorage.setItem('clientId1328', result.visitorId);
        }
      } catch (error) {
        console.error('Failed to initialize FingerprintJS', error);
      }
    };
    void initFingerprint();
  }, []);

  if (!hasHydrated || (workflowId !== spaceId && loadedIdRef.current !== spaceId)) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#04060c] text-sm text-gray-500" dir="rtl">
        جاري فتح المساحة...
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen select-none flex-col overflow-hidden bg-[#04060c] font-sans text-white" dir="rtl">
      <SpacesTopBar
        onOpenTemplates={() => setIsTemplatesOpen(true)}
        onOpenLibrary={() => setIsLibraryOpen(true)}
        onToggleLogs={() => setIsLogsOpen((value) => !value)}
        isLogsOpen={isLogsOpen}
        apiBase={apiBase}
      />

      <main className="relative min-h-0 flex-1 overflow-hidden">
        <SpacesCanvas onOpenLibrary={() => setIsLibraryOpen(true)} />
        {isLibraryOpen && (
          <button
            type="button"
            aria-label="إغلاق مكتبة الأدوات"
            onClick={() => setIsLibraryOpen(false)}
            className="absolute inset-0 z-20 bg-black/20 md:hidden"
          />
        )}
        <SpacesToolbar isOpen={isLibraryOpen} onClose={() => setIsLibraryOpen(false)} />
      </main>

      <TemplatesPanel isOpen={isTemplatesOpen} onClose={() => setIsTemplatesOpen(false)} />
      <LogsDrawer isOpen={isLogsOpen} onClose={() => setIsLogsOpen(false)} />
      <ResultPreviewModal />
    </div>
  );
};
