"use client";

import React, { useState, useMemo } from 'react';
import axios from 'axios';
import { useMyInfo } from "@/utils/user-info/getUserInfo";
import './test-tool.css';

export default function TestToolPage() {
  const { data } = useMyInfo();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeServer, setActiveServer] = useState<number | null>(null);
  const [detectedCount, setDetectedCount] = useState(0);

  // Sync React state with the "Native Script" results
  // This allows us to use the developer's native script but still react in our React UI
  React.useEffect(() => {
    const checkDetection = setInterval(() => {
        const count = (window as any).detectedExtensionsCount || 0;
        if (count !== detectedCount) {
            setDetectedCount(count);
        }
    }, 500);
    return () => clearInterval(checkDetection);
  }, [detectedCount]);

  const handleToolClick = async (toolId: number) => {
    setActiveServer(toolId);
    setIsLoading(true);
    const token = localStorage.getItem("a");
    if (!token) {
      window.location.href = "/signin";
      return;
    }
    try {
      const res = await axios.post("https://api.nexustoolz.com/api/user/get-session", {
        appId: "wuXQpO8EsheI13FKKNn5p25DY92s6VtL",
        token: token,
        toolId: toolId,
      }, {
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
      {/* 
        NATIVE SCRIPT INJECTION: 
        This is exactly what the developer wants to see in the HTML source.
      */}
      <div dangerouslySetInnerHTML={{ __html: `
        <script>
            (function() {
                const requiredExtensions = new Set(['Nexus Toolz Extension 1', 'Nexus Toolz Extension 2']);
                const detectedExtensions = new Set();
                window.detectedExtensionsCount = 0;

                function updateUI() {
                    const toolsSection = document.getElementById('toolsSection');
                    const extensionMessage = document.getElementById('extensionMessage');
                    if (!toolsSection || !extensionMessage) return;

                    if (detectedExtensions.size === requiredExtensions.size) {
                        toolsSection.style.display = 'block';
                        extensionMessage.style.display = 'none';
                        window.detectedExtensionsCount = detectedExtensions.size;
                    } else {
                        toolsSection.style.display = 'none';
                        extensionMessage.style.display = 'block';
                        window.detectedExtensionsCount = detectedExtensions.size;
                    }
                }

                window.addEventListener('message', function(event) {
                    if (event.data && event.data.type === 'EXTENSION_CHECK' && requiredExtensions.has(event.data.extensionName)) {
                        detectedExtensions.add(event.data.extensionName);
                        updateUI();
                    }
                });

                // Periodic check to ensure visibility is correct
                setInterval(updateUI, 1000);
            })();
        </script>
        <script type="text/am-vars">{"script-replaced-_menu-narrow":"1","script-replaced-_menu":"1"}</script>
      `}} />

      <div className="container">
        <div className="logo-container">
          <img alt="Nexus Tools Logo" src="https://app.nexustoolz.com/theme/img/chatgpt.png" />
          <span className="tag">Extension</span>
        </div>

        {/* 
            Notice: Both sections are rendered in the DOM always. 
            Display is controlled by IDs and Inline Styles for the extension to touch.
        */}
        
        {/* Tools Section */}
        <div className="tools-section" id="toolsSection" style={{ display: 'none' }}>
          <div className="header">
            <h2>🛠️ Available Premium Tools</h2>
            <p>Switch servers if any not working or face any limit error</p>
          </div>
          <div className="premium-tools-section">
            <h3>🚀 Premium Tools Access</h3>
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
            </div>
          </div>
          <div className="update-info">⏰ Next update in 3 hours - Stay tuned!</div>
        </div>

        {/* Extension Required Section */}
        <div className="extension-message" id="extensionMessage" style={{ display: 'block' }}>
          <div className="warning-header">
            <h2>⚠️ Extensions Required</h2>
            <p>Please install both extensions to unlock premium tools</p>
          </div>
          <div className="download-section">
            <div className="download-buttons">
              <a className="download-btn" href="/Nexustoolz.com.zip" download>⬇️ Extension 1</a>
              <a className="download-btn" href="/Nexustoolz.com.zip" download>⬇️ Extension 2</a>
            </div>
          </div>
          
          <div className="installation-grid">
            <div className="notes-section">
               <div className="notes-header"><h3>💻 PC Installation</h3></div>
               <div className="notes-content">
                  <p className="note-text">1. Download and Extract</p>
                  <p className="note-text">2. Open chrome://extensions/</p>
                  <p className="note-text">3. Load Unpacked</p>
               </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}