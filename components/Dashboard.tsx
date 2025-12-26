import React, { useState } from 'react';
import { AnalysisResult, Impact } from '../types';
import { 
  BarChart, Activity, FileCheck, Eye, Layers, AlertTriangle, 
  CheckCircle, XCircle, ChevronRight, HelpCircle, ArrowRightCircle
} from 'lucide-react';

interface Props {
  results: AnalysisResult;
  onFixClick?: (id: string) => void;
}

const Dashboard: React.FC<Props> = ({ results, onFixClick }) => {
  const [activeTab, setActiveTab] = useState<'ranking' | 'checklist' | 'faq'>('ranking');

  // IDs of items that support highlighting in the editor
  const HIGHLIGHTABLE_IDS = [
    'key-density', 'key-intro', 'headings', 'read-para', 
    'link-anchor', 'link-pos-int', 'link-pos-ext', 'read-list'
  ];

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 50) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };
  
  const getScoreRing = (score: number) => {
      if (score >= 80) return 'stroke-green-500';
      if (score >= 50) return 'stroke-orange-500';
      return 'stroke-red-500';
  };

  const getImpactBadge = (impact: Impact) => {
    switch(impact) {
      case Impact.HIGH: return <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-700 border border-red-200">Cao</span>;
      case Impact.MEDIUM: return <span className="px-2 py-0.5 rounded text-xs font-bold bg-orange-100 text-orange-700 border border-orange-200">Vừa</span>;
      case Impact.LOW: return <span className="px-2 py-0.5 rounded text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">Thấp</span>;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 h-full overflow-hidden flex flex-col">
      {/* Header Tabs */}
      <div className="flex border-b border-slate-200">
        <button 
          onClick={() => setActiveTab('ranking')}
          className={`flex-1 py-4 text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${activeTab === 'ranking' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-slate-600 hover:bg-slate-50'}`}
        >
          <Activity className="w-4 h-4" /> Tổng Quan
        </button>
        <button 
          onClick={() => setActiveTab('checklist')}
          className={`flex-1 py-4 text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${activeTab === 'checklist' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-slate-600 hover:bg-slate-50'}`}
        >
          <FileCheck className="w-4 h-4" /> Checklist
        </button>
         <button 
          onClick={() => setActiveTab('faq')}
          className={`flex-1 py-4 text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${activeTab === 'faq' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-slate-600 hover:bg-slate-50'}`}
        >
          <HelpCircle className="w-4 h-4" /> Gợi Ý FAQ
        </button>
      </div>

      <div className="flex-grow overflow-y-auto custom-scrollbar p-6">
        
        {/* TAB: RANKING */}
        {activeTab === 'ranking' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Main Score */}
            <div className="flex items-center justify-center flex-col py-4">
               <div className="relative w-40 h-40 flex items-center justify-center">
                 <svg className="w-full h-full transform -rotate-90">
                   <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-100" />
                   <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="12" fill="transparent" 
                     strokeDasharray={440} 
                     strokeDashoffset={440 - (440 * results.totalScore) / 100} 
                     className={`${getScoreRing(results.totalScore)} transition-all duration-1000 ease-out`} 
                   />
                 </svg>
                 <div className="absolute flex flex-col items-center">
                   <span className="text-4xl font-black text-slate-800">{results.totalScore}</span>
                   <span className="text-xs text-slate-500 uppercase font-semibold">Ranking Score</span>
                 </div>
               </div>
               <p className="mt-2 text-sm text-slate-500 text-center max-w-xs">
                 {results.totalScore > 80 ? 'Tuyệt vời! Bài viết có khả năng lên Top cao.' : results.totalScore > 50 ? 'Khá ổn, nhưng cần tối ưu thêm để cạnh tranh.' : 'Cần cải thiện nhiều yếu tố quan trọng.'}
               </p>
            </div>

            {/* Sub Scores Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1"><Layers className="w-3 h-3"/> Intent & Depth</span>
                  <span className={`text-sm font-bold ${getScoreColor(results.breakdown.intent).split(' ')[0]}`}>{results.breakdown.intent}/100</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1.5">
                  <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${results.breakdown.intent}%` }}></div>
                </div>
              </div>
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1"><BarChart className="w-3 h-3"/> On-Page SEO</span>
                  <span className={`text-sm font-bold ${getScoreColor(results.breakdown.onPage).split(' ')[0]}`}>{results.breakdown.onPage}/100</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1.5">
                  <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${results.breakdown.onPage}%` }}></div>
                </div>
              </div>
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1"><FileCheck className="w-3 h-3"/> E-E-A-T</span>
                  <span className={`text-sm font-bold ${getScoreColor(results.breakdown.eeat).split(' ')[0]}`}>{results.breakdown.eeat}/100</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1.5">
                  <div className="bg-purple-500 h-1.5 rounded-full" style={{ width: `${results.breakdown.eeat}%` }}></div>
                </div>
              </div>
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1"><Eye className="w-3 h-3"/> CTR & UX</span>
                  <span className={`text-sm font-bold ${getScoreColor(results.breakdown.ctr).split(' ')[0]}`}>{results.breakdown.ctr}/100</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1.5">
                  <div className="bg-pink-500 h-1.5 rounded-full" style={{ width: `${results.breakdown.ctr}%` }}></div>
                </div>
              </div>
            </div>

            {/* Top Priority Fixes */}
            <div className="space-y-3">
               <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">🔥 Cần Sửa Ngay (Priority Fixes)</h3>
               {results.priorityFixes.length === 0 ? (
                 <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-center gap-2">
                   <CheckCircle className="w-5 h-5"/> Bài viết đã được tối ưu rất tốt!
                 </div>
               ) : (
                 results.priorityFixes.map((item) => (
                    <div 
                      key={item.id} 
                      onClick={() => onFixClick?.(item.id)}
                      className="p-3 bg-red-50 border border-red-100 rounded-lg flex items-start gap-3 cursor-pointer hover:bg-red-100 transition-colors group"
                      title="Click để sửa lỗi này"
                    >
                      <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <div className="flex-grow">
                        <div className="flex items-center justify-between mb-1">
                           <span className="font-bold text-sm text-slate-800 group-hover:text-red-700 transition-colors flex items-center gap-1">
                             {item.label} <ArrowRightCircle className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                           </span>
                           <div className="flex items-center gap-2">
                             {HIGHLIGHTABLE_IDS.includes(item.id) && (
                                <button className="p-1 hover:bg-red-200 rounded text-red-600 transition-colors" title="Xem vị trí trong bài viết">
                                    <Eye size={14} />
                                </button>
                             )}
                             {getImpactBadge(item.impact)}
                           </div>
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed">{item.message}</p>
                      </div>
                    </div>
                 ))
               )}
            </div>
          </div>
        )}

        {/* TAB: CHECKLIST */}
        {activeTab === 'checklist' && (
           <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
             {['intent', 'onpage', 'eeat', 'ctr', 'readability'].map((category) => {
               const items = results.auditItems.filter(i => i.category === category);
               if (items.length === 0) return null;
               
               let title = '';
               switch(category) {
                 case 'intent': title = 'Search Intent & Depth'; break;
                 case 'onpage': title = 'On-Page SEO'; break;
                 case 'eeat': title = 'E-E-A-T Signals'; break;
                 case 'ctr': title = 'CTR Optimization'; break;
                 case 'readability': title = 'Readability & UX'; break;
               }

               return (
                 <div key={category} className="space-y-3">
                   <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">{title}</h3>
                   {items.map(item => (
                     <div 
                        key={item.id} 
                        className={`p-3 rounded-lg border flex items-start gap-3 transition-colors ${item.passed ? 'bg-white border-slate-100' : 'bg-slate-50 border-slate-200 hover:border-blue-300'}`}
                     >
                        {item.passed ? (
                          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        ) : (
                          <XCircle className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
                        )}
                        <div className="flex-grow">
                          <div className="flex justify-between items-start">
                             <p className={`text-sm font-medium ${item.passed ? 'text-slate-700' : 'text-slate-900'}`}>{item.label}</p>
                             <div className="flex items-center gap-2">
                                {/* Eye Button for highlighting */}
                                {HIGHLIGHTABLE_IDS.includes(item.id) && (
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); onFixClick?.(item.id); }}
                                        className={`p-1 rounded transition-colors ${item.passed ? 'text-slate-400 hover:text-blue-600 hover:bg-slate-100' : 'text-slate-500 hover:text-blue-600 hover:bg-slate-200'}`}
                                        title="Đánh dấu vị trí trong bài viết"
                                    >
                                        <Eye size={16} />
                                    </button>
                                )}
                                {!item.passed && getImpactBadge(item.impact)}
                             </div>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">{item.message}</p>
                        </div>
                     </div>
                   ))}
                 </div>
               )
             })}
           </div>
        )}

         {/* TAB: FAQ */}
         {activeTab === 'faq' && (
           <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
             <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
                <h4 className="font-bold text-blue-800 text-sm mb-2 flex items-center gap-2">
                  <HelpCircle className="w-4 h-4"/> Tại sao cần FAQ?
                </h4>
                <p className="text-xs text-blue-700 leading-relaxed">
                  FAQ giúp tăng độ phủ từ khóa (Long-tail keywords), tăng tín hiệu Helpful Content, và có cơ hội hiển thị FAQ Schema trên Google Search.
                </p>
             </div>

             <div className="space-y-4">
               <h3 className="text-sm font-bold text-slate-800 uppercase">Gợi ý câu hỏi cho "{results.priorityFixes.length > 0 ? '...' : 'bài viết này'}"</h3>
               {results.faqSuggestions.length > 0 ? (
                 results.faqSuggestions.map((q, idx) => (
                   <div key={idx} className="p-3 bg-white border border-slate-200 rounded-lg shadow-sm hover:border-blue-300 transition-colors group cursor-pointer"
                        onClick={() => {navigator.clipboard.writeText(q)}}
                        title="Click để copy"
                   >
                     <div className="flex justify-between items-center">
                       <span className="text-sm font-medium text-slate-700 group-hover:text-blue-700">{q}</span>
                       <span className="text-xs text-slate-400 opacity-0 group-hover:opacity-100">Copy</span>
                     </div>
                   </div>
                 ))
               ) : (
                 <p className="text-sm text-slate-500 italic">Hãy nhập từ khóa chính để nhận gợi ý FAQ.</p>
               )}
             </div>

             <div className="mt-6 pt-6 border-t border-slate-100">
                <h3 className="text-sm font-bold text-slate-800 uppercase mb-3">Schema FAQ Template</h3>
                <div className="bg-slate-900 rounded-lg p-4 overflow-x-auto">
                  <code className="text-xs text-green-400 font-mono">
                    {`{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    ${results.faqSuggestions.map(q => `{
      "@type": "Question",
      "name": "${q}",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Trả lời ngắn gọn 40-80 từ vào đây..."
      }
    }`).join(',\n    ')}
  ]
}`}
                  </code>
                </div>
             </div>
           </div>
         )}

      </div>
    </div>
  );
};

export default Dashboard;