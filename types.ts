export enum SearchIntent {
  INFORMATIONAL = 'Informational',
  COMMERCIAL = 'Commercial',
  TRANSACTIONAL = 'Transactional',
  LOCAL = 'Local SEO',
}

export interface SEOInput {
  focusKeyword: string;
  secondaryKeywords: string; // Comma separated
  seoTitle: string;
  slug: string;
  metaDescription: string;
  content: string;
  intent: SearchIntent;
}

export enum Impact {
  HIGH = 'High',
  MEDIUM = 'Medium',
  LOW = 'Low',
}

export interface AuditItem {
  id: string;
  label: string;
  passed: boolean;
  score: number; // 0-100 contribution
  message: string;
  impact: Impact;
  category: 'intent' | 'onpage' | 'eeat' | 'ctr' | 'readability';
}

export interface AnalysisResult {
  totalScore: number;
  breakdown: {
    intent: number; // 30%
    onPage: number; // 25%
    eeat: number; // 20%
    ctr: number; // 15%
    readability: number; // 10%
  };
  auditItems: AuditItem[];
  priorityFixes: AuditItem[];
  faqSuggestions: string[];
}
