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
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-100">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg text-white shadow-lg shadow-blue-500/30">
              <Rocket className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800 leading-tight">SEO Master Vietnam</h1>
              <p className="text-xs text-slate-500 font-medium">Ranking System Simulator</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <div className="hidden md:flex items-center gap-2 text-xs font-semibold px-3 py-1.5 bg-slate-100 rounded-full text-slate-600">
                <span>Core Update Ready</span>
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
             </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-[calc(100vh-64px)] overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
          
          {/* Left Column: Input (Editor) */}
          <div className="lg:col-span-7 h-full flex flex-col min-h-0">
             <InputSection 
                ref={inputSectionRef}
                data={inputData} 
                onChange={setInputData} 
             />
          </div>

          {/* Right Column: Analysis (Dashboard) */}
          <div className="lg:col-span-5 h-full flex flex-col min-h-0">
            <Dashboard 
                results={analysisResults} 
                onFixClick={handleFixClick}
            />
          </div>

        </div>
      </main>
    </div>
  );
};

export default App;