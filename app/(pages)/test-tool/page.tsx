"use client";

import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useMyInfo } from "@/utils/user-info/getUserInfo";
import './test-tool.css';

export default function TestToolPage() {
  const { data } = useMyInfo();
  const [detectedExtensions, setDetectedExtensions] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeServer, setActiveServer] = useState<number | null>(null);
  const [bypass, setBypass] = useState(false);
  const [allMessages, setAllMessages] = useState<any[]>([]);
  
  const requiredExtensions = useMemo(() => ['Nexus Toolz Extension 1', 'Nexus Toolz Extension 2'], []);

  const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  const allExtensionsDetected = bypass || isLocalhost || detectedExtensions.size === requiredExtensions.length;

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // 1. Log for visible debugger
      if (event.data?.type) {
        setAllMessages(prev => [event.data, ...prev].slice(0, 5));
      }

      // 2. Main detection logic
      if (
        event.data?.type === 'EXTENSION_CHECK' && 
        requiredExtensions.includes(event.data.extensionName)
      ) {
        setDetectedExtensions((prev) => {
          const nextSet = new Set(prev);
          nextSet.add(event.data.extensionName);
          return nextSet;
        });
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [requiredExtensions]);

  const handleToolClick = async (toolId: number) => {
    setActiveServer(toolId);
    setIsLoading(true);

    const token = localStorage.getItem("a");
    if (!token) {
      window.location.href = "/signin";
      return;
    }

    let requestData = {
      appId: "wuXQpO8EsheI13FKKNn5p25DY92s6VtL",
      token: token,
      toolId: toolId,
    };

    try {
      const res = await axios.post("https://api.nexustoolz.com/api/user/get-session", requestData, {
        headers: {
          "Content-Type": "application/json",
          "User-Client": (globalThis as any).clientId1328 || "",
        },
      });

      if (res?.status === 200) {
        window.postMessage({ type: 'FROM_NT_APP', text: JSON.stringify(res.data) }, "*");
      }
    } catch (err) {
      console.error("Launch Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const deduplicatedTools = useMemo(() => {
    const toolsMap = new Map();
    data?.userToolsData?.forEach((ut: any) => {
      const toolInfo = data?.toolsData?.find((t: any) => t.tool_id == ut.tool_id);
      if (toolInfo) toolsMap.set(toolInfo.tool_id, toolInfo);
    });
    data?.userPacksData?.forEach((up: any) => {
      const pack = data?.packsData?.find((p: any) => p.pack_id === up.pack_id);
      if (pack) {
        try {
          const packToolIds = JSON.parse(pack.pack_tools || "[]");
          packToolIds.forEach((tid: number) => {
            const toolInfo = data?.toolsData?.find((t: any) => t.tool_id == tid);
            if (toolInfo) toolsMap.set(toolInfo.tool_id, toolInfo);
          });
        } catch (e) {}
      }
    });
    return Array.from(toolsMap.values()).sort((a: any, b: any) => a.tool_name.localeCompare(b.tool_name));
  }, [data]);

  return (
    <div className="test-tool-body">
      <div className="container">
        {/* Debug Panel - Fixed at the bottom */}
        <div style={{ position: 'fixed', bottom: 10, right: 10, background: '#1e293b', color: '#fff', padding: '15px', borderRadius: '10px', fontSize: '11px', zIndex: 9999, border: '1px solid #790003', maxWidth: '300px' }}>
          <h4 style={{ color: '#ef4444', marginBottom: '5px' }}>🚨 Developer Debugger</h4>
          <p>Localhost: {isLocalhost ? '✅' : '❌'}</p>
          <p>Extension 1: {detectedExtensions.has(requiredExtensions[0]) ? '✅' : '⏳ Missing'}</p>
          <p>Extension 2: {detectedExtensions.has(requiredExtensions[1]) ? '✅' : '⏳ Missing'}</p>
          <hr style={{ margin: '5px 0', opacity: 0.2 }} />
          <p>Last Message: {allMessages[0] ? JSON.stringify(allMessages[0]).slice(0, 50) + "..." : 'None'}</p>
          <button 
            onClick={() => setBypass(true)}
            style={{ marginTop: '10px', width: '100%', padding: '5px', background: '#790003', color: '#white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            🔓 Bypass Detection & Show Tools
          </button>
        </div>

        {/* Logo Section */}
        <div className="logo-container">
          <img alt="NexusToolz Logo" src="https://app.nexustoolz.com/theme/img/chatgpt.png" /> 
          <span className="tag">Extension</span>
        </div>

        {allExtensionsDetected ? (
          <div className="tools-section">
            <div className="header">
              <h2>🛠️ Premium Tools (Detected Mode)</h2>
              <p>Testing connection with the session API...</p>
            </div>
            <div className="premium-tools-section">
              <div className="button-container">
                {deduplicatedTools.map((tool: any) => (
                  <button 
                    key={tool.tool_id}
                    className="tool-btn" 
                    onClick={() => handleToolClick(tool.tool_id)}
                  >
                    {isLoading && activeServer === tool.tool_id ? '⏳ Processing...' : tool.tool_name}
                  </button>
                ))}
              </div>
            </div>
            <div className="update-info">⏰ Dynamic Sync Active</div>
          </div>
        ) : (
          <div className="extension-message">
            <div className="warning-header">
              <h2>⚠️ Extension Detection Failed</h2>
              <p>We couldn't detect your extensions on this domain.</p>
            </div>

            <div className="download-section">
              <h3>📥 Download & Re-install</h3>
              <div className="download-buttons">
                <a className="download-btn" href="/Nexustoolz.com.zip" download="Nexustoolz.com.zip">
                  ⬇️ Download NexusToolz.com.zip
                </a>
              </div>
            </div>

            <div className="installation-grid">
               <div className="notes-section">
                <div className="notes-header"><h3>⚙️ Troubleshooting</h3></div>
                <div className="notes-content">
                  <div className="note-item"><span className="note-number">!</span> <span className="note-text">Make sure you are using Chrome or Brave.</span></div>
                  <div className="note-item"><span className="note-number">!</span> <span className="note-text">Ensure 'Developer Mode' is ON.</span></div>
                  <div className="note-item"><span className="note-number">!</span> <span className="note-text">Refresh the page after installing.</span></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}