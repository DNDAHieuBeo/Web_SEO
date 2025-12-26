import React, { useRef, useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import { SearchIntent, SEOInput } from '../types';
import { Type, AlignLeft, Globe, FileText, Tag, Hash, Bold, Italic, List, ListOrdered, Image as ImageIcon, Code, Eye, Link as LinkIcon, Unlink, ExternalLink, Zap } from 'lucide-react';

interface Props {
  data: SEOInput;
  onChange: (data: SEOInput) => void;
}

export interface InputSectionHandle {
  focusField: (id: string) => void;
}

// Helper to generate Vietnamese slug
const generateSlug = (text: string) => {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
};

const GENERIC_ANCHORS = [
    'tại đây', 'tai day', 'xem tại đây', 'xem tai day', 'bấm vào đây', 'bam vao day', 
    'click here', 'click tại đây', 'xem thêm', 'xem them', 'chi tiết', 'chi tiet', 
    'đọc thêm', 'doc them', 'link', 'trang này'
];

// --- Rich Text Editor Component ---
interface RichTextHandle {
    findAndHighlight: (type: string) => void;
}

const RichTextEditor = forwardRef<RichTextHandle, { value: string, onChange: (val: string) => void, focusKeyword: string }>(({ value, onChange, focusKeyword }, ref) => {
  const [mode, setMode] = useState<'visual' | 'code'>('visual');
  const [currentLink, setCurrentLink] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const isInternalUpdate = useRef(false);

  // Helper to remove temporary highlights
  const removeHighlights = () => {
      if (!contentRef.current) return;
      const spans = contentRef.current.querySelectorAll('.seo-highlight-temp');
      spans.forEach(span => {
          const parent = span.parentNode;
          if (parent) {
              parent.replaceChild(document.createTextNode(span.textContent || ''), span);
              parent.normalize();
          }
      });
      // Remove any existing toasts
      const toasts = contentRef.current.parentElement?.querySelectorAll('.highlight-toast');
      toasts?.forEach(t => t.remove());
  };

  // Expose highlight method
  useImperativeHandle(ref, () => ({
    findAndHighlight: (type: string) => {
        if (mode !== 'visual') setMode('visual');
        
        // Small timeout to allow mode switch to render contentRef
        setTimeout(() => {
            const container = contentRef.current;
            if (!container) return;

            let target: Element | null = null;
            let selectContent = false;
            const totalTextLen = container.innerText.length;

            // Helper to flash element red
            const flashElement = (el: HTMLElement) => {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                el.style.transition = 'all 0.5s ease';
                el.style.backgroundColor = '#fecaca'; // Red-200
                el.style.boxShadow = '0 0 0 4px #fecaca';
                setTimeout(() => {
                    el.style.backgroundColor = '';
                    el.style.boxShadow = '';
                }, 2000);
            };

            if (type === 'key-density') {
                if (!focusKeyword.trim()) {
                    alert('Vui lòng nhập từ khóa chính trước.');
                    return;
                }
                
                removeHighlights(); // Clean up old ones

                // TreeWalker to find text nodes matches
                const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null);
                const nodesToReplace: {node: Text, matchIndices: number[]}[] = [];
                const lowerKey = focusKeyword.toLowerCase();
                
                let node: Node | null;
                let count = 0;

                while(node = walker.nextNode()) {
                    const text = node.textContent || '';
                    const lowerText = text.toLowerCase();
                    let index = lowerText.indexOf(lowerKey);
                    const indices = [];
                    while (index !== -1) {
                        indices.push(index);
                        count++;
                        index = lowerText.indexOf(lowerKey, index + 1);
                    }
                    if (indices.length > 0) {
                        nodesToReplace.push({ node: node as Text, matchIndices: indices });
                    }
                }

                if (count === 0) {
                    alert(`Không tìm thấy từ khóa "${focusKeyword}" trong bài.`);
                    return;
                }

                // Apply highlights
                const wrappers: HTMLElement[] = [];
                nodesToReplace.forEach(({ node, matchIndices }) => {
                    const text = node.textContent || '';
                    const fragment = document.createDocumentFragment();
                    let lastIndex = 0;

                    matchIndices.forEach(idx => {
                        fragment.appendChild(document.createTextNode(text.substring(lastIndex, idx)));
                        
                        const span = document.createElement('span');
                        span.className = 'seo-highlight-temp';
                        span.style.backgroundColor = '#fde047'; // yellow-300
                        span.style.fontWeight = '700';
                        span.style.borderRadius = '2px';
                        span.style.padding = '0 2px';
                        span.style.boxShadow = '0 0 0 1px #eab308';
                        span.style.transition = 'all 0.5s';
                        span.textContent = text.substr(idx, focusKeyword.length);
                        fragment.appendChild(span);
                        wrappers.push(span);

                        lastIndex = idx + focusKeyword.length;
                    });
                    fragment.appendChild(document.createTextNode(text.substring(lastIndex)));
                    node.parentNode?.replaceChild(fragment, node);
                });

                // Scroll to first match
                if (wrappers.length > 0) {
                    wrappers[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
                }

                // Show Toast count
                const toast = document.createElement('div');
                toast.textContent = `Tìm thấy ${count} lần xuất hiện "${focusKeyword}"`;
                toast.className = 'highlight-toast absolute top-14 right-4 bg-blue-600 text-white text-xs font-bold px-3 py-2 rounded shadow-lg animate-in fade-in slide-in-from-top-2 z-20';
                container.parentElement?.appendChild(toast);

                // Auto remove after 4 seconds
                setTimeout(() => {
                    wrappers.forEach(w => {
                        w.style.backgroundColor = 'transparent';
                        w.style.boxShadow = 'none';
                        w.style.fontWeight = 'normal';
                    });
                    toast.style.opacity = '0';
                    
                    setTimeout(() => {
                        removeHighlights();
                        // Sync cleaned HTML back to state
                        onChange(container.innerHTML);
                    }, 500);
                }, 4000);

                return; // Stop other checks
            }

            if (type === 'read-para') {
                // Find paragraph > 150 words
                const blocks = container.querySelectorAll('p, div, li');
                for (const block of blocks) {
                    if ((block.textContent || '').trim().split(/\s+/).length > 150) {
                        target = block;
                        selectContent = true;
                        break;
                    }
                }
            } else if (type === 'headings') {
                target = container.querySelector('h1, h2, h3, h4, h5, h6');
                if (target) selectContent = true;
            } else if (type === 'key-intro') {
                target = container.querySelector('p, div');
                if (target) selectContent = true;
            } else if (type === 'link-anchor') {
                // Find generic anchors
                const links = container.querySelectorAll('a');
                for (const link of links) {
                    const text = (link.textContent || '').toLowerCase().trim();
                    if (GENERIC_ANCHORS.some(g => text === g || text.includes(g))) {
                        target = link;
                        selectContent = true;
                        break;
                    }
                }
            } else if (type === 'link-pos-int' || type === 'link-pos-ext') {
                 // Find links in "Intro" (First 15% of height/text approximation)
                 const links = container.querySelectorAll('a');
                 
                 for (const link of links) {
                    const href = link.getAttribute('href') || '';
                    const isInternal = href.startsWith('/') || href.startsWith('#') || href.startsWith('.');
                    
                    if (type === 'link-pos-int' && isInternal) {
                         target = link;
                         selectContent = true;
                         break; 
                    }
                    if (type === 'link-pos-ext' && !isInternal) {
                         target = link;
                         selectContent = true;
                         break;
                    }
                 }
            } else if (type === 'read-list') {
                target = container;
            } else {
                target = container;
            }

            // Fallback if specific target not found
            if (!target) target = container;

            // Highlight Logic
            if (target instanceof HTMLElement && target !== container) {
                flashElement(target);
                
                // Also select it for editing
                const selection = window.getSelection();
                const range = document.createRange();
                range.selectNodeContents(target);
                if (selection) {
                    selection.removeAllRanges();
                    selection.addRange(range);
                }
                container.focus();
            } else {
                 target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                 container.focus();
            }
            
        }, 100);
    }
  }));

  // Sync value to contentEditable when value changes externally (and not currently typing)
  useEffect(() => {
    if (mode === 'visual' && contentRef.current) {
        // Only update if significantly different to avoid cursor jumps, 
        // OR if value changed externally.
        // Simple check: compare innerHTML
        if (contentRef.current.innerHTML !== value) {
            // Check if we are focusing it? No, just update if not focusing.
            if (document.activeElement !== contentRef.current) {
                 contentRef.current.innerHTML = value;
            }
        }
    }
  }, [value, mode]);

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    isInternalUpdate.current = true;
    const html = e.currentTarget.innerHTML;
    onChange(html);
    isInternalUpdate.current = false;
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    // STOP default browser paste which can be unpredictable with HTML
    e.preventDefault();

    // 1. Try to get HTML content (Rich Text)
    const htmlData = e.clipboardData.getData('text/html');
    
    // 2. Try to get Plain Text
    const textData = e.clipboardData.getData('text/plain');

    if (htmlData) {
        // Parse the HTML to extract the body content cleanly
        // This removes the <html><body> wrapper often included by browsers/Word
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlData, 'text/html');
        const cleanContent = doc.body.innerHTML;

        // Insert the HTML. This PRESERVES <a> tags, href, target, rel, etc.
        // It does NOT flatten links to text like (url).
        document.execCommand('insertHTML', false, cleanContent);
    } else if (textData) {
        // Fallback: Insert plain text
        document.execCommand('insertText', false, textData);
    }
  };

  const checkLinkStatus = () => {
      const selection = window.getSelection();
      if (!selection?.anchorNode) {
          setCurrentLink(null);
          return;
      }
      
      let node: Node | null = selection.anchorNode;
      // Handle text nodes
      if (node.nodeType === 3) node = node.parentNode;
      
      const linkNode = (node as HTMLElement)?.closest('a');
      if (linkNode && contentRef.current?.contains(linkNode)) {
          setCurrentLink(linkNode.getAttribute('href'));
      } else {
          setCurrentLink(null);
      }
  };

  const handleEditorClick = (e: React.MouseEvent<HTMLDivElement>) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a');
      
      // Ctrl/Cmd + Click to open
      if (link && (e.ctrlKey || e.metaKey)) {
          const href = link.getAttribute('href');
          if (href) window.open(href, '_blank');
      }
      
      checkLinkStatus();
  };

  const applyFormat = (command: string, val?: string) => {
    document.execCommand(command, false, val);
    if (contentRef.current) {
        onChange(contentRef.current.innerHTML);
        contentRef.current.focus();
    }
    checkLinkStatus();
  };

  const addLink = () => {
    const url = window.prompt('Nhập liên kết (URL):', 'https://');
    if (url) {
      applyFormat('createLink', url);
    }
  };

  const removeLink = () => {
      applyFormat('unlink');
  };

  const autoBoldKeywords = () => {
    if (!focusKeyword.trim()) {
        alert('Vui lòng nhập từ khóa chính trước.');
        return;
    }
    if (!contentRef.current) return;

    // Use a clean slate (remove temp highlights first if any)
    removeHighlights();

    const container = contentRef.current;
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null);
    const nodesToReplace: {node: Text, matchIndices: number[]}[] = [];
    const lowerKey = focusKeyword.toLowerCase();
    
    let node: Node | null;
    let count = 0;

    while(node = walker.nextNode()) {
        const parent = node.parentElement;
        // Skip if already bold/strong
        if (parent && (parent.tagName === 'B' || parent.tagName === 'STRONG')) continue;

        const text = node.textContent || '';
        const lowerText = text.toLowerCase();
        let index = lowerText.indexOf(lowerKey);
        const indices = [];
        while (index !== -1) {
            indices.push(index);
            count++;
            index = lowerText.indexOf(lowerKey, index + 1);
        }
        if (indices.length > 0) {
            nodesToReplace.push({ node: node as Text, matchIndices: indices });
        }
    }

    if (count === 0) {
        alert(`Không tìm thấy từ khóa "${focusKeyword}" chưa được in đậm.`);
        return;
    }

    nodesToReplace.forEach(({ node, matchIndices }) => {
        const text = node.textContent || '';
        const fragment = document.createDocumentFragment();
        let lastIndex = 0;

        matchIndices.forEach(idx => {
            fragment.appendChild(document.createTextNode(text.substring(lastIndex, idx)));
            
            const strong = document.createElement('strong');
            strong.textContent = text.substr(idx, focusKeyword.length);
            fragment.appendChild(strong);

            lastIndex = idx + focusKeyword.length;
        });
        fragment.appendChild(document.createTextNode(text.substring(lastIndex)));
        node.parentNode?.replaceChild(fragment, node);
    });

    onChange(container.innerHTML);
    alert(`Đã tự động in đậm ${count} từ khóa "${focusKeyword}".`);
  };

  return (
    <div className="border border-slate-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 transition-all flex flex-col flex-grow min-h-[400px]">
        {/* Toolbar */}
        <div className="bg-slate-50 border-b border-slate-200 p-2 flex items-center gap-1 flex-wrap">
            <div className="flex bg-slate-200 p-1 rounded-md mr-2">
                <button 
                    onClick={() => setMode('visual')} 
                    className={`px-2 py-1 rounded text-xs font-semibold flex items-center gap-1 transition-all ${mode==='visual' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
                >
                    <Eye className="w-3 h-3" /> Visual
                </button>
                <button 
                    onClick={() => setMode('code')} 
                    className={`px-2 py-1 rounded text-xs font-semibold flex items-center gap-1 transition-all ${mode==='code' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
                >
                    <Code className="w-3 h-3" /> HTML
                </button>
            </div>
            
            <div className="w-px h-5 bg-slate-300 mx-1"></div>
            
            {mode === 'visual' ? (
                <>
                    <button onClick={() => applyFormat('bold')} className="p-1.5 hover:bg-white hover:shadow rounded text-slate-700 transition-all" title="Bold (In đậm)">
                        <Bold className="w-4 h-4"/>
                    </button>
                    <button onClick={() => applyFormat('italic')} className="p-1.5 hover:bg-white hover:shadow rounded text-slate-700 transition-all" title="Italic (In nghiêng)">
                        <Italic className="w-4 h-4"/>
                    </button>
                    <div className="w-px h-4 bg-slate-300 mx-1"></div>
                    <button onClick={() => applyFormat('formatBlock', 'H2')} className="p-1.5 hover:bg-white hover:shadow rounded text-slate-700 font-bold text-xs w-8" title="Heading 2">
                        H2
                    </button>
                    <button onClick={() => applyFormat('formatBlock', 'H3')} className="p-1.5 hover:bg-white hover:shadow rounded text-slate-700 font-bold text-xs w-8" title="Heading 3">
                        H3
                    </button>
                    <div className="w-px h-4 bg-slate-300 mx-1"></div>
                    <button onClick={addLink} className="p-1.5 hover:bg-white hover:shadow rounded text-slate-700 transition-all" title="Chèn Link">
                        <LinkIcon className="w-4 h-4 text-blue-600"/>
                    </button>
                     <button onClick={removeLink} className="p-1.5 hover:bg-white hover:shadow rounded text-slate-700 transition-all" title="Gỡ Link">
                        <Unlink className="w-4 h-4"/>
                    </button>
                    <div className="w-px h-4 bg-slate-300 mx-1"></div>
                    <button onClick={() => applyFormat('insertUnorderedList')} className="p-1.5 hover:bg-white hover:shadow rounded text-slate-700 transition-all" title="Bullet List (Danh sách)">
                        <List className="w-4 h-4"/>
                    </button>
                    <button onClick={() => applyFormat('insertOrderedList')} className="p-1.5 hover:bg-white hover:shadow rounded text-slate-700 transition-all" title="Numbered List (Số thứ tự)">
                        <ListOrdered className="w-4 h-4"/>
                    </button>
                    <div className="w-px h-4 bg-slate-300 mx-1"></div>
                    <button onClick={autoBoldKeywords} className="p-1.5 hover:bg-white hover:shadow rounded text-yellow-600 transition-all flex items-center gap-1" title="Tự động In đậm từ khóa chính">
                        <Zap className="w-4 h-4 fill-yellow-500"/>
                    </button>
                    
                    {currentLink && (
                        <div className="ml-auto flex items-center gap-2 bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs border border-blue-100 animate-in fade-in">
                            <span className="max-w-[150px] truncate" title={currentLink}>{currentLink}</span>
                            <a href={currentLink} target="_blank" rel="noreferrer" className="flex items-center gap-1 font-bold hover:underline">
                                Mở <ExternalLink size={12} />
                            </a>
                        </div>
                    )}
                </>
            ) : (
                <span className="text-xs text-slate-500 font-medium ml-2">Chế độ chỉnh sửa mã nguồn HTML</span>
            )}
        </div>

        {/* Editor Area */}
        <div className="flex-grow bg-white relative overflow-hidden flex flex-col relative">
            {mode === 'visual' ? (
                <div
                    ref={contentRef}
                    contentEditable
                    onInput={handleInput}
                    onPaste={handlePaste}
                    onClick={handleEditorClick}
                    onKeyUp={checkLinkStatus}
                    className="flex-grow p-5 outline-none prose prose-slate max-w-none overflow-y-auto custom-scrollbar 
                    prose-a:text-blue-600 prose-a:underline prose-a:decoration-blue-300 prose-a:decoration-2 prose-a:underline-offset-2 hover:prose-a:text-blue-800 prose-a:cursor-pointer"
                    style={{ minHeight: '300px' }}
                    data-placeholder="Nhập nội dung bài viết hoặc paste từ Word/Docs..."
                />
            ) : (
                <textarea
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="flex-grow p-4 outline-none font-mono text-sm bg-slate-900 text-green-400 resize-none overflow-y-auto custom-scrollbar"
                    style={{ minHeight: '300px' }}
                    placeholder="<p>Nhập mã HTML tại đây...</p>"
                />
            )}
        </div>
        {mode === 'visual' && (
             <div className="px-4 py-1 bg-slate-50 border-t border-slate-100 text-[10px] text-slate-400 text-right flex justify-between">
                <span>Giữ Ctrl + Click để mở link.</span>
                <span>Hỗ trợ paste từ Word/Docs giữ nguyên Link (href, target, rel), Heading, Ảnh.</span>
             </div>
        )}
    </div>
  )
});

// --- Main Input Section ---

const InputSection = forwardRef<InputSectionHandle, Props>(({ data, onChange }, ref) => {
  const titleRef = useRef<HTMLInputElement>(null);
  const metaRef = useRef<HTMLTextAreaElement>(null);
  const keywordRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<RichTextHandle>(null);

  const handleChange = (field: keyof SEOInput, value: string) => {
    let newData = { ...data, [field]: value };
    if (field === 'focusKeyword') {
      newData.slug = generateSlug(value);
    }
    onChange(newData);
  };

  useImperativeHandle(ref, () => ({
    focusField: (id: string) => {
        if (id === 'key-title' || id === 'ctr-len' || id === 'ctr-power') {
            titleRef.current?.focus();
            titleRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            titleRef.current?.classList.add('ring-2', 'ring-red-400');
            setTimeout(() => titleRef.current?.classList.remove('ring-2', 'ring-red-400'), 1500);
        } else if (id === 'ctr-meta') {
            metaRef.current?.focus();
            metaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else if (id === 'focus-keyword') {
            keywordRef.current?.focus();
            keywordRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else if (id === 'key-density') {
             // Handle Density check in Editor now
             editorRef.current?.findAndHighlight(id);
        } else {
            // Scroll to Editor content
            editorRef.current?.findAndHighlight(id);
        }
    }
  }));

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6 h-full overflow-y-auto custom-scrollbar flex flex-col">
      <h2 className="text-xl font-bold text-slate-800 border-b border-slate-100 pb-4 shrink-0">
        Nội Dung & Cấu Hình
      </h2>

      {/* Focus Keyword */}
      <div className="space-y-2 shrink-0">
        <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
          <Tag className="w-4 h-4 text-blue-500" /> Focus Keyword (Từ khóa chính)
        </label>
        <input
          ref={keywordRef}
          type="text"
          value={data.focusKeyword}
          onChange={(e) => handleChange('focusKeyword', e.target.value)}
          placeholder="Ví dụ: máy lọc không khí"
          className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
        />
      </div>

      {/* Intent */}
      <div className="space-y-2 shrink-0">
        <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
          <Type className="w-4 h-4 text-purple-500" /> Loại Bài Viết (Intent)
        </label>
        <select
          value={data.intent}
          onChange={(e) => handleChange('intent', e.target.value as SearchIntent)}
          className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white"
        >
          {Object.values(SearchIntent).map((intent) => (
            <option key={intent} value={intent}>{intent}</option>
          ))}
        </select>
      </div>

      {/* Title & Slug */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 shrink-0">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
             <Type className="w-4 h-4 text-slate-500" /> SEO Title
          </label>
          <input
            ref={titleRef}
            type="text"
            value={data.seoTitle}
            onChange={(e) => handleChange('seoTitle', e.target.value)}
            placeholder="Tiêu đề hiển thị trên Google"
            className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <div className="text-xs text-right text-slate-400">{data.seoTitle.length} / 60 ký tự</div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
            <Globe className="w-4 h-4 text-slate-500" /> Slug (URL)
          </label>
          <input
            type="text"
            value={data.slug}
            onChange={(e) => handleChange('slug', e.target.value)}
            placeholder="may-loc-khong-khi"
            className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50"
          />
        </div>
      </div>

      {/* Secondary Keywords */}
      <div className="space-y-2 shrink-0">
        <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
          <Hash className="w-4 h-4 text-slate-500" /> Từ khóa phụ (Cách nhau dấu phẩy)
        </label>
        <input
          type="text"
          value={data.secondaryKeywords}
          onChange={(e) => handleChange('secondaryKeywords', e.target.value)}
          placeholder="review máy lọc, máy lọc giá rẻ..."
          className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
        />
      </div>

      {/* Meta Description */}
      <div className="space-y-2 shrink-0">
        <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
          <FileText className="w-4 h-4 text-slate-500" /> Meta Description
        </label>
        <textarea
          ref={metaRef}
          value={data.metaDescription}
          onChange={(e) => handleChange('metaDescription', e.target.value)}
          placeholder="Mô tả ngắn gọn, kích thích click..."
          className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-20 resize-none"
        />
         <div className="text-xs text-right text-slate-400">{data.metaDescription.length} / 160 ký tự</div>
      </div>

      {/* Content Editor */}
      <div className="space-y-2 flex-grow flex flex-col min-h-[400px]">
        <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
          <AlignLeft className="w-4 h-4 text-slate-500" /> Nội Dung Bài Viết (Rich Text / HTML)
        </label>
        
        <RichTextEditor 
            ref={editorRef}
            value={data.content}
            onChange={(val) => handleChange('content', val)}
            focusKeyword={data.focusKeyword}
        />
      </div>
    </div>
  );
});

export default InputSection;