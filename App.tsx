import React, { useState, useEffect, useMemo, useRef } from 'react';
import InputSection, { InputSectionHandle } from './components/InputSection';
import Dashboard from './components/Dashboard';
import { AnalysisResult, SearchIntent, SEOInput } from './types';
import { analyzeContent } from './services/seoEngine';
import { Rocket } from 'lucide-react';

const initialInput: SEOInput = {
  focusKeyword: '',
  secondaryKeywords: '',
  seoTitle: '',
  slug: '',
  metaDescription: '',
  content: '',
  intent: SearchIntent.INFORMATIONAL
};

const App: React.FC = () => {
  const [inputData, setInputData] = useState<SEOInput>(initialInput);
  const inputSectionRef = useRef<InputSectionHandle>(null);
  
  // Real-time analysis with memoization for performance
  const analysisResults: AnalysisResult = useMemo(() => {
    return analyzeContent(inputData);
  }, [inputData]);

  const handleFixClick = (id: string) => {
    inputSectionRef.current?.focusField(id);
  };

  return (
    <div className="h-screen flex flex-col bg-slate-100 text-slate-900 font-sans selection:bg-blue-100 overflow-hidden">
      {/* Navbar - Fixed height */}
      <nav className="bg-white border-b border-slate-200 shrink-0 shadow-sm z-50">
        <div className="max-w-full mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-1.5 rounded-lg text-white shadow-lg shadow-blue-500/30">
              <Rocket className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-800 leading-tight">SEO Master Vietnam</h1>
              <p className="text-[10px] text-slate-500 font-medium">Ranking System Simulator (Helpful Content V3)</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <div className="hidden md:flex items-center gap-2 text-[10px] font-bold px-3 py-1 bg-green-50 border border-green-100 rounded-full text-green-700">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
                </span>
                <span>Hệ thống chấm điểm Real-time</span>
             </div>
          </div>
        </div>
      </nav>

      {/* Main Content Area - Split View */}
      <main className="flex-grow flex overflow-hidden p-3 gap-3 w-full">
        
        {/* Left Half: Content & Config - FLEX GROW */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-grow overflow-hidden flex flex-col bg-white rounded-xl shadow-sm border border-slate-200">
             <InputSection 
                ref={inputSectionRef}
                data={inputData} 
                onChange={setInputData} 
             />
          </div>
        </div>

        {/* Right Half: Scoring & Audit - NARROWER WIDTH */}
        <div className="w-[320px] xl:w-[380px] shrink-0 flex flex-col min-w-0">
          <div className="flex-grow overflow-hidden flex flex-col bg-white rounded-xl shadow-sm border border-slate-200">
            <Dashboard 
                results={analysisResults} 
                onFixClick={handleFixClick}
            />
          </div>
        </div>

      </main>
      
      {/* Tiny Footer */}
      <footer className="bg-white border-t border-slate-200 py-1 px-6 text-[10px] text-slate-400 shrink-0 flex justify-between">
          <span>&copy; 2025 SEO Master Vietnam - Advanced Ranking Analysis</span>
          <span>Google Search Quality Guidelines (Helpful Content) 2024 Updated</span>
      </footer>
    </div>
  );
};

export default App;