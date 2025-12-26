
import React, { useState } from 'react';
import { AnalysisResult, Impact, AuditItem } from '../types';
import { 
  BarChart, Activity, FileCheck, Eye, Layers, AlertTriangle, 
  CheckCircle, XCircle, HelpCircle, ArrowRightCircle, Info, LucideIcon, Copy
} from 'lucide-react';

interface Props {
  results: AnalysisResult;
  onFixClick?: (id: string) => void;
}

const Dashboard: React.FC<Props> = ({ results, onFixClick }) => {
  const [activeTab, setActiveTab] = useState<'ranking' | 'checklist' | 'faq'>('ranking');

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 50) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };
  
  const getTrafficLight = (passed: boolean, score: number) => {
    if (passed) return 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]';
    if (score >= 40) return 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.4)]';
    return 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]';
  };

  const getScoreRing = (score: number) => {
      if (score >= 80) return 'stroke-green-500';
      if (score >= 50) return 'stroke-orange-500';
      return 'stroke-red-500';
  };

  const getImpactBadge = (impact: Impact) => {
    switch(impact) {
      case Impact.HIGH: return <span className="px-1.5 py-0.5 rounded-[4px] text-[8px] font-bold bg-red-100 text-red-700 uppercase">Ưu tiên 1</span>;
      case Impact.MEDIUM: return <span className="px-1.5 py-0.5 rounded-[4px] text-[8px] font-bold bg-orange-100 text-orange-700 uppercase">Ưu tiên 2</span>;
      case Impact.LOW: return <span className="px-1.5 py-0.5 rounded-[4px] text-[8px] font-bold bg-slate-100 text-slate-700 uppercase">Ưu tiên 3</span>;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 h-full overflow-hidden flex flex-col">
      {/* Header Tabs */}
      <div className="flex border-b border-slate-200 bg-slate-50/50">
        <button 
          onClick={() => setActiveTab('ranking')}
          className={`flex-1 py-3 text-[11px] font-bold flex flex-col items-center justify-center gap-1 transition-colors ${activeTab === 'ranking' ? 'text-blue-600 border-b-2 border-blue-600 bg-white' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          <Activity className="w-3.5 h-3.5" /> Tổng Quan
        </button>
        <button 
          onClick={() => setActiveTab('checklist')}
          className={`flex-1 py-3 text-[11px] font-bold flex flex-col items-center justify-center gap-1 transition-colors ${activeTab === 'checklist' ? 'text-blue-600 border-b-2 border-blue-600 bg-white' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          <FileCheck className="w-3.5 h-3.5" /> Checklist SEO
        </button>
         <button 
          onClick={() => setActiveTab('faq')}
          className={`flex-1 py-3 text-[11px] font-bold flex flex-col items-center justify-center gap-1 transition-colors ${activeTab === 'faq' ? 'text-blue-600 border-b-2 border-blue-600 bg-white' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          <HelpCircle className="w-3.5 h-3.5" /> FAQ & Schema
        </button>
      </div>

      <div className="flex-grow overflow-y-auto no-scrollbar p-4">
        
        {/* TAB: RANKING */}
        {activeTab === 'ranking' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center justify-center flex-col py-2">
               <div className="relative w-32 h-32 flex items-center justify-center">
                 <svg className="w-full h-full transform -rotate-90">
                   <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="10" fill="transparent" className="text-slate-100" />
                   <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="10" fill="transparent" 
                     strokeDasharray={352} 
                     strokeDashoffset={352 - (352 * results.totalScore) / 100} 
                     className={`${getScoreRing(results.totalScore)} transition-all duration-1000 ease-out`} 
                   />
                 </svg>
                 <div className="absolute flex flex-col items-center">
                   <span className="text-3xl font-black text-slate-800">{results.totalScore}</span>
                   <span className="text-[8px] text-slate-500 uppercase font-bold tracking-widest">SEO Health</span>
                 </div>
               </div>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {[
                { label: 'SEO Analysis', val: results.breakdown.onPage, icon: <BarChart className="w-3 h-3"/>, color: 'bg-green-500' },
                { label: 'Readability', val: results.breakdown.readability, icon: <Eye className="w-3 h-3"/>, color: 'bg-blue-500' },
                { label: 'E-E-A-T Signal', val: results.breakdown.eeat, icon: <FileCheck className="w-3 h-3"/>, color: 'bg-purple-500' },
                { label: 'Search Intent', val: results.breakdown.intent, icon: <Layers className="w-3 h-3"/>, color: 'bg-indigo-500' }
              ].map((s) => (
                <div key={s.label} className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1.5">{s.icon} {s.label}</span>
                    <span className={`text-[11px] font-bold ${getScoreColor(s.val).split(' ')[0]}`}>{s.val}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-1">
                    <div className={`${s.color} h-1 rounded-full transition-all duration-500`} style={{ width: `${s.val}%` }}></div>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2">
               <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1 flex justify-between items-center">
                 <span>Điểm cần cải thiện</span>
                 <AlertTriangle size={12} className="text-orange-400" />
               </h3>
               {results.priorityFixes.length === 0 ? (
                 <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-[11px] font-bold flex items-center gap-2">
                   <CheckCircle className="w-4 h-4"/> Tuyệt vời! Bài viết đã chuẩn SEO.
                 </div>
               ) : (
                 results.priorityFixes.slice(0, 3).map((item) => (
                    <div 
                      key={item.id} 
                      onClick={() => { setActiveTab('checklist'); onFixClick?.(item.id); }}
                      className="p-3 bg-white border border-slate-200 rounded-xl flex items-start gap-3 cursor-pointer hover:border-blue-300 hover:shadow-md transition-all group"
                    >
                      <div className={`w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0 ${getTrafficLight(item.passed, item.score)}`} />
                      <div className="flex-grow">
                         <div className="flex items-center justify-between mb-0.5">
                            <span className="font-bold text-[11px] text-slate-800">{item.label}</span>
                            {getImpactBadge(item.impact)}
                         </div>
                         <p className="text-[10px] text-slate-500 line-clamp-2">{item.message}</p>
                      </div>
                    </div>
                 ))
               )}
            </div>
          </div>
        )}

        {/* TAB: CHECKLIST (YOAST STYLE) */}
        {activeTab === 'checklist' && (
           <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
             {['onpage', 'readability', 'eeat'].map((category) => {
               const items = results.auditItems.filter(i => {
                  if (category === 'onpage') return i.category === 'onpage' || i.category === 'intent';
                  if (category === 'readability') return i.category === 'readability';
                  return i.category === category;
               });
               if (items.length === 0) return null;
               
               let title = '';
               switch(category) {
                 case 'onpage': title = 'SEO Analysis'; break;
                 case 'readability': title = 'Readability Analysis'; break;
                 case 'eeat': title = 'Trust & Quality (E-E-A-T)'; break;
               }

               return (
                 <div key={category} className="space-y-3">
                   <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-wider pb-1 border-b-2 border-slate-100 flex items-center gap-2">
                     {category === 'onpage' ? <Activity size={14} className="text-blue-500" /> : <Eye size={14} className="text-purple-500" />}
                     {title}
                   </h3>
                   <div className="space-y-1">
                      {items.map(item => (
                        <div 
                            key={item.id} 
                            className="group flex items-start gap-3 py-2 px-1 hover:bg-slate-50 rounded-lg transition-colors cursor-default"
                        >
                            <div className={`w-3 h-3 rounded-full mt-1 flex-shrink-0 transition-transform group-hover:scale-110 ${getTrafficLight(item.passed, item.score)}`} />
                            <div className="flex-grow min-w-0">
                                <div className="flex justify-between items-center">
                                    <p className={`text-[11px] font-bold ${item.passed ? 'text-slate-600' : 'text-slate-800'}`}>{item.label}</p>
                                    <span className="text-[9px] font-bold text-slate-400 opacity-0 group-hover:opacity-100 uppercase tracking-tighter transition-opacity">
                                        {item.impact === Impact.HIGH ? 'Critical' : 'Moderate'}
                                    </span>
                                </div>
                                <p className="text-[10px] text-slate-500 leading-relaxed mt-0.5">{item.message}</p>
                            </div>
                        </div>
                      ))}
                   </div>
                 </div>
               )
             })}
           </div>
        )}

         {/* TAB: FAQ */}
         {activeTab === 'faq' && (
           <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
             <div className="p-4 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl text-white shadow-lg shadow-blue-200">
                <div className="flex items-center gap-2 mb-2">
                    <Info size={16} />
                    <h4 className="text-xs font-bold uppercase tracking-widest">Helpful Content Tip</h4>
                </div>
                <p className="text-[11px] font-medium leading-relaxed opacity-90">
                  Google đánh giá cao các nội dung giải đáp trực tiếp thắc mắc của người dùng qua FAQ Section. Hãy chèn các câu hỏi này vào cuối bài viết.
                </p>
             </div>

             <div className="space-y-3">
               <div className="flex items-center justify-between px-1">
                  <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Gợi ý FAQ Entity</h3>
                  <span className="text-[9px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 font-bold uppercase">Auto-Generated</span>
               </div>
               <div className="space-y-2">
                  {results.faqSuggestions.map((q, idx) => (
                    <div 
                        key={idx} 
                        className="p-3 bg-white border border-slate-200 rounded-xl text-[11px] font-bold text-slate-700 hover:border-blue-400 hover:bg-blue-50/30 transition-all group cursor-pointer flex justify-between items-center"
                        onClick={() => {navigator.clipboard.writeText(q)}}
                    >
                      <span>{q}</span>
                      <Copy size={12} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                    </div>
                  ))}
               </div>
             </div>

             <button 
                onClick={() => {
                    const schema = `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    ${results.faqSuggestions.map(q => `{
      "@type": "Question",
      "name": "${q}",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "..."
      }
    }`).join(',\n    ')}
  ]
}
</script>`;
                    navigator.clipboard.writeText(schema);
                    alert("Đã copy Schema JSON-LD vào clipboard!");
                }}
                className="w-full py-3 bg-slate-900 text-white rounded-xl text-[11px] font-bold hover:bg-slate-800 transition-all active:scale-[0.98] shadow-lg shadow-slate-200 flex items-center justify-center gap-2"
               >
                 <FileCheck size={14} /> Copy FAQ Schema (JSON-LD)
               </button>
           </div>
         )}

      </div>
    </div>
  );
};

export default Dashboard;
