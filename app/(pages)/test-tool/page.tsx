"use client";

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './test-tool.css';

/**
 * TestToolPage Component - Optimized for Developer Testing
 * 
 * Target Tool ID: 44 (ChatGPT)
 */
export default function TestToolPage() {
  const [detectedExtensions, setDetectedExtensions] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeServer, setActiveServer] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [lastMessageSent, setLastMessageSent] = useState<any>(null);
  
  // Extension check list (Optional for testing actual detection)
  const requiredExtensions = new Set(['Nexus Toolz Extension 1', 'Nexus Toolz Extension 2']);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Listen for the new extension format
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

  /**
   * Launch Tool ID 44
   */
  const handleToolClick = async (serverId: string, toolId: number) => {
    setActiveServer(serverId);
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    const token = localStorage.getItem("a");

    if (!token) {
      setError("Please login to your account first.");
      setIsLoading(false);
      return;
    }

    let data = {
      appId: "wuXQpO8EsheI13FKKNn5p25DY92s6VtL",
      token: token,
      toolId: toolId,
    };

    try {
      const res = await axios.post("https://api.nexustoolz.com/api/user/get-session", data, {
        headers: {
          "Content-Type": "application/json",
          "User-Client": (globalThis as any).clientId1328 || "",
        },
      });

      if (res?.status === 200) {
        // The Payload for the Extension
        const payload = { type: 'FROM_NT_APP', text: JSON.stringify(res.data) };
        
        // Broadcast to Extension
        window.postMessage(payload, "*");
        
        setLastMessageSent(payload);
        setSuccess(`Success! Sent session for Tool ID ${toolId} to your extension.`);
        setIsLoading(false);
      }
    } catch (err: any) {
      setError(err.response?.data || "Something went wrong. Make sure you have an active subscription for Tool #44.");
      setIsLoading(false);
    }
  };

  return (
    <div className="test-tool-body">
      <div className="container">
        {/* Header Section */}
        <div className="logo-container">
          <img src="https://app.nexustoolz.com/theme/img/chatgpt.png" alt="Branding" />
          <span className="tag" style={{ background: '#22c55e' }}>TEST MODE</span>
        </div>

        <div className="header">
          <h2 style={{ color: '#16a34a' }}>🛠️ Developer Test Environment</h2>
          <p>Restriction Bypass: <span style={{ color: '#16a34a', fontWeight: 'bold' }}>ACTIVE</span></p>
        </div>

        {/* Tools Section - Always Visible */}
        <div className="tools-section">
          <div className="premium-tools-section" style={{ border: '2px solid #16a34a' }}>
            <h3>🚀 Test ChatGPT Launch (Tool ID: 44)</h3>
            <p>Clicking these buttons will fetch a real session and send it via postMessage.</p>

            <div className="button-container">
              <button 
                className="tool-btn" 
                style={{ background: '#16a34a' }}
                disabled={isLoading}
                onClick={() => handleToolClick('Server 1', 44)}
              >
                {isLoading && activeServer === 'Server 1' ? '⏳ Fetching...' : 'Launch ChatGPT'}
              </button>
              
              <button 
                className="tool-btn" 
                style={{ background: '#64748b' }}
                disabled={true}
              >
                Other Server (TBD)
              </button>
            </div>

            {/* Logs/Feedback */}
            {error && (
              <div style={{ marginTop: '20px', padding: '15px', background: '#fee2e2', color: '#b91c1c', borderRadius: '8px', border: '1px solid #fecaca', fontSize: '13px', textAlign: 'left' }}>
                <strong>Error:</strong> {error}
              </div>
            )}
            
            {success && (
              <div style={{ marginTop: '20px', padding: '15px', background: '#f0fdf4', color: '#166534', borderRadius: '8px', border: '1px solid #bbfcbd', fontSize: '13px', textAlign: 'left' }}>
                <strong>Success:</strong> {success}
                {lastMessageSent && (
                  <pre style={{ marginTop: '10px', padding: '10px', background: '#fff', borderRadius: '4px', overflow: 'auto', fontSize: '11px', border: '1px solid #dcfce7' }}>
                    Sent postMessage: {JSON.stringify(lastMessageSent, null, 2)}
                  </pre>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Info for Developer */}
        <div className="update-info" style={{ background: '#334155' }}>
          💡 Tip: Open Console (F12) to monitor window.postMessage activity.
        </div>
        
        {/* Detection Test (Optional) */}
        <div className="download-section" style={{ opacity: 0.7 }}>
          <p style={{ fontSize: '12px' }}>
            Status: {detectedExtensions.size > 0 ? '✅ New Extension Detected' : '⏳ Waiting for EXTENSION_CHECK message...'}
          </p>
        </div>
      </div>
    </div>
  );
}