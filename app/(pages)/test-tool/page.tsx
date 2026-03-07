"use client";

import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useMyInfo } from "@/utils/user-info/getUserInfo";
import './test-tool.css';

/**
 * TestToolPage Component - Updated with Developer's HTML structure and Dynamic logic
 */
export default function TestToolPage() {
  const { data } = useMyInfo();
  const [detectedExtensions, setDetectedExtensions] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeServer, setActiveServer] = useState<number | null>(null);
  
  const requiredExtensions = useMemo(() => new Set(['Nexus Toolz Extension 1', 'Nexus Toolz Extension 2']), []);

  const allExtensionsDetected = detectedExtensions.size === requiredExtensions.size;

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (
        event.data?.type === 'EXTENSION_CHECK' && 
        requiredExtensions.has(event.data.extensionName)
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

  /**
   * Deduplicate Tools from all sources (Individual + Packs)
   */
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
      <div className="am-content-page"></div>

      <div className="container">
        {/* Logo Section */}
        <div className="logo-container">
          <img alt="NexusToolz Logo" src="https://app.nexustoolz.com/theme/img/chatgpt.png" /> 
          <span className="tag">Extension</span>
        </div>

        {/* Conditional Rendering Based on Detection */}
        {allExtensionsDetected ? (
          /* Tools Section */
          <div className="tools-section" id="toolsSection">
            <div className="header">
              <h2>🛠️ Available Premium Tools</h2>
              <p>Switch servers if any not working or face any limit error</p>
            </div>

            <div className="premium-tools-section">
              <h3>🚀 Premium Tools Access</h3>
              <p>Access all premium tools of NexusToolz</p>

              <div className="button-container">
                {deduplicatedTools.map((tool: any) => (
                  <button 
                    key={tool.tool_id}
                    className="tool-btn" 
                    id={`tool-${tool.tool_id}`}
                    disabled={isLoading}
                    onClick={() => handleToolClick(tool.tool_id)}
                  >
                    {isLoading && activeServer === tool.tool_id ? '⏳ Loading...' : tool.tool_name}
                  </button>
                ))}

                {deduplicatedTools.length === 0 && (
                   <p style={{ gridColumn: '1 / -1', color: '#64748b', padding: '10px' }}>
                     No active tools found.
                   </p>
                )}
              </div>
            </div>

            <div className="update-info">⏰ Next update in 3 hours - Stay tuned!</div>
          </div>
        ) : (
          /* Extension Message Section with Instructions */
          <div className="extension-message" id="extensionMessage">
            <div className="warning-header">
              <h2>⚠️ Extensions Required</h2>
              <p>Please install both extensions to unlock premium tools</p>
            </div>

            <div className="download-section">
              <h3>📥 Download Extensions</h3>
              <p>Get instant access to all premium features</p>
              <div className="download-buttons">
                <a className="download-btn" href="/Nexustoolz.com.zip" download="Nexustoolz.com.zip">
                  ⬇️ Extension 1
                </a>
                <a className="download-btn" href="/Nexustoolz.com.zip" download="Nexustoolz.com.zip">
                  ⬇️ Extension 2
                </a>
              </div>
            </div>

            <div className="important-notice">
              🔔 <strong>Important:</strong> Remove other extensions or create a new Chrome profile for best performance.
            </div>

            {/* Installation Grid */}
            <div className="installation-grid">
              {/* PC Column */}
              <div className="notes-section">
                <div className="notes-header">
                  <h3>💻 PC Installation</h3>
                </div>
                <div className="notes-content">
                  <div className="note-item"><span className="note-number">1</span> <span className="note-text">📁 Download and Extract both extensions</span></div>
                  <div className="note-item"><span className="note-number">2</span> <span className="note-text">🌐 Open <strong>chrome://extensions/</strong></span></div>
                  <div className="note-item"><span className="note-number">3</span> <span className="note-text">🔧 Enable <strong>Developer Mode</strong></span></div>
                  <div className="note-item"><span className="note-number">4</span> <span className="note-text">📤 Click <strong>Load Unpacked</strong> for each folder</span></div>
                  <div className="note-item"><span className="note-number">5</span> <span className="note-text">✅ Boom You are Done! <a href="https://www.youtube.com/watch?v=WIaR5qzcr4Q" target="_blank" rel="noopener noreferrer" style={{color: '#1e40af', fontWeight: 'bold'}}>Watch Tutorial</a></span></div>
                </div>
              </div>

              {/* Mobile Column */}
              <div className="notes-section">
                <div className="notes-header">
                  <h3>📱 Mobile Installation</h3>
                </div>
                <div className="notes-content">
                  <div className="note-item"><span className="note-number">1</span> <span className="note-text">� Download <strong>Mises Browser</strong></span></div>
                  <div className="note-item"><span className="note-number">2</span> <span className="note-text">🔗 <a href="https://play.google.com/store/apps/details?id=site.mises.browser" target="_blank" rel="noopener noreferrer" style={{color: '#1e40af', fontWeight: 'bold'}}>Get Mises Browser</a></span></div>
                  <div className="note-item"><span className="note-number">3</span> <span className="note-text">🔧 Enable Developer Mode in browser</span></div>
                  <div className="note-item"><span className="note-number">4</span> <span className="note-text">📤 Load both extensions</span></div>
                  <div className="note-item"><span className="note-number">5</span> <span className="note-text">🎉 Enjoy! <a href="#" target="_blank" rel="noopener noreferrer" style={{color: '#1e40af', fontWeight: 'bold'}}>Watch Mobile Guide</a></span></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}