"use client";

import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useMyInfo } from "@/utils/user-info/getUserInfo";
import AccountSelectionModal from "@/components/Modals/AccountSelectionModal";

export default function TestToolPage() {
  const { data } = useMyInfo();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeServer, setActiveServer] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedToolGroup, setSelectedToolGroup] = useState<any>(null);

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

  const groupedTools = useMemo(() => {
    if (!data?.toolsData) return [];

    const authorizedToolIds = new Set<number>();
    
    data?.userToolsData?.forEach((ut: any) => {
      authorizedToolIds.add(Number(ut.tool_id));
    });
    
    data?.userPacksData?.forEach((up: any) => {
      const pack = data?.packsData?.find((p: any) => p.pack_id === up.pack_id);
      if (pack && pack.pack_tools) {
        try {
          const packToolIds = JSON.parse(pack.pack_tools);
          packToolIds.forEach((tid: number) => {
            authorizedToolIds.add(Number(tid));
          });
        } catch (e) {}
      }
    });

    const toolsMap = new Map<string, any[]>();
    
    data?.toolsData?.forEach((t: any) => {
      if (authorizedToolIds.has(Number(t.tool_id))) {
        const name = t.tool_name.trim();
        if (!toolsMap.has(name)) {
          toolsMap.set(name, []);
        }
        toolsMap.get(name)?.push(t);
      }
    });

    const result = Array.from(toolsMap.entries()).map(([name, accounts]) => {
      return {
        group_name: name,
        accounts: accounts,
        main_tool: accounts[0]
      };
    });

    return result.sort((a, b) => a.group_name.localeCompare(b.group_name));
  }, [data]);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            color: #1e293b;
            line-height: 1.4;
            min-height: 100vh;
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            padding-bottom: 20px;
        }
        
        .container {
            max-width: 900px;
            margin: 0 auto;
            padding: 0.8rem;
        }
        
        .logo-container {
            position: relative;
            width: 250px;
            margin: 0 auto 1rem;
            padding: 1rem;
            border-radius: 10px;
            background: #ffffff;
            box-shadow: 0 4px 15px rgba(121, 0, 3, 0.12);
            border: 2px solid #790003;
            transition: all 0.3s ease;
            text-align: center;
        }
        
        .logo-container img {
            width: 100%;
            height: auto;
            max-height: 80px;
            object-fit: contain;
            border-radius: 6px;
        }
        
        .tag {
            position: absolute;
            top: -6px;
            right: -6px;
            background: #790003;
            color: white;
            padding: 6px 12px;
            border-radius: 15px;
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 0.5px;
            text-transform: uppercase;
            box-shadow: 0 3px 8px rgba(121, 0, 3, 0.3);
            animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
        }
        
        .header {
            text-align: center;
            margin-bottom: 1rem;
            padding: 1rem;
            background: #ffffff;
            border-radius: 10px;
            border: 2px solid #790003;
            box-shadow: 0 3px 12px rgba(121, 0, 3, 0.1);
        }
        
        .header h2 {
            font-size: 18px;
            font-weight: 700;
            color: #790003;
        }
        
        .tools-section {
            margin-bottom: 1.5rem;
        }
        
        .premium-tools-section {
            background: #ffffff;
            border: 2px solid #790003;
            padding: 20px;
            border-radius: 10px;
            margin: 15px 0;
            text-align: center;
            box-shadow: 0 4px 15px rgba(121, 0, 3, 0.12);
        }
        
        .button-container {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-top: 15px;
        }
        
       .tool-btn {
            position: relative;
            padding: 15px 20px;
            border: none;
            border-radius: 10px;
            overflow: hidden; 
            font-weight: 700;
            font-size: 14px;
            cursor: pointer;
            transition: all 0.3s ease;
            background: linear-gradient(135deg, #790003 0%, #660002 100%);
            color: white;
            box-shadow: 0 4px 15px rgba(121, 0, 3, 0.3);
            text-transform: uppercase;
            letter-spacing: 0.8px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            text-align: center;
        }

        .tool-btn:hover {
            border-radius: 10px;
            transform: translateY(-2px) scale(1.02);
            box-shadow: 0 6px 20px rgba(121, 0, 3, 0.4);
            background: linear-gradient(135deg, #660002 0%, #550001 100%);
        }
        
        .update-info {
            background: linear-gradient(135deg, #790003 0%, #660002 100%);
            color: white;
            padding: 12px;
            border-radius: 8px;
            margin: 15px 0;
            text-align: center;
            font-weight: 600;
            font-size: 14px;
            box-shadow: 0 4px 15px rgba(121, 0, 3, 0.3);
        }
        
        .extension-message {
            max-width: 100%;
        }
        
        .warning-header {
            text-align: center;
            margin-bottom: 1rem;
            padding: 1rem;
            background: #ffffff;
            border-radius: 10px;
            border: 2px solid #790003;
        }
        
        .download-section {
            background: #ffffff;
            border: 2px solid #790003;
            padding: 20px;
            border-radius: 10px;
            margin: 15px 0;
            text-align: center;
        }
        
        .download-buttons {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-top: 15px;
        }
        
        .download-btn {
            background: linear-gradient(135deg, #790003 0%, #660002 100%);
            color: white;
            text-decoration: none;
            padding: 12px 20px;
            border-radius: 30px;
            font-weight: 700;
            text-transform: uppercase;
            text-align: center;
            display: block;
        }
        
        .important-notice {
            background: #ffffff;
            border: 2px solid #f59e0b;
            color: #1e293b;
            padding: 15px;
            border-radius: 10px;
            margin: 15px 0;
            font-weight: 600;
            text-align: center;
        }
        
        .installation-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin: 20px 0;
        }
        
        .notes-section {
            border-radius: 10px;
            border: 2px solid #790003;
            background: #ffffff;
            overflow: hidden;
        }
        
        .notes-header {
            padding: 15px;
            background: linear-gradient(135deg, #790003 0%, #660002 100%);
            color: white;
            text-align: center;
        }
        
        .notes-content { padding: 20px; }
        .note-item { display: flex; gap: 12px; padding: 12px 0; border-bottom: 1px solid rgba(121, 0, 3, 0.1); }
        .note-number {
            background: #790003; color: white; width: 24px; height: 24px; border-radius: 5px;
            display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 12px;
        }
        .note-text { color: #475569; font-size: 13px; font-weight: 500; }

        @media (max-width: 768px) {
            .container { padding: 0.6rem; }
            .button-container, .download-buttons, .installation-grid { grid-template-columns: 1fr; }
        }
      ` }} />

      <script dangerouslySetInnerHTML={{ __html: `
        (function() {
            const requiredExtensions = new Set(['Nexus Toolz Extension 1', 'Nexus Toolz Extension 2']);
            const detectedExtensions = new Set();

            function updateUI() {
                const toolsSection = document.getElementById('toolsSection');
                const extensionMessage = document.getElementById('extensionMessage');
                if(!toolsSection || !extensionMessage) return;
                
                if (detectedExtensions.size === requiredExtensions.size) {
                    toolsSection.style.display = 'block';
                    extensionMessage.style.display = 'none';
                } else {
                    toolsSection.style.display = 'none';
                    extensionMessage.style.display = 'block';
                }
            }

            window.addEventListener('message', (event) => {
                console.log('Message Received In Test Tool:', event.data);
                if (event.data && event.data.type === 'EXTENSION_CHECK' && requiredExtensions.has(event.data.extensionName)) {
                    detectedExtensions.add(event.data.extensionName);
                    updateUI();
                }
            });

            // Run updateUI immediately and periodically
            updateUI();
            setInterval(updateUI, 2000); // Polling ensures React re-renders don't break display
        })();
      ` }} />
      <script type="text/am-vars" dangerouslySetInnerHTML={{ __html: `{"script-replaced-_menu-narrow":"1","script-replaced-_menu":"1"}` }} />

      <div className="container">
        <div className="logo-container">
          <img alt="Nexus Tools Logo" src="https://app.nexustoolz.com/theme/img/chatgpt.png" /> 
          <span className="tag">Extension</span>
        </div>

        {/* Tools Section - Start with display: block to match dev's HTML, the script will hide it if needed */}
        <div className="tools-section" id="toolsSection" style={{ display: 'block' }}>
          <div className="header">
            <h2>🛠️ Available Premium Tools</h2>
            <p>Switch servers if any not working or face any limit error</p>
          </div>
          <div className="premium-tools-section">
            <h3>🚀 Premium Tools Access</h3>
            <p>Access all premium tools with unlimited usage</p>
            <div className="button-container">
              {groupedTools.map((group: any) => {
                const tool = group.main_tool;
                const buttonId = tool.tool_name.replace(/[^a-zA-Z0-9]/g, '') + 'Cookies';
                const hasMultiple = group.accounts.length > 1;
                const isGroupLoading = group.accounts.some((acc: any) => acc.tool_id === activeServer);

                return (
                  <button 
                    key={`group-${tool.tool_name}`}
                    className="tool-btn" 
                    id={buttonId}
                    disabled={isLoading}
                    onClick={() => {
                      if (hasMultiple) {
                        setSelectedToolGroup(group);
                        setIsModalOpen(true);
                      } else {
                        handleToolClick(tool.tool_id);
                      }
                    }}
                  >
                    {isLoading && isGroupLoading ? '⏳' : tool.tool_name}
                    {hasMultiple && ` (${group.accounts.length})`}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="update-info">⏰ Next update in 3 hours - Stay tuned!</div>
        </div>

        {/* Extension Required Section - Start with display: none to match dev's HTML behavior */}
        <div className="extension-message" id="extensionMessage" style={{ display: 'none' }}>
          <div className="warning-header">
            <h2>⚠️ Extensions Required</h2>
            <p>Please install both extensions to unlock premium tools</p>
          </div>
          <div className="download-section">
            <h3>📥 Download Extensions</h3>
            <p>Get instant access to all premium features</p>
            <div className="download-buttons">
              <a className="download-btn" href="/Nexustoolz.com.zip" download>⬇️ Extension 1</a> 
              <a className="download-btn" href="/Nexustoolz.com.zip" download>⬇️ Extension 2</a>
            </div>
          </div>
          <div className="important-notice">🔔 <strong>Important:</strong> Remove other extensions or create a new Chrome profile for best performance.</div>
          <div className="installation-grid">
            <div className="notes-section">
              <div className="notes-header"><h3>💻 PC Installation</h3></div>
              <div className="notes-content">
                <div className="note-item"><span className="note-number">1</span> <span className="note-text">📁 Download and Extract both extensions</span></div>
                <div className="note-item"><span className="note-number">2</span> <span className="note-text">🌐 Open <strong>chrome://extensions/</strong></span></div>
                <div className="note-item"><span className="note-number">3</span> <span className="note-text">🔧 Enable <strong>Developer Mode</strong></span></div>
                <div className="note-item"><span className="note-number">4</span> <span className="note-text">📤 Click <strong>Load Unpacked</strong> for each folder</span></div>
                <div className="note-item"><span className="note-number">5</span> <span className="note-text">✅ Boom You are Done!</span></div>
              </div>
            </div>
            <div className="notes-section">
              <div className="notes-header"><h3>📱 Mobile Installation</h3></div>
              <div className="notes-content">
                <div className="note-item"><span className="note-number">1</span> <span className="note-text">📲 Download <strong>Mises Browser</strong></span></div>
                <div className="note-item"><span className="note-number">2</span> <span className="note-text">🔗 Get Mises Browser</span></div>
                <div className="note-item"><span className="note-number">3</span> <span className="note-text">🔧 Enable Developer Mode in browser</span></div>
                <div className="note-item"><span className="note-number">4</span> <span className="note-text">📤 Load both extensions</span></div>
                <div className="note-item"><span className="note-number">5</span> <span className="note-text">🎉 Enjoy!</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AccountSelectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        toolName={selectedToolGroup?.group_name || ""}
        toolImage={selectedToolGroup?.main_tool?.tool_image}
        isLoading={isLoading}
        accounts={selectedToolGroup?.accounts?.map((acc: any, index: number) => ({
          tool_id: acc.tool_id,
          tool_name: acc.tool_name,
          tool_image: acc.tool_image,
          accountIndex: index + 1,
          tag: acc.tool_tag || acc.tag
        })) || []}
        onSelectAccount={(toolId) => {
          setIsModalOpen(false);
          handleToolClick(toolId);
        }}
      />
    </>
  );
}