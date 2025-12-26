
export enum SearchIntent {
  INFORMATIONAL = 'Informational',
  COMMERCIAL = 'Commercial Investigation',
  TRANSACTIONAL = 'Transactional',
  NAVIGATIONAL = 'Navigational',
}

export interface ContentTaxonomy {
  intent: SearchIntent;
  contentType: string;
  funnelStage: 'TOFU' | 'MOFU' | 'BOFU';
  industry: string;
  subIndustry: string;
  seoGoal: 'Traffic' | 'Conversion' | 'Brand / Trust';
}

export interface SEOInput {
  focusKeyword: string;
  secondaryKeywords: string;
  seoTitle: string;
  slug: string;
  metaDescription: string;
  content: string;
  intent: SearchIntent; // For manual override if needed, but we'll prioritize auto
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
  score: number;
  message: string;
  impact: Impact;
  category: 'intent' | 'onpage' | 'eeat' | 'ctr' | 'readability';
}

export interface AnalysisResult {
  totalScore: number;
  breakdown: {
    intent: number;
    onPage: number;
    eeat: number;
    ctr: number;
    readability: number;
  };
  auditItems: AuditItem[];
  priorityFixes: AuditItem[];
  faqSuggestions: string[];
  taxonomy: ContentTaxonomy; // New field for auto-detected labels
}
