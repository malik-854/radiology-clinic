import React, { useRef, useEffect, useCallback } from 'react';

const ToolbarButton = ({ title, onClick, children, active }) => (
  <button
    type="button"
    title={title}
    onMouseDown={e => { e.preventDefault(); onClick(); }}
    style={{
      background: active ? 'rgba(59,130,246,0.3)' : 'transparent',
      border: 'none',
      color: '#1e293b',
      padding: '4px 8px',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '13px',
      fontWeight: 600,
      lineHeight: 1,
      transition: 'background 0.15s'
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

  const toolbarStyle = {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: '2px',
    padding: '6px 8px',
    background: '#f1f5f9',
    borderBottom: '1px solid #cbd5e1',
    borderRadius: '8px 8px 0 0'
  };

  return (
    <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', background: 'white', display: 'flex', flexDirection: 'column' }}>
      {/* Toolbar */}
      <div style={toolbarStyle}>
        <select
          style={{ fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '2px 4px', background: 'white', color: '#1e293b' }}
          onMouseDown={e => e.stopPropagation()}
          onChange={e => exec('fontSize', e.target.value)}
          defaultValue=""
        >
          <option value="" disabled>Size</option>
          <option value="2">Small</option>
          <option value="3">Normal</option>
          <option value="4">Large</option>
          <option value="5">Larger</option>
          <option value="6">Huge</option>
        </select>

        <Divider />

        <ToolbarButton title="Bold" onClick={() => exec('bold')}><b>B</b></ToolbarButton>
        <ToolbarButton title="Italic" onClick={() => exec('italic')}><i>I</i></ToolbarButton>
        <ToolbarButton title="Underline" onClick={() => exec('underline')}><u>U</u></ToolbarButton>
        <ToolbarButton title="Strikethrough" onClick={() => exec('strikeThrough')}><s>S</s></ToolbarButton>

        <Divider />

        <ToolbarButton title="Align Left" onClick={() => exec('justifyLeft')}>⬅</ToolbarButton>
        <ToolbarButton title="Align Center" onClick={() => exec('justifyCenter')}>☰</ToolbarButton>
        <ToolbarButton title="Align Right" onClick={() => exec('justifyRight')}>➡</ToolbarButton>

        <Divider />

        <ToolbarButton title="Bullet List" onClick={() => exec('insertUnorderedList')}>• List</ToolbarButton>
        <ToolbarButton title="Numbered List" onClick={() => exec('insertOrderedList')}>1. List</ToolbarButton>

        <Divider />

        <ToolbarButton title="Clear Formatting" onClick={() => exec('removeFormat')}>✕ Clear</ToolbarButton>
      </div>

      {/* Editor area */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        style={{
          minHeight: '380px',
          padding: '16px',
          color: '#1e293b',
          fontSize: '16px',
          lineHeight: '1.7',
          outline: 'none',
          borderRadius: '0 0 8px 8px',
          overflowY: 'auto',
          fontFamily: 'Arial, sans-serif'
        }}
        data-placeholder={placeholder}
      />
    </div>
  );
};

export default RichEditor;
