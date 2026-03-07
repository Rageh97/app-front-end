"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Script from 'next/script';
import axios from 'axios';
import { useMyInfo } from "@/utils/user-info/getUserInfo";
import './test-tool.css';

export default function TestToolPage() {
  const { data } = useMyInfo();
  const [detectedExtensions, setDetectedExtensions] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeServer, setActiveServer] = useState<number | null>(null);
  const [messageLog, setMessageLog] = useState<string[]>([]);
  const [debugMode, setDebugMode] = useState(false);
  
  const requiredExtensions = useMemo(() => new Set(['Nexus Toolz Extension 1', 'Nexus Toolz Extension 2']), []);
  const allExtensionsDetected = (detectedExtensions.size === requiredExtensions.size) || debugMode;

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type) {
        console.log("Incoming Message:", event.data);
        setMessageLog(prev => [`[${new Date().toLocaleTimeString()}] ${JSON.stringify(event.data)}`, ...prev].slice(0, 5));
      }

      if (event.data?.type === 'EXTENSION_CHECK' && requiredExtensions.has(event.data.extensionName)) {
        setDetectedExtensions((prev) => {
          const nextSet = new Set(prev);
          nextSet.add(event.data.extensionName);
          return nextSet;
        });
      }
    };
    window.addEventListener('message', handleMessage);
    const ping = setInterval(() => window.postMessage({ type: 'CHECK_FOR_NT_EXTENSION' }, "*"), 1000);
    return () => { window.removeEventListener('message', handleMessage); clearInterval(ping); };
  }, [requiredExtensions]);

  const handleToolClick = async (toolId: number) => {
    setActiveServer(toolId);
    setIsLoading(true);
    const token = localStorage.getItem("a");
    if (!token) { window.location.href = "/signin"; return; }
    try {
      const res = await axios.post("https://api.nexustoolz.com/api/user/get-session", 
        { appId: "wuXQpO8EsheI13FKKNn5p25DY92s6VtL", token, toolId },
        { headers: { "Content-Type": "application/json", "User-Client": (globalThis as any).clientId1328 || "" } }
      );
      if (res?.status === 200) {
        window.postMessage({ type: 'FROM_NT_APP', text: JSON.stringify(res.data) }, "*");
      }
    } catch (err) { console.error("Launch Error:", err);
    } finally { setIsLoading(false); }
  };

  return (
    <div className="test-tool-body">
      {/* 🛠️ DEBUG OVERLAY */}
      <div style={{ position: 'fixed', bottom: 10, left: 10, right: 10, background: 'rgba(0,0,0,0.9)', color: '#00ff00', padding: '15px', borderRadius: '10px', fontSize: '11px', zIndex: 10000, border: '1px solid #790003' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
           <strong>🔍 DEBUG: EXTENSION SIGNALS</strong>
           <button 
             onClick={() => setDebugMode(!debugMode)}
             style={{ background: debugMode ? '#22c55e' : '#790003', color: 'white', border: 'none', padding: '2px 8px', borderRadius: '4px', cursor: 'pointer' }}
           >
             {debugMode ? 'BYPASS ACTIVE' : 'FORCE BYPASS DETECTION'}
           </button>
        </div>
        <div style={{ background: '#111', padding: '8px', minHeight: '60px', borderRadius: '4px' }}>
          {messageLog.map((log, i) => <div key={i}>{log}</div>)}
          {messageLog.length === 0 && <div style={{ color: '#555' }}>No messages detected yet...</div>}
        </div>
      </div>
      {/* MIMIC PHP ENVIRONMENT FOR THE EXTENSION */}
      <div dangerouslySetInnerHTML={{ __html: `
        <script id="am-vars-script" type="text/am-vars">{"script-replaced-_menu-narrow":"1","script-replaced-_menu":"1"}</script>
        <script>window.NT_PANEL_VERSION = "6.0.2";</script>
      `}} />

      <div className="container">
        <div className="logo-container">
          <img alt="Nexus Tools Logo" src="https://app.nexustoolz.com/theme/img/chatgpt.png" />
          <span className="tag">Extension</span>
        </div>

        {/* 
            ALWAYS RENDER TOOLS IN HIDDEN DIV TO TRIGGER EXTENSION CONTENT SCRIPT 
            Some extensions wait for specific IDs like "ChatgptCookies" to exist.
        */}
        <div id="detection-trigger" style={{ height: '1px', overflow: 'hidden', opacity: 0 }}>
             <button id="ChatgptCookies">Trigger 1</button>
             <button id="Chatgpt2Cookies">Trigger 2</button>
             <button id="chatgptCookies">Trigger 3</button>
        </div>

        {allExtensionsDetected ? (
          <div className="tools-section">
            <div className="header">
              <h2>🛠️ Available Premium Tools</h2>
              <p>Extension Detected Successfully!</p>
            </div>
            <div className="premium-tools-section">
              <div className="button-container">
                <button className="tool-btn" onClick={() => handleToolClick(44)}>Chatgpt Server 1</button>
                <button className="tool-btn" onClick={() => handleToolClick(44)}>Chatgpt Server 2</button>
              </div>
            </div>
          </div>
        ) : (
          <div className="extension-message">
            <div className="warning-header">
              <h2>⚠️ Extensions Required</h2>
              <p>Please install both extensions to unlock tools</p>
            </div>
            <div className="download-section">
              <div className="download-buttons">
                <a className="download-btn" href="/Nexustoolz.com.zip" download>⬇️ Extension 1</a>
                <a className="download-btn" href="/Nexustoolz.com.zip" download>⬇️ Extension 2</a>
              </div>
            </div>
            {/* INVISIBLE TRIGGER BUTTONS FOR EXTENSION SCANNING */}
            <div style={{ opacity: 0.01, pointerEvents: 'none' }}>
               <button id="chatgpt1Cookies">Scan</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}