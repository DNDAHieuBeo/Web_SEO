
import React, { useRef, useState, useImperativeHandle, forwardRef, useMemo, useEffect } from 'react';
import { SearchIntent, SEOInput, ContentTaxonomy } from '../types';
import { analyzeContent } from '../services/seoEngine';
import { optimizeContent } from '../services/gemini';
import { 
  Type, Globe, FileText, Tag, Hash, AlignLeft, Layers, Target, 
  Compass, Zap, Sparkles, Eye, History, FileEdit, Check, Copy, 
  Loader2, Bold, Italic, Link as LinkIcon, Image as ImageIcon, 
  Heading2, Heading3, X, ExternalLink, ShieldCheck, DollarSign
} from 'lucide-react';

interface Props {
  data: SEOInput;
  onChange: (data: SEOInput) => void;
}

export interface InputSectionHandle {
  focusField: (id: string) => void;
}

const generateSlug = (text: string) => {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[đĐ]/g, "d").replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-");
};

const InputSection = forwardRef<InputSectionHandle, Props>(({ data, onChange }, ref) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const analysis = useMemo(() => analyzeContent(data), [data]);
  const tax = analysis.taxonomy;

  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<{enhancedContent: string, suggestions: string[]} | null>(null);
  const [viewMode, setViewMode] = useState<'original' | 'diff'>('original');

  // Link Popover States
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkOptions, setLinkOptions] = useState({
    blank: true,
    nofollow: false,
    sponsored: false
  });
  const [savedSelection, setSavedSelection] = useState<Range | null>(null);

  const handleChange = (field: keyof SEOInput, value: string) => {
    let newData = { ...data, [field]: value };
    if (field === 'focusKeyword' && !data.slug) newData.slug = generateSlug(value);
    onChange(newData);
  };

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== data.content) {
      if (document.activeElement !== editorRef.current) {
        editorRef.current.innerHTML = data.content;
      }
    }
  }, [data.content]);

  const execCommand = (command: string, value: string = '') => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      handleChange('content', editorRef.current.innerHTML);
    }
  };

  // Mở modal gắn link
  const openLinkModal = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      setSavedSelection(selection.getRangeAt(0).cloneRange());
      setShowLinkModal(true);
      // Reset form
      setLinkUrl('');
    } else {
      alert("Vui lòng bôi đen từ khóa muốn gắn link.");
    }
  };

  // Thực hiện gắn link với các thuộc tính SEO
  const confirmAddLink = () => {
    if (!linkUrl) return;
    
    const selection = window.getSelection();
    if (savedSelection) {
      selection?.removeAllRanges();
      selection?.addRange(savedSelection);
    }

    // Tạo thẻ A thủ công để gán các thuộc tính SEO
    const relArr = [];
    if (linkOptions.nofollow) relArr.push('nofollow');
    if (linkOptions.sponsored) relArr.push('sponsored');
    
    const anchor = document.createElement('a');
    anchor.href = linkUrl;
    if (linkOptions.blank) anchor.target = '_blank';
    if (relArr.length > 0) anchor.rel = relArr.join(' ');
    anchor.className = "text-blue-600 underline hover:text-blue-800 transition-colors";

    const range = selection?.getRangeAt(0);
    if (range) {
      const selectedText = range.extractContents();
      anchor.appendChild(selectedText);
      range.insertNode(anchor);
    }

    if (editorRef.current) {
      handleChange('content', editorRef.current.innerHTML);
    }
    
    setShowLinkModal(false);
    setSavedSelection(null);
  };

  const addImage = () => {
    const url = window.prompt("Nhập URL hình ảnh:");
    if (url) execCommand('insertImage', url);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    setTimeout(() => {
      if (editorRef.current) {
        handleChange('content', editorRef.current.innerHTML);
      }
    }, 0);
  };

  const handleAIRequest = async () => {
    if (!data.content || data.content.length < 20) {
        alert("Vui lòng nhập nội dung để AI có thể phân tích.");
        return;
    }
    setAiLoading(true);
    const result = await optimizeContent(data, analysis);
    if (result) {
        setAiResult(result);
        setViewMode('diff');
    }
    setAiLoading(false);
  };

  const applyAIContent = () => {
      if (!aiResult) return;
      const cleanContent = aiResult.enhancedContent
        .replace(/<strong style="color: #ef4444;">/g, "")
        .replace(/<\/strong>/g, "");
      handleChange('content', cleanContent);
      setAiResult(null);
      setViewMode('original');
  };

  return (
    <div className="flex flex-col h-full overflow-hidden relative">
      {/* LINK POPOVER (YOAST STYLE) */}
      {showLinkModal && (
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 z-[100] w-80 bg-white border border-slate-200 shadow-2xl rounded-2xl p-4 animate-in zoom-in-95 duration-200">
           <div className="flex items-center justify-between mb-3">
              <h4 className="text-[11px] font-black text-slate-800 uppercase flex items-center gap-2">
                <LinkIcon size={14} className="text-blue-600"/> Cài đặt liên kết SEO
              </h4>
              <button onClick={() => setShowLinkModal(false)} className="text-slate-400 hover:text-slate-600"><X size={16}/></button>
           </div>
           
           <div className="space-y-3">
              <input 
                type="text" 
                placeholder="Dán URL (https://...)" 
                autoFocus
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500"
              />
              
              <div className="space-y-2 py-2 border-y border-slate-50">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input type="checkbox" checked={linkOptions.blank} onChange={e => setLinkOptions({...linkOptions, blank: e.target.checked})} className="rounded text-blue-600" />
                  <span className="text-[10px] font-bold text-slate-600 group-hover:text-slate-900 flex items-center gap-1.5"><ExternalLink size={12}/> Mở trong tab mới</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input type="checkbox" checked={linkOptions.nofollow} onChange={e => setLinkOptions({...linkOptions, nofollow: e.target.checked})} className="rounded text-blue-600" />
                  <span className="text-[10px] font-bold text-slate-600 group-hover:text-slate-900 flex items-center gap-1.5"><ShieldCheck size={12}/> Đánh dấu nofollow</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input type="checkbox" checked={linkOptions.sponsored} onChange={e => setLinkOptions({...linkOptions, sponsored: e.target.checked})} className="rounded text-blue-600" />
                  <span className="text-[10px] font-bold text-slate-600 group-hover:text-slate-900 flex items-center gap-1.5"><DollarSign size={12}/> Liên kết tài trợ (sponsored)</span>
                </label>
              </div>

              <button 
                onClick={confirmAddLink}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl text-xs font-black shadow-lg shadow-blue-500/20 transition-all"
              >
                Gắn liên kết
              </button>
           </div>
        </div>
      )}

      <div className="flex-grow overflow-y-auto no-scrollbar p-5 space-y-6">
          {/* AI AUTO TAXONOMY DISPLAY */}
          <div className="bg-slate-900 rounded-xl p-4 border border-slate-700 shadow-xl">
             <div className="flex items-center gap-2 mb-3">
                <Zap className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                <h3 className="text-[11px] font-black text-slate-300 uppercase tracking-[0.2em]">Hệ thống Phân loại AI</h3>
             </div>
             
             <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                <TaxonomyBadge label="Intent" value={tax.intent} icon={<Target size={12}/>} color="blue" />
                <TaxonomyBadge label="Loại bài" value={tax.contentType} icon={<Layers size={12}/>} color="purple" />
                <TaxonomyBadge label="Phễu" value={tax.funnelStage} icon={<Compass size={12}/>} color="orange" />
                <TaxonomyBadge label="Ngành" value={tax.industry} icon={<Globe size={12}/>} color="green" />
                <TaxonomyBadge label="Sub-ngành" value={tax.subIndustry} icon={<Tag size={12}/>} color="slate" />
                <TaxonomyBadge label="Mục tiêu" value={tax.seoGoal} icon={<Zap size={12}/>} color="yellow" />
             </div>
          </div>

          {/* METADATA INPUTS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-2"><Tag size={12}/> Từ khóa chính</label>
                <input
                  type="text" value={data.focusKeyword}
                  onChange={(e) => handleChange('focusKeyword', e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-2"><Globe size={12}/> URL Slug</label>
                <input
                  type="text" value={data.slug}
                  onChange={(e) => handleChange('slug', e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg text-sm bg-slate-50"
                />
              </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-2"><Type size={12}/> SEO Title</label>
            <input
              type="text" value={data.seoTitle}
              onChange={(e) => handleChange('seoTitle', e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* RICH TEXT EDITOR */}
          <div className="space-y-1 flex flex-col min-h-[500px]">
            <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-2"><AlignLeft size={12}/> Nội dung bài viết (Chấp nhận Link & Ảnh)</label>
            <div className="flex-grow border border-slate-300 rounded-lg overflow-hidden flex flex-col shadow-inner">
               <div className="bg-slate-50 border-b border-slate-200 p-2 flex gap-1 flex-wrap items-center">
                  <button onClick={() => execCommand('bold')} className="p-1.5 hover:bg-white hover:shadow-sm rounded transition-all" title="In đậm"><Bold size={16}/></button>
                  <button onClick={() => execCommand('italic')} className="p-1.5 hover:bg-white hover:shadow-sm rounded transition-all" title="In nghiêng"><Italic size={16}/></button>
                  <div className="w-px h-4 bg-slate-300 mx-1"></div>
                  <button onClick={() => execCommand('formatBlock', 'H2')} className="p-1.5 hover:bg-white hover:shadow-sm rounded transition-all" title="Thẻ H2"><Heading2 size={16}/></button>
                  <button onClick={() => execCommand('formatBlock', 'H3')} className="p-1.5 hover:bg-white hover:shadow-sm rounded transition-all" title="Thẻ H3"><Heading3 size={16}/></button>
                  <div className="w-px h-4 bg-slate-300 mx-1"></div>
                  <button onClick={openLinkModal} className="p-1.5 hover:bg-white hover:shadow-sm rounded transition-all text-blue-600" title="Gắn liên kết (Yoast Style)"><LinkIcon size={16}/></button>
                  <button onClick={addImage} className="p-1.5 hover:bg-white hover:shadow-sm rounded transition-all text-purple-600" title="Chèn Hình ảnh"><ImageIcon size={16}/></button>
               </div>
               <div 
                  ref={editorRef}
                  contentEditable
                  onInput={(e) => handleChange('content', e.currentTarget.innerHTML)}
                  onPaste={handlePaste}
                  className="flex-grow p-5 outline-none font-sans leading-relaxed overflow-y-auto prose prose-blue max-w-none"
                  style={{ minHeight: '350px' }}
               />
            </div>
          </div>

          {/* AI OPTIMIZER SECTION */}
          <div className="bg-white border-2 border-blue-100 rounded-2xl p-5 shadow-lg shadow-blue-500/5 space-y-4">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-blue-600" />
                    <h2 className="text-sm font-black text-slate-800 uppercase tracking-wide">AI Content Optimizer</h2>
                </div>
                {!aiResult ? (
                    <button 
                        onClick={handleAIRequest}
                        disabled={aiLoading}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 transition-all disabled:opacity-50"
                    >
                        {aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                        {aiLoading ? "Đang phân tích..." : "Tối ưu bằng AI"}
                    </button>
                ) : (
                    <div className="flex bg-slate-100 p-1 rounded-full border border-slate-200">
                        <button onClick={() => setViewMode('original')} className={`px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 transition-all ${viewMode === 'original' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}><History size={12} /> Bài gốc</button>
                        <button onClick={() => setViewMode('diff')} className={`px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 transition-all ${viewMode === 'diff' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}><FileEdit size={12} /> Bản sửa (Diff)</button>
                    </div>
                )}
             </div>

             {aiResult && (
                 <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                        <h4 className="text-[10px] font-black text-blue-800 uppercase mb-2">Gợi ý từ chuyên gia SEO:</h4>
                        <ul className="space-y-1">
                            {aiResult.suggestions.map((s, i) => (
                                <li key={i} className="text-[11px] text-blue-700 flex items-start gap-2">
                                    <span className="mt-1 flex-shrink-0 w-1 h-1 rounded-full bg-blue-400"></span>
                                    {s}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="relative border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                        <div className="max-h-[300px] overflow-y-auto p-4 text-sm font-sans leading-relaxed prose prose-slate">
                            {viewMode === 'original' ? <div dangerouslySetInnerHTML={{ __html: data.content }} /> : <div dangerouslySetInnerHTML={{ __html: aiResult.enhancedContent }} />}
                        </div>
                        <div className="absolute top-2 right-2 flex gap-1">
                            <button onClick={applyAIContent} className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg shadow-lg flex items-center gap-2 text-xs font-bold transition-all"><Check size={14} /> Chấp nhận</button>
                            <button onClick={() => setAiResult(null)} className="bg-white border border-slate-200 p-2 rounded-lg text-slate-500 hover:bg-slate-50 shadow-sm transition-all"><Copy size={14} /></button>
                        </div>
                    </div>
                 </div>
             )}
          </div>
      </div>
    </div>
  );
});

const TaxonomyBadge = ({ label, value, icon, color }: { label: string, value: string, icon: any, color: string }) => {
  const colors: any = {
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    orange: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    green: 'bg-green-500/10 text-green-400 border-green-500/20',
    slate: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    yellow: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  };
  return (
    <div className={`flex flex-col p-2 rounded-lg border ${colors[color]} gap-1`}>
      <span className="text-[8px] font-bold uppercase opacity-60 flex items-center gap-1">{icon} {label}</span>
      <span className="text-[10px] font-black truncate">{value}</span>
    </div>
  );
};

export default InputSection;
