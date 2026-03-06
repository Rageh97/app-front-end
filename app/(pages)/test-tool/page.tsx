"use client";

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useMyInfo } from "@/utils/user-info/getUserInfo";
import './test-tool.css';

/**
 * TestToolPage Component - Dynamic Version
 * 
 * Displays all tools activated for the current account.
 * When an extension is detected, it renders buttons for each available tool.
 */
export default function TestToolPage() {
  const { data } = useMyInfo();
  const [detectedExtensions, setDetectedExtensions] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeServer, setActiveServer] = useState<number | null>(null);
  
  // Required extensions info for detection
  const requiredExtensions = new Set(['Nexus Toolz Extension 1', 'Nexus Toolz Extension 2']);

  // Check if all required extensions are detected
  const allExtensionsDetected = detectedExtensions.size === requiredExtensions.size;

  useEffect(() => {
    /**
     * Listener for messages from the browser extensions.
     */
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

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  /**
   * Handle dynamic tool launch
   */
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
        // Broadcast the session to the new extension
        window.postMessage({ type: 'FROM_NT_APP', text: JSON.stringify(res.data) }, "*");
      }
    } catch (err) {
      console.error("Launch Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to get tool info from IDs
  const getToolInfo = (toolId: number) => {
    return data?.toolsData?.find((t: any) => t.tool_id == toolId);
  };

  return (
    <div className="test-tool-body">
      <div className="am-content-page"></div>

      <div className="container">
        {/* Logo and Tag */}
        <div className="logo-container">
          <img src="https://app.nexustoolz.com/theme/img/chatgpt.png" alt="Branding" />
          <span className="tag">Extension</span>
        </div>

        {allExtensionsDetected ? (
          <div className="tools-section" id="toolsSection">
            <div className="header">
              <h2>🛠️ Available Premium Tools (Test Mode)</h2>
              <p>These tools are dynamically loaded from your active subscriptions</p>
            </div>

            <div className="premium-tools-section">
              <h3>🚀 Premium Tools Access</h3>
              <p>Select any tool to test the extension launch</p>

              <div className="button-container">
                {/* 1. Direct Tools */}
                {data?.userToolsData?.map((userTool: any) => {
                  const toolInfo = getToolInfo(userTool.tool_id);
                  if (!toolInfo) return null;

                  return (
                    <button 
                      key={toolInfo.tool_id}
                      className="tool-btn" 
                      disabled={isLoading}
                      onClick={() => handleToolClick(toolInfo.tool_id)}
                    >
                      {isLoading && activeServer === toolInfo.tool_id ? '⏳ Loading...' : toolInfo.tool_name}
                    </button>
                  );
                })}

                {/* 2. Tools from Packs (Flat list) */}
                {data?.userPacksData?.map((up: any) => {
                  const pack = data?.packsData?.find((p: any) => p.pack_id === up.pack_id);
                  if (!pack) return null;
                  
                  try {
                    const toolIds = JSON.parse(pack.pack_tools || "[]");
                    return toolIds.map((tid: number) => {
                      const toolInfo = getToolInfo(tid);
                      if (!toolInfo) return null;
                      return (
                        <button 
                          key={`pack-${tid}`}
                          className="tool-btn" 
                          disabled={isLoading}
                          onClick={() => handleToolClick(toolInfo.tool_id)}
                        >
                          {isLoading && activeServer === toolInfo.tool_id ? '⏳ Loading...' : toolInfo.tool_name}
                        </button>
                      );
                    });
                  } catch (e) { return null; }
                })}
                
                {/* Fallback */}
                {(!data?.userToolsData?.length && !data?.userPacksData?.length) && (
                   <p style={{ gridColumn: '1 / -1', color: '#64748b', padding: '20px' }}>
                     No active tools found for this account. Please activate tools in the admin panel.
                   </p>
                )}
              </div>
            </div>

            <div className="update-info">
              ⏰ Next update in 3 hours - Stay tuned!
            </div>
          </div>
        ) : (
          <div className="extension-message" id="extensionMessage">
            <div className="warning-header">
              <h2>⚠️ Extensions Required</h2>
              <p>Please install both extensions to unlock premium tools</p>
            </div>

            <div className="download-section">
              <h3>📥 Download Extensions</h3>
              <p>Get instant access to all premium features</p>

              <div className="download-buttons">
                <a className="download-btn" href="https://app.nexustoolz.com/content/f/id/5" target="_blank" rel="noopener noreferrer">
                  ⬇️ Extension 1
                </a>
                <a className="download-btn" href="https://app.nexustoolz.com/content/f/id/6" target="_blank" rel="noopener noreferrer">
                  ⬇️ Extension 2
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}