"use client";

import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useMyInfo } from "@/utils/user-info/getUserInfo";

/**
 * TestToolPage - Using Developer's EXACT HTML/CSS/JS structure
 */
export default function TestToolPage() {
  const { data } = useMyInfo();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeServer, setActiveServer] = useState<number | null>(null);

  /**
   * Launch tool logic - specific to toolId 44 (ChatGPT) for the dev buttons,
   * or dynamic for others.
   */
  const handleToolClick = async (toolId: number, serverName: string) => {
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

  /**
   * Deduplicate tools from all sources
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
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            color: #1e293b; line-height: 1.4; min-height: 100vh;
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); padding-bottom: 20px;
        }
        .container { max-width: 900px; margin: 0 auto; padding: 0.8rem; }
        .logo-container {
            position: relative; width: 250px; margin: 0 auto 1rem; padding: 1rem;
            border-radius: 10px; background: #ffffff;
            box-shadow: 0 4px 15px rgba(121, 0, 3, 0.12); border: 2px solid #790003;
            transition: all 0.3s ease; text-align: center;
        }
        .logo-container img { width: 100%; height: auto; max-height: 80px; object-fit: contain; border-radius: 6px; }
        .tag {
            position: absolute; top: -6px; right: -6px; background: #790003; color: white;
            padding: 6px 12px; border-radius: 15px; font-size: 10px; font-weight: 700;
            text-transform: uppercase; box-shadow: 0 3px 8px rgba(121, 0, 3, 0.3);
            animation: pulse 2s infinite;
        }
        @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
        .header {
            text-align: center; margin-bottom: 1rem; padding: 1rem; background: #ffffff;
            border-radius: 10px; border: 2px solid #790003; box-shadow: 0 3px 12px rgba(121, 0, 3, 0.1);
        }
        .header h2 { font-size: 18px; font-weight: 700; color: #790003; }
        .tools-section { margin-bottom: 1.5rem; }
        .premium-tools-section {
            background: #ffffff; border: 2px solid #790003; padding: 20px;
            border-radius: 10px; margin: 15px 0; text-align: center;
            box-shadow: 0 4px 15px rgba(121, 0, 3, 0.12);
        }
        .button-container { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 15px; }
        .tool-btn {
            position: relative; padding: 15px 20px; border: none; border-radius: 10px;
            font-weight: 700; font-size: 14px; cursor: pointer; transition: all 0.3s ease;
            background: linear-gradient(135deg, #790003 0%, #660002 100%); color: white;
            box-shadow: 0 4px 15px rgba(121, 0, 3, 0.3); text-transform: uppercase;
        }
        .tool-btn:hover { transform: translateY(-2px) scale(1.02); background: linear-gradient(135deg, #660002 0%, #550001 100%); }
        .update-info {
            background: linear-gradient(135deg, #790003 0%, #660002 100%); color: white;
            padding: 12px; border-radius: 8px; margin: 15px 0; text-align: center;
            font-weight: 600; font-size: 14px;
        }
        .extension-message { max-width: 100%; }
        .warning-header {
            text-align: center; margin-bottom: 1rem; padding: 1rem; background: #ffffff;
            border-radius: 10px; border: 2px solid #790003;
        }
        .download-btn {
            background: linear-gradient(135deg, #790003 0%, #660002 100%); color: white;
            text-decoration: none; padding: 12px 20px; border-radius: 30px; font-weight: 700;
            display: inline-block; text-align: center;
        }
        .installation-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
        .notes-section { border-radius: 10px; border: 2px solid #790003; background: #ffffff; overflow: hidden; }
        .notes-header { padding: 15px; background: linear-gradient(135deg, #790003 0%, #660002 100%); color: white; }
        .note-item { display: flex; gap: 12px; padding: 12px 10px; border-bottom: 1px solid rgba(121,0,3,0.1); }
        .note-number { background: #790003; color: white; width: 24px; height: 24px; border-radius: 5px; display: flex; align-items: center; justify-content: center; font-size: 12px; }
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
            window.addEventListener('message', function(event) {
                if (event.data && event.data.type === 'EXTENSION_CHECK' && requiredExtensions.has(event.data.extensionName)) {
                    detectedExtensions.add(event.data.extensionName);
                    updateUI();
                }
            });
            updateUI();
            setTimeout(updateUI, 3000);
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
              {/* Force mapping of active tools to their buttons */}
              {deduplicatedTools.map((tool: any) => (
                <button 
                  key={tool.tool_id}
                  className="tool-btn" 
                  id={`btn-${tool.tool_id}`}
                  onClick={() => handleToolClick(tool.tool_id, tool.tool_name)}
                >
                  {isLoading && activeServer === tool.tool_id ? '⏳ ...' : tool.tool_name}
                </button>
              ))}
              {deduplicatedTools.length === 0 && (
                <div style={{color: '#790003', padding: '10px'}}>No active tools found.</div>
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
          <div className="download-section" style={{background: '#fff', border: '2px solid #790003', padding: '20px', borderRadius: '10px', textAlign: 'center'}}>
            <h3>📥 Download Extensions</h3>
            <div className="download-buttons" style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '15px'}}>
              <a className="download-btn" href="/Nexustoolz.com.zip" download>⬇️ Extension 1</a>
              <a className="download-btn" href="/Nexustoolz.com.zip" download>⬇️ Extension 2</a>
            </div>
          </div>
          <div className="important-notice" style={{marginTop: '15px', padding: '15px', border: '2px solid #f59e0b', borderRadius: '10px', background: '#fff', fontWeight: 'bold', textAlign: 'center'}}>
            🔔 Important: Remove other extensions for best performance.
          </div>
          <div className="installation-grid">
            <div className="notes-section">
              <div className="notes-header"><h3>💻 PC Installation</h3></div>
              <div className="notes-content">
                <div className="note-item"><span className="note-number">1</span> <span className="note-text">Download and Extract</span></div>
                <div className="note-item"><span className="note-number">2</span> <span className="note-text">chrome://extensions/</span></div>
                <div className="note-item"><span className="note-number">3</span> <span className="note-text">Load Unpacked</span></div>
              </div>
            </div>
            <div className="notes-section">
              <div className="notes-header"><h3>📱 Mobile Installation</h3></div>
              <div className="notes-content">
                <div className="note-item"><span className="note-number">1</span> <span className="note-text">Mises Browser</span></div>
                <div className="note-item"><span className="note-number">2</span> <span className="note-text">Install Extensions</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}