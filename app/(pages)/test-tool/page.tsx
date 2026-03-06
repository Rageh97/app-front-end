"use client";

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './test-tool.css';

/**
 * TestToolPage Component
 * 
 * This page displays premium tools access. It requires specific browser extensions
 * to be installed and detected via message passing.
 */
export default function TestToolPage() {
  const [detectedExtensions, setDetectedExtensions] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeServer, setActiveServer] = useState<string | null>(null);
  
  // Logic: List of required extensions to unlock the tools
  const requiredExtensions = new Set(['Nexus Toolz Extension 1', 'Nexus Toolz Extension 2']);

  // UI state: Show tools only if all required extensions are detected
  const allExtensionsDetected = detectedExtensions.size === requiredExtensions.size;

  useEffect(() => {
    /**
     * Listener for messages from the browser extensions.
     * Extensions send a 'EXTENSION_CHECK' message with their name.
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

    // Mimic the original script's fallback or delay logic if necessary
    const timeout = setTimeout(() => {
      // The state-driven UI will re-render automatically, 
      // but we keep this here to match the original logic execution flow.
    }, 3000);

    return () => {
      window.removeEventListener('message', handleMessage);
      clearTimeout(timeout);
    };
  }, []);

  /**
   * Launch tool by fetching session from API and sending to extension via postMessage.
   */
  const handleToolClick = async (serverId: string) => {
    setActiveServer(serverId);
    setIsLoading(true);

    const token = localStorage.getItem("a");

    if (!token) {
      window.location.href = "/signin";
      return;
    }

    let data = {
      appId: "wuXQpO8EsheI13FKKNn5p25DY92s6VtL",
      token: token,
      toolId: 44,
    };

    try {
      const res = await axios.post("https://api.nexustoolz.com/api/user/get-session", data, {
        headers: {
          "Content-Type": "application/json",
          "User-Client": (globalThis as any).clientId1328 || "",
        },
      });

      if (res?.status === 200) {
        window.postMessage({ type: 'FROM_NT_APP', text: JSON.stringify(res.data) }, "*");
        setIsLoading(false);
      }
    } catch (err) {
      setIsLoading(false);
    }
  };

  return (
    <div className="test-tool-body">
      {/* Structural placeholder from original code */}
      <div className="am-content-page"></div>

      <div className="container">
        {/* Logo and Tag */}
        <div className="logo-container">
          <img src="https://app.nexustoolz.com/theme/img/chatgpt.png" alt="Branding" />
          <span className="tag">Extension</span>
        </div>

        {allExtensionsDetected ? (
          /* Premium Tools Section - Visible when extensions are detected */
          <div className="tools-section" id="toolsSection">
            <div className="header">
              <h2>🛠️ Available Premium Tools</h2>
              <p>Switch servers if any not working or face any limit error</p>
            </div>

            <div className="premium-tools-section">
              <h3>🚀 Premium Tools Access</h3>
              <p>Access all premium tools with unlimited usage</p>

              <div className="button-container">
                <button 
                  className="tool-btn" 
                  id="ChatgptCookies1"
                  disabled={isLoading}
                  onClick={() => handleToolClick('ChatgptCookies1')}
                >
                  {isLoading && activeServer === 'ChatgptCookies1' ? '⏳ Loading...' : 'Chatgpt Server 1'}
                </button>
                <button 
                  className="tool-btn" 
                  id="ChatgptCookies2"
                  disabled={isLoading}
                  onClick={() => handleToolClick('ChatgptCookies2')}
                >
                  {isLoading && activeServer === 'ChatgptCookies2' ? '⏳ Loading...' : 'Chatgpt Server 2'}
                </button>
              </div>
            </div>

            <div className="update-info">
              ⏰ Next update in 3 hours - Stay tuned!
            </div>
          </div>
        ) : (
          /* Extension Notice Section - Visible when extensions are missing */
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