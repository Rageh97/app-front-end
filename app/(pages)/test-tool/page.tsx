"use client";

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useMyInfo } from "@/utils/user-info/getUserInfo";
import './test-tool.css';

/**
 * TestToolPage Component - Dynamic & Deduplicated Tools
 */
export default function TestToolPage() {
  const { data } = useMyInfo();
  const [detectedExtensions, setDetectedExtensions] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeServer, setActiveServer] = useState<number | null>(null);
  
  const requiredExtensions = new Set(['Nexus Toolz Extension 1', 'Nexus Toolz Extension 2']);

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
  }, []);

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
  const getDeduplicatedTools = () => {
    const toolsMap = new Map();

    // 1. Add tools from individual subscriptions
    data?.userToolsData?.forEach((ut: any) => {
      const toolInfo = data?.toolsData?.find((t: any) => t.tool_id == ut.tool_id);
      if (toolInfo) {
        toolsMap.set(toolInfo.tool_id, toolInfo);
      }
    });

    // 2. Add tools from packs
    data?.userPacksData?.forEach((up: any) => {
      const pack = data?.packsData?.find((p: any) => p.pack_id === up.pack_id);
      if (pack) {
        try {
          const packToolIds = JSON.parse(pack.pack_tools || "[]");
          packToolIds.forEach((tid: number) => {
            const toolInfo = data?.toolsData?.find((t: any) => t.tool_id == tid);
            if (toolInfo) {
              toolsMap.set(toolInfo.tool_id, toolInfo);
            }
          });
        } catch (e) {}
      }
    });

    return Array.from(toolsMap.values()).sort((a: any, b: any) => a.tool_name.localeCompare(b.tool_name));
  };

  const deduplicatedTools = getDeduplicatedTools();

  return (
    <div className="test-tool-body">
      <div className="am-content-page"></div>

      <div className="container">
        <div className="logo-container">
          <img src="https://app.nexustoolz.com/theme/img/chatgpt.png" alt="Branding" />
          <span className="tag" style={{ background: '#22c55e' }}>BYPASS MODE</span>
        </div>

        <div className="tools-section" id="toolsSection">
          <div className="header">
            <h2>🛠️ Developer Test Environment</h2>
            <p>Select any tool to test the extension launch logic.</p>
            <p style={{ fontSize: '12px', color: '#64748b', marginTop: '5px' }}>
              Status: {detectedExtensions.size > 0 ? '✅ Extension Detected' : '⏳ Waiting for Extension...'}
            </p>
          </div>

          <div className="premium-tools-section">
            <h3>🚀 Your Active Tools</h3>

            <div className="button-container">
              {deduplicatedTools.map((tool: any) => (
                <button 
                  key={tool.tool_id}
                  className="tool-btn" 
                  disabled={isLoading}
                  onClick={() => handleToolClick(tool.tool_id)}
                >
                  {isLoading && activeServer === tool.tool_id ? '⏳ Loading...' : tool.tool_name}
                </button>
              ))}

              {deduplicatedTools.length === 0 && (
                 <p style={{ gridColumn: '1 / -1', color: '#ef4444', padding: '20px', fontWeight: 'bold' }}>
                   ❌ No active tools found for this account.
                 </p>
              )}
            </div>
          </div>

          {/* <div className="update-info" style={{ background: '#334155' }}>
            💡 Next update in 3 hours - Stay tuned!
          </div> */}
        </div>
      </div>
    </div>
  );
}