"use client";

import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useMyInfo } from "@/utils/user-info/getUserInfo";

export default function TestToolPage() {
  const { data } = useMyInfo();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeServer, setActiveServer] = useState<number | null>(null);

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
        
        .logo-container:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(121, 0, 3, 0.2);
        }
        
        .logo-container img {
            width: 100%;
            height: auto;
            max-height: 80px;
            object-fit: contain;
            border-radius: 6px;
        }
        
        .logo-container h1 {
            font-size: 20px;
            color: #790003;
            font-weight: 700;
            margin-bottom: 0.3rem;
            letter-spacing: 0.5px;
        }
        
        .logo-container p {
            color: #475569;
            font-size: 13px;
            font-weight: 500;
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
            margin-bottom: 0.3rem;
            letter-spacing: 0.3px;
        }
        
        .header p {
            color: #475569;
            font-size: 14px;
            font-weight: 500;
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
        
        .premium-tools-section h3 {
            color: #790003;
            font-size: 18px;
            margin-bottom: 10px;
            font-weight: 700;
        }
        
        .premium-tools-section p {
            color: #475569;
            margin-bottom: 15px;
            font-size: 14px;
            font-weight: 500;
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
        
        .tool-btn::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
            transition: left 0.4s;
        }
        
        .tool-btn:hover::before {
            left: 100%;
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
            box-shadow: 0 3px 12px rgba(121, 0, 3, 0.1);
        }
        
        .warning-header h2 {
            font-size: 18px;
            color: #790003;
            margin-bottom: 0.3rem;
            font-weight: 700;
        }
        
        .warning-header p {
            color: #475569;
            font-size: 14px;
            font-weight: 500;
        }
        
        .download-section {
            background: #ffffff;
            border: 2px solid #790003;
            padding: 20px;
            border-radius: 10px;
            margin: 15px 0;
            text-align: center;
            box-shadow: 0 4px 15px rgba(121, 0, 3, 0.12);
        }
        
        .download-section h3 {
            color: #790003;
            font-size: 18px;
            margin-bottom: 10px;
            font-weight: 700;
        }
        
        .download-section p {
            color: #475569;
            margin-bottom: 15px;
            font-size: 14px;
            font-weight: 500;
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
            transition: all 0.3s ease;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            box-shadow: 0 3px 12px rgba(121, 0, 3, 0.3);
            font-size: 13px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            text-align: center;
        }
        
        .download-btn:hover {
            background: linear-gradient(135deg, #660002 0%, #550001 100%);
            transform: translateY(-1px);
            box-shadow: 0 6px 18px rgba(121, 0, 3, 0.4);
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
            box-shadow: 0 4px 15px rgba(245, 158, 11, 0.12);
            font-size: 14px;
        }
        
        .installation-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin: 20px 0;
            align-items: start;
        }
        
        .notes-section {
            border-radius: 10px;
            box-shadow: 0 4px 15px rgba(121, 0, 3, 0.15);
            overflow: hidden;
            border: 2px solid #790003;
            background: #ffffff;
            height: 100%;
            display: flex;
            flex-direction: column;
        }
        
        .notes-header {
            padding: 15px;
            background: linear-gradient(135deg, #790003 0%, #660002 100%);
            position: relative;
            overflow: hidden;
            flex-shrink: 0;
        }
        
        .notes-header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.1) 50%, transparent 70%);
            animation: shimmer 3s infinite;
        }
        
        @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
        }
        
        .notes-header h3 {
            font-size: 16px;
            font-weight: 700;
            color: white;
            text-align: center;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            position: relative;
            z-index: 1;
        }
        
        .notes-content {
            padding: 20px;
            background: #ffffff;
            flex-grow: 1;
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
        }
        
        .note-item {
            display: flex;
            gap: 12px;
            padding: 12px 0;
            border-bottom: 1px solid rgba(121, 0, 3, 0.1);
            align-items: flex-start;
            transition: all 0.3s ease;
        }
        
        .note-item:last-child {
            border-bottom: none;
        }
        
        .note-item:hover {
            background: rgba(121, 0, 3, 0.03);
            border-radius: 6px;
            padding-left: 6px;
            margin: 0 -6px;
            transform: translateX(2px);
        }
        
        .note-number {
            background: linear-gradient(135deg, #790003 0%, #660002 100%);
            color: white;
            width: 24px;
            height: 24px;
            border-radius: 5px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            flex-shrink: 0;
            box-shadow: 0 2px 6px rgba(121, 0, 3, 0.25);
            font-size: 12px;
            transition: all 0.3s ease;
        }
        
        .note-text {
            color: #475569;
            font-size: 13px;
            line-height: 1.5;
            font-weight: 500;
        }
        
        .note-text a {
            color: #1e40af;
            text-decoration: none;
            font-weight: 600;
            transition: all 0.3s ease;
        }
        
        @media (max-width: 768px) {
            .container {
                padding: 0.6rem;
            }
            .logo-container {
                width: 200px;
            }
            .button-container, .download-buttons, .installation-grid {
                grid-template-columns: 1fr;
            }
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

            const handleRawMessage = (event) => {
                // DEBUG: Log all incoming messages for easy inspection
                console.log('--- Incoming Message ---', event.data);
                
                let msg = event.data;

                // Attempt to parse if it's a string
                if (typeof msg === 'string') {
                    try {
                        msg = JSON.parse(msg);
                    } catch (e) {
                        // Not a JSON string, ignore
                        console.log('Message is a string but not JSON:', event.data);
                        return;
                    }
                }

                if (
                    msg &&
                    msg.type === 'EXTENSION_CHECK' && 
                    requiredExtensions.has(msg.extensionName)
                ) {
                    if (!detectedExtensions.has(msg.extensionName)) {
                        detectedExtensions.add(msg.extensionName);
                        console.log('Detection Success:', msg.extensionName);
                        updateUI(); // Update UI immediately on new detection
                    }
                }
            };

            window.addEventListener('message', handleRawMessage, true);
            
            const pingInterval = setInterval(() => {
                window.postMessage({ type: 'CHECK_FOR_NT_EXTENSION' }, "*");
            }, 2000);

            // Initial check and cleanup on unload
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', updateUI);
            } else {
                updateUI();
            }

            // Cleanup on page unload
            window.addEventListener('beforeunload', () => {
                window.removeEventListener('message', handleRawMessage, true);
                clearInterval(pingInterval);
            });
        })();
      ` }} />
      <script type="text/am-vars" dangerouslySetInnerHTML={{ __html: `{"script-replaced-_menu-narrow":"1","script-replaced-_menu":"1"}` }} />

      <div className="container">
        <div className="logo-container">
          <img alt="Nexus Tools Logo" src="https://app.nexustoolz.com/theme/img/chatgpt.png" /> 
          <span className="tag">Extension</span>
        </div>

        <div className="tools-section" id="toolsSection" style={{ display: 'none' }}>
          <div className="header">
            <h2>🛠️ Available Premium Tools</h2>
            <p>Switch servers if any not working or face any limit error</p>
          </div>
          <div className="premium-tools-section">
            <h3>🚀 Premium Tools Access</h3>
            <p>Access all premium tools with unlimited usage</p>
            <div className="button-container">
              {deduplicatedTools.map((tool: any) => (
                <button 
                  key={tool.tool_id}
                  className="tool-btn" 
                  disabled={isLoading}
                  onClick={() => handleToolClick(tool.tool_id)}
                >
                  {isLoading && activeServer === tool.tool_id ? '⏳' : tool.tool_name}
                </button>
              ))}
              {deduplicatedTools.length === 0 && (
                <div style={{gridColumn: '1/-1', color: '#790003'}}>No active tools for this account.</div>
              )}
            </div>
          </div>
          <div className="update-info">⏰ Next update in 3 hours - Stay tuned!</div>
        </div>

        <div className="extension-message" id="extensionMessage" style={{ display: 'block' }}>
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
    </>
  );
}