import React, { useRef, useEffect, useCallback, useState } from 'react';
import { MousePointer2, Sparkles, Key, Loader2 } from 'lucide-react';

const ToolbarButton = ({ title, onClick, children, active, disabled }) => (
  <button
    type="button"
    title={title}
    disabled={disabled}
    onMouseDown={e => { e.preventDefault(); if (!disabled) onClick(); }}
    style={{
      background: active ? 'rgba(59,130,246,0.3)' : 'transparent',
      border: 'none',
      color: disabled ? '#94a3b8' : '#1e293b',
      padding: '4px 8px',
      borderRadius: '4px',
      cursor: disabled ? 'not-allowed' : 'pointer',
      fontSize: '13px',
      fontWeight: 600,
      lineHeight: 1,
      transition: 'background 0.15s',
      display: 'flex',
      alignItems: 'center',
      gap: '4px'
    }}
  >
    {children}
  </button>
);

const Divider = () => (
  <span style={{ width: 1, background: '#cbd5e1', margin: '4px 4px', display: 'inline-block', alignSelf: 'stretch' }} />
);

const RichEditor = ({ value, onChange, placeholder = 'Type here...' }) => {
  const editorRef = useRef(null);
  const isInternalChange = useRef(false);
  const [isAiProcessing, setIsAiProcessing] = useState(false);

  // Set HTML from parent when value changes (e.g. template loaded)
  useEffect(() => {
    if (editorRef.current) {
      const current = editorRef.current.innerHTML;
      if (current !== value && !isInternalChange.current) {
        editorRef.current.innerHTML = value || '';
      }
      isInternalChange.current = false;
    }
  }, [value]);

  const handleInput = useCallback(() => {
    isInternalChange.current = true;
    if (onChange) onChange(editorRef.current.innerHTML);
  }, [onChange]);

  const exec = (cmd, val = null) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, val);
    handleInput();
  };

  const handleAiFormat = async () => {
    let apiKey = localStorage.getItem('GEMINI_API_KEY');
    
    if (!apiKey) {
      apiKey = window.prompt("Please enter your Gemini API Key to use the AI Auto-Fix feature:");
      if (apiKey) {
        localStorage.setItem('GEMINI_API_KEY', apiKey);
      } else {
        return;
      }
    }

    const currentText = editorRef.current.innerText || editorRef.current.textContent;
    if (!currentText.trim() || currentText.length < 10) {
      alert("Please enter some report text first so the AI can analyze it.");
      return;
    }

    setIsAiProcessing(true);
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are an expert Radiologist. Reformat the following raw radiology findings into a professional, highly structured, and clean-looking medical report. 

Guidelines:
1. Use HTML tags for formatting: <b> for headers, <ul> and <li> for bullet points.
2. Structure it clearly: Start with CLINICAL HISTORY/INDICATION (if provided), then TECHNIQUE, then FINDINGS (broken down by organ or area), and finally a bold IMPRESSION section.
3. Fix any grammar or messy pasting errors, but DO NOT change the medical meaning.
4. If some parts are missing, just organize what is there professionally.
5. Return ONLY the HTML content, no extra talk. IMPORTANT: Do NOT use any colors or style attributes in the HTML.
6. The report should be in standard black text.

Raw Content:
${currentText}`
            }]
          }]
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        // Detailed error for debugging
        const errorMsg = data.error?.message || response.statusText || "Unknown Error";
        const errorCode = data.error?.status || response.status;
        throw new Error(`${errorCode}: ${errorMsg}`);
      }

      const aiHtml = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (aiHtml) {
        const cleanedHtml = aiHtml.replace(/```html|```/g, '').trim();
        
        // Final scrub to ensure the AI didn't sneak in any colors/styles
        const temp = document.createElement('div');
        temp.innerHTML = cleanedHtml;
        const coloredElements = temp.querySelectorAll('*');
        coloredElements.forEach(el => {
          el.removeAttribute('style');
          el.removeAttribute('class');
        });

        editorRef.current.innerHTML = temp.innerHTML;
        handleInput();
      } else {
        throw new Error("AI returned an empty response. Try adding more text.");
      }
    } catch (error) {
      console.error("AI Error Detailed:", error);
      alert(`AI Error: ${error.message}`);
      
      if (error.message.includes("400") || error.message.includes("INVALID_ARGUMENT")) {
        alert("Tip: Check if your API key is definitely for Gemini 1.5.");
      }
    } finally {
      setIsAiProcessing(false);
    }
  };

  const resetApiKey = () => {
    const newKey = window.prompt("Enter new Gemini API Key:", localStorage.getItem('GEMINI_API_KEY') || "");
    if (newKey) localStorage.setItem('GEMINI_API_KEY', newKey);
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    const html = e.clipboardData.getData('text/html');
    
    if (html) {
      const temp = document.createElement('div');
      temp.innerHTML = html;
      const allElements = temp.querySelectorAll('*');
      allElements.forEach(el => {
        el.removeAttribute('style');
        el.removeAttribute('class');
        el.removeAttribute('face');
        el.removeAttribute('size');
        el.removeAttribute('color');
      });
      document.execCommand('insertHTML', false, temp.innerHTML);
    } else {
      document.execCommand('insertText', false, text);
    }
    handleInput();
  };

  const handleSelectAll = () => {
    if (editorRef.current) {
      const range = document.createRange();
      range.selectNodeContents(editorRef.current);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      editorRef.current.focus();
    }
  };

  const toolbarStyle = {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: '4px',
    padding: '6px 8px',
    background: '#f1f5f9',
    borderBottom: '1px solid #cbd5e1',
    borderRadius: '8px 8px 0 0'
  };

  const selectStyle = {
    fontSize: '12px',
    border: '1px solid #cbd5e1',
    borderRadius: '4px',
    padding: '2px 4px',
    background: 'white',
    color: '#1e293b',
    cursor: 'pointer',
    outline: 'none'
  };

  return (
    <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', background: 'white', display: 'flex', flexDirection: 'column' }}>
      {/* Toolbar */}
      <div style={toolbarStyle}>
        
        {/* Font Family */}
        <select
          style={{ ...selectStyle, width: '100px' }}
          onChange={e => exec('fontName', e.target.value)}
          defaultValue=""
          title="Font Family"
        >
          <option value="" disabled>Font</option>
          <option value="Arial">Arial</option>
          <option value="Times New Roman">Times New Roman</option>
          <option value="Verdana">Verdana</option>
          <option value="Courier New">Courier New</option>
          <option value="Georgia">Georgia</option>
          <option value="Trebuchet MS">Trebuchet MS</option>
        </select>

        {/* Font Size */}
        <select
          style={{ ...selectStyle, width: '70px' }}
          onChange={e => exec('fontSize', e.target.value)}
          defaultValue=""
          title="Font Size"
        >
          <option value="" disabled>Size</option>
          <option value="2">Small</option>
          <option value="3">Normal</option>
          <option value="4">Large</option>
          <option value="5">Larger</option>
          <option value="6">Huge</option>
        </select>

        <Divider />

        {/* TEXT COLOR PICKER */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '0 4px' }} title="Text Color">
          <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b' }}>A</span>
          <input 
            type="color" 
            onChange={(e) => exec('foreColor', e.target.value)}
            style={{ 
              width: '24px', 
              height: '24px', 
              padding: 0, 
              border: 'none', 
              background: 'transparent', 
              cursor: 'pointer' 
            }}
          />
        </div>

        <Divider />

        <ToolbarButton title="Select All Content" onClick={handleSelectAll}>
           <MousePointer2 size={14} /> All
        </ToolbarButton>

        <Divider />

        {/* AI SMART FIX BUTTON */}
        <ToolbarButton 
          title="AI Smart Format (Magic Fix)" 
          onClick={handleAiFormat}
          disabled={isAiProcessing}
          style={{ 
            background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', 
            color: 'white',
            padding: '4px 10px'
          }}
        >
          {isAiProcessing ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
          {isAiProcessing ? 'Thinking...' : 'AI Auto-Fix'}
        </ToolbarButton>

        <ToolbarButton title="Update API Key" onClick={resetApiKey}>
           <Key size={14} />
        </ToolbarButton>

        <Divider />

        <ToolbarButton title="Bold" onClick={() => exec('bold')}><b>B</b></ToolbarButton>
        <ToolbarButton title="Italic" onClick={() => exec('italic')}><i>I</i></ToolbarButton>
        <ToolbarButton title="Underline" onClick={() => exec('underline')}><u>U</u></ToolbarButton>

        <Divider />

        <ToolbarButton title="Align Left" onClick={() => exec('justifyLeft')}>⬅</ToolbarButton>
        <ToolbarButton title="Align Center" onClick={() => exec('justifyCenter')}>☰</ToolbarButton>
        <ToolbarButton title="Align Right" onClick={() => exec('justifyRight')}>➡</ToolbarButton>

        <Divider />

        <ToolbarButton title="List" onClick={() => exec('insertUnorderedList')}>• List</ToolbarButton>

        <Divider />

        <ToolbarButton title="Clear Formatting" onClick={() => exec('removeFormat')}>✕ Clear</ToolbarButton>
      </div>

      {/* Editor area */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onPaste={handlePaste}
        style={{
          minHeight: '450px',
          padding: '24px',
          color: '#000000',
          fontSize: '16px',
          lineHeight: '1.7',
          outline: 'none',
          borderRadius: '0 0 8px 8px',
          overflowY: 'auto',
          fontFamily: 'Arial, sans-serif',
          backgroundColor: isAiProcessing ? '#f8fafc' : 'white',
          transition: 'background-color 0.3s'
        }}
        data-placeholder={placeholder}
      />
    </div>
  );
};

export default RichEditor;
