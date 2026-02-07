import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import './App.css';

// const API_BASE_URL = 'http://localhost:8000';
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

function App() {
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState('llama2');
  const [health, setHealth] = useState(null);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    checkHealth();
    fetchModels();
  }, []);

  const checkHealth = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/health`);
      const data = await response.json();
      setHealth(data);
    } catch (error) {
      console.error('Health check failed:', error);
      setHealth({ status: 'unhealthy', error: error.message });
    }
  };

  const fetchModels = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/models`);
      const data = await response.json();
      if (data.models && data.models.length > 0) {
        setModels(data.models);
        setSelectedModel(data.models[0]);
      }
    } catch (error) {
      console.error('Failed to fetch models:', error);
    }
  };

  const handleChat = async (e) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;
    
    const userMessage = { role: 'user', content: chatMessage };
    setChatHistory(prev => [...prev, userMessage]);
    setChatMessage('');
    setChatLoading(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: chatMessage,
          model: selectedModel
        })
      });
      
      const data = await response.json();
      
      const aiMessage = {
        role: 'assistant',
        content: response.ok ? data.response : `Error: ${data.detail}`
      };
      setChatHistory(prev => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage = {
        role: 'assistant',
        content: `Error: ${error.message}`
      };
      setChatHistory(prev => [...prev, errorMessage]);
    } finally {
      setChatLoading(false);
    }
  };

  const clearChat = () => {
    setChatHistory([]);
  };

  return (
    <div className="App">
      <header className="app-header">
        <h1>🦙 Ollama Chat</h1>
        <div className="health-status">
          {health && (
            <span className={`status-badge ${health.status}`}>
              {health.status === 'healthy' ? '✓ Connected' : '✗ Disconnected'}
            </span>
          )}
        </div>
      </header>

      <div className="controls">
        <div className="model-selector">
          <label>Model:</label>
          <select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)}>
            {models.length > 0 ? (
              models.map(model => (
                <option key={model} value={model}>{model}</option>
              ))
            ) : (
              <option value="llama2">llama2</option>
            )}
          </select>
        </div>
        {chatHistory.length > 0 && (
          <button onClick={clearChat} className="clear-btn">
            Clear Chat
          </button>
        )}
      </div>

      <div className="chat-container">
        <div className="chat-messages">
          {chatHistory.length === 0 ? (
            <div className="empty-state">
              <p>👋 Start a conversation with Ollama!</p>
              <p className="empty-hint">Ask me anything...</p>
            </div>
          ) : (
            chatHistory.map((msg, index) => (
              <div key={index} className={`message ${msg.role}`}>
                <div className="message-header">
                  {msg.role === 'user' ? '👤 You' : '🤖 AI'}
                </div>
                <div className="message-content">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      code({ node, inline, className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || '');
                        return !inline && match ? (
                          <SyntaxHighlighter
                            style={vscDarkPlus}
                            language={match[1]}
                            PreTag="div"
                            {...props}
                          >
                            {String(children).replace(/\n$/, '')}
                          </SyntaxHighlighter>
                        ) : (
                          <code className={className} {...props}>
                            {children}
                          </code>
                        );
                      }
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                </div>
              </div>
            ))
          )}
          {chatLoading && (
            <div className="message assistant">
              <div className="message-header">🤖 AI</div>
              <div className="message-content loading">
                <span className="dot">.</span>
                <span className="dot">.</span>
                <span className="dot">.</span>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleChat} className="chat-input-form">
          <input
            type="text"
            value={chatMessage}
            onChange={(e) => setChatMessage(e.target.value)}
            placeholder="Type your message..."
            disabled={chatLoading}
            className="chat-input"
          />
          <button type="submit" disabled={chatLoading || !chatMessage.trim()} className="send-btn">
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

export default App;