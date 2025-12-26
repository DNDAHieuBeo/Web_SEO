import { AnalysisResult, AuditItem, Impact, SearchIntent, SEOInput } from '../types';

// Helper: Remove Vietnamese accents for loose matching
const removeAccents = (str: string) => {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
};

const countOccurrences = (source: string, term: string): number => {
  if (!term || !source) return 0;
  const regex = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
  return (source.match(regex) || []).length;
};

const getWordCount = (text: string): number => {
  return text.replace(/<[^>]*>/g, ' ').trim().split(/\s+/).length;
};

// --- Link Analysis Types & Helpers ---

interface LinkData {
    href: string;
    anchor: string;
    type: 'internal' | 'external';
    location: 'intro' | 'body' | 'conclusion';
    isGeneric: boolean;
}

const GENERIC_ANCHORS = [
    'tại đây', 'tai day', 'xem tại đây', 'xem tai day', 'bấm vào đây', 'bam vao day', 
    'click here', 'click tại đây', 'xem thêm', 'xem them', 'chi tiết', 'chi tiet', 
    'đọc thêm', 'doc them', 'link', 'trang này'
];

const analyzeLinks = (htmlContent: string): LinkData[] => {
    const links: LinkData[] = [];
    const totalLen = htmlContent.length;
    const introLimit = totalLen * 0.15; // First 15% is Intro
    const conclusionLimit = totalLen * 0.85; // Last 15% is Conclusion

    // Regex to capture <a> tag, href, and anchor text
    // Group 1: Quote type
    // Group 2: HREF
    // Group 3: Content (Anchor)
    const regex = /<a\s+(?:[^>]*?\s+)?href=(["'])(.*?)\1[^>]*>(.*?)<\/a>/gi;
    let match;

    while ((match = regex.exec(htmlContent)) !== null) {
        const href = match[2];
        const anchor = match[3].replace(/<[^>]*>/g, '').trim(); // Remove nested tags in anchor
        const index = match.index;

        // Determine Type (Heuristic: / is internal, http is external)
        const type = (href.startsWith('/') || href.startsWith('#') || href.startsWith('.')) ? 'internal' : 'external';

        // Determine Location
        let location: 'intro' | 'body' | 'conclusion' = 'body';
        if (index < introLimit) location = 'intro';
        else if (index > conclusionLimit) location = 'conclusion';

        // Determine Semantics
        const anchorLower = anchor.toLowerCase();
        const isGeneric = GENERIC_ANCHORS.includes(anchorLower) || GENERIC_ANCHORS.some(g => anchorLower === g);

        links.push({ href, anchor, type, location, isGeneric });
    }

    return links;
};

// --- Analysis Logic ---

export const analyzeContent = (input: SEOInput): AnalysisResult => {
  const auditItems: AuditItem[] = [];
  const rawContent = input.content; 
  const contentLower = rawContent.toLowerCase();
  const focusKeyLower = input.focusKeyword.toLowerCase();
  const secondaryKeys = input.secondaryKeywords.split(',').map(k => k.trim()).filter(k => k.length > 0);
  const wordCount = getWordCount(rawContent);

  // Weights
  const W_INTENT = 0.30;
  const W_ONPAGE = 0.25;
  const W_EEAT = 0.20;
  const W_CTR = 0.15;
  const W_READ = 0.10;

  // 1. INTENT & DEPTH (30%)
  let intentScore = 0;
  
  // Check required sections based on intent
  let missingSections = [];
  if (input.intent === SearchIntent.COMMERCIAL) {
    if (!contentLower.includes('so sánh') && !contentLower.includes('đánh giá') && !contentLower.includes('ưu điểm')) missingSections.push('So sánh / Đánh giá');
    if (!contentLower.includes('giá') && !contentLower.includes('chi phí')) missingSections.push('Bảng giá / Chi phí');
  } else if (input.intent === SearchIntent.TRANSACTIONAL) {
    if (!contentLower.includes('mua') && !contentLower.includes('liên hệ') && !contentLower.includes('đặt hàng')) missingSections.push('CTA Mua hàng');
    if (!contentLower.includes('bảo hành') && !contentLower.includes('cam kết')) missingSections.push('Chính sách / Bảo hành');
  } else if (input.intent === SearchIntent.INFORMATIONAL) {
    if (!contentLower.includes('là gì') && !contentLower.includes('nguyên nhân') && !contentLower.includes('hướng dẫn')) missingSections.push('Định nghĩa / Hướng dẫn');
  }

  if (missingSections.length > 0) {
    auditItems.push({
      id: 'intent-sections',
      label: 'Intent Sections',
      passed: false,
      score: 0,
      impact: Impact.HIGH,
      message: `Thiếu section quan trọng cho bài viết ${input.intent}: ${missingSections.join(', ')}.`,
      category: 'intent'
    });
  } else {
    auditItems.push({
      id: 'intent-sections',
      label: 'Intent Sections',
      passed: true,
      score: 100,
      impact: Impact.HIGH,
      message: 'Bài viết có đủ các phần cơ bản phù hợp với mục đích tìm kiếm.',
      category: 'intent'
    });
    intentScore += 40;
  }

  // Thin Content Check
  const minWords = input.intent === SearchIntent.INFORMATIONAL ? 1000 : 700;
  if (wordCount < minWords) {
    auditItems.push({
      id: 'thin-content',
      label: 'Content Depth',
      passed: false,
      score: 20, // Partial
      impact: Impact.HIGH,
      message: `Nội dung quá ngắn (${wordCount} từ). Nên đạt tối thiểu ${minWords} từ để cạnh tranh.`,
      category: 'intent'
    });
    intentScore += 20;
  } else {
    auditItems.push({
      id: 'thin-content',
      label: 'Content Depth',
      passed: true,
      score: 100,
      impact: Impact.HIGH,
      message: 'Độ dài nội dung tốt.',
      category: 'intent'
    });
    intentScore += 60;
  }
  
  // 2. ON-PAGE SEO (25%)
  let onPageScore = 0;
  
  // Focus Key in Title
  const titleContainsKeyword = input.seoTitle.toLowerCase().includes(focusKeyLower);
  if (titleContainsKeyword) {
    auditItems.push({ id: 'key-title', label: 'Keyword in Title', passed: true, score: 100, impact: Impact.HIGH, message: 'Từ khóa chính xuất hiện trong tiêu đề.', category: 'onpage' });
    onPageScore += 15;
  } else {
    auditItems.push({ id: 'key-title', label: 'Keyword in Title', passed: false, score: 0, impact: Impact.HIGH, message: 'Thêm từ khóa chính vào SEO Title (gần đầu càng tốt).', category: 'onpage' });
  }

  // Focus Key in First 100 words
  const textContent = rawContent.replace(/<[^>]*>/g, ' ');
  const first100 = textContent.split(/\s+/).slice(0, 100).join(' ').toLowerCase();
  if (first100.includes(focusKeyLower)) {
    auditItems.push({ id: 'key-intro', label: 'Keyword in Intro', passed: true, score: 100, impact: Impact.MEDIUM, message: 'Từ khóa chính xuất hiện trong 100 từ đầu.', category: 'onpage' });
    onPageScore += 10;
  } else {
    auditItems.push({ id: 'key-intro', label: 'Keyword in Intro', passed: false, score: 0, impact: Impact.MEDIUM, message: 'Từ khóa chính nên xuất hiện ngay đoạn mở đầu.', category: 'onpage' });
  }

  // Keyword Density
  const keywordCount = countOccurrences(contentLower, focusKeyLower);
  const density = wordCount > 0 ? (keywordCount / wordCount) * 100 : 0;
  
  if (wordCount <= 20) {
    auditItems.push({ 
        id: 'key-density', 
        label: 'Keyword Density', 
        passed: false, 
        score: 0, 
        impact: Impact.MEDIUM, 
        message: `Bài viết quá ngắn (${wordCount} từ) để tính mật độ. Cần viết trên 20 từ. (Hiện có ${keywordCount} từ khóa).`, 
        category: 'onpage' 
    });
  } else if (density >= 0.5 && density <= 2.5) {
    onPageScore += 15;
    auditItems.push({ 
        id: 'key-density', 
        label: 'Keyword Density', 
        passed: true, 
        score: 100, 
        impact: Impact.MEDIUM, 
        message: `Mật độ từ khóa: Từ khóa được tìm thấy ${keywordCount} lần. Tuyệt vời!`, 
        category: 'onpage' 
    });
  } else {
    const msg = density < 0.5 ? 'Mật độ từ khóa quá thấp' : 'Mật độ từ khóa quá cao (Spam)';
    auditItems.push({ 
        id: 'key-density', 
        label: 'Keyword Density', 
        passed: false, 
        score: 40, 
        impact: Impact.MEDIUM, 
        message: `${msg}. Tìm thấy ${keywordCount} lần (${density.toFixed(1)}%). Lý tưởng: 0.5% - 2.5%.`, 
        category: 'onpage' 
    });
  }

  // Headings check
  const hasH2 = /<h2|##\s/.test(rawContent);
  if (hasH2) {
      onPageScore += 10;
      auditItems.push({ id: 'headings', label: 'Headings Structure', passed: true, score: 100, impact: Impact.HIGH, message: 'Bài viết có sử dụng thẻ H2.', category: 'onpage' });
  } else {
      auditItems.push({ id: 'headings', label: 'Headings Structure', passed: false, score: 0, impact: Impact.HIGH, message: 'Bài viết thiếu thẻ H2. Cấu trúc bài viết cần phân cấp rõ ràng.', category: 'onpage' });
  }

  // --- LINK ANALYSIS START ---
  const allLinks = analyzeLinks(rawContent);
  const internalLinks = allLinks.filter(l => l.type === 'internal');
  const externalLinks = allLinks.filter(l => l.type === 'external');
  
  // 1. Internal Link Quantity
  if (internalLinks.length === 0) {
      auditItems.push({ id: 'link-count', label: 'Internal Links', passed: false, score: 0, impact: Impact.HIGH, message: 'Bài viết KHÔNG CÓ Internal Link nào. Cần ít nhất 1 link trỏ về bài liên quan.', category: 'onpage' });
  } else if (wordCount > 1000 && internalLinks.length < 2) {
      auditItems.push({ id: 'link-count', label: 'Internal Links Quantity', passed: false, score: 50, impact: Impact.MEDIUM, message: `Bài viết dài (${wordCount} từ) nhưng chỉ có ${internalLinks.length} internal link. Nên có 2-5 links.`, category: 'onpage' });
      onPageScore += 5;
  } else {
      auditItems.push({ id: 'link-count', label: 'Internal Links', passed: true, score: 100, impact: Impact.HIGH, message: `Đã có ${internalLinks.length} internal links. Tốt!`, category: 'onpage' });
      onPageScore += 15;
  }

  // 2. Anchor Text Quality
  const genericLinks = allLinks.filter(l => l.isGeneric);
  if (genericLinks.length > 0) {
      auditItems.push({ id: 'link-anchor', label: 'Semantic Anchors', passed: false, score: 0, impact: Impact.MEDIUM, message: `Phát hiện ${genericLinks.length} anchor text chung chung ("${genericLinks[0].anchor}"). Hãy dùng từ khóa có nghĩa.`, category: 'onpage' });
  } else {
      if (allLinks.length > 0) {
        onPageScore += 10;
        auditItems.push({ id: 'link-anchor', label: 'Semantic Anchors', passed: true, score: 100, impact: Impact.MEDIUM, message: 'Anchor text tối ưu, có ngữ nghĩa.', category: 'onpage' });
      }
  }

  // 3. Link Distribution (Internal)
  const internalInBodyOrConclusion = internalLinks.filter(l => l.location === 'body' || l.location === 'conclusion');
  if (internalLinks.length > 0 && internalInBodyOrConclusion.length === 0) {
      auditItems.push({ id: 'link-pos-int', label: 'Internal Link Position', passed: false, score: 0, impact: Impact.LOW, message: 'Internal link nên đặt ở Thân bài hoặc Kết bài để giữ chân người đọc.', category: 'onpage' });
  } else if (internalLinks.length > 0) {
      onPageScore += 10;
  }

  // 4. Link Distribution (External)
  const externalInBody = externalLinks.filter(l => l.location === 'body');
  if (externalLinks.length > 0 && externalInBody.length === 0) {
       // Just a warning, usually external links in intro are risky (leak juice early)
       auditItems.push({ id: 'link-pos-ext', label: 'External Link Position', passed: false, score: 50, impact: Impact.LOW, message: 'Hạn chế External Link ở Mở bài. Nên đặt ở Thân bài để dẫn chứng nguồn.', category: 'onpage' });
  } else if (externalLinks.length > 0) {
       onPageScore += 5;
  }
  // --- LINK ANALYSIS END ---

  // Secondary Keywords Coverage
  let foundSecondary = 0;
  let missingSecondary = [];
  if (secondaryKeys.length > 0) {
    secondaryKeys.forEach(k => {
      if (contentLower.includes(k.toLowerCase())) foundSecondary++;
      else missingSecondary.push(k);
    });
    const secondaryPercentage = (foundSecondary / secondaryKeys.length) * 100;
    onPageScore += (secondaryPercentage * 0.2); // Adjusted weight
    
    if (foundSecondary === secondaryKeys.length) {
         auditItems.push({ id: 'sec-keywords', label: 'LSI / Secondary Keywords', passed: true, score: 100, impact: Impact.MEDIUM, message: 'Đã bao phủ tốt các từ khóa phụ.', category: 'onpage' });
    } else {
         auditItems.push({ id: 'sec-keywords', label: 'LSI / Secondary Keywords', passed: false, score: secondaryPercentage, impact: Impact.MEDIUM, message: `Thiếu từ khóa phụ: ${missingSecondary.join(', ')}. Thêm vào H2/H3.`, category: 'onpage' });
    }
  } else {
     onPageScore += 20; 
  }

  // 3. EEAT SIGNALS (20%)
  let eeatScore = 0;
  
  // Author checks
  const hasAuthor = contentLower.includes('tác giả') || contentLower.includes('người viết') || contentLower.includes('biên tập');
  if (hasAuthor) {
    eeatScore += 25;
    auditItems.push({ id: 'eeat-author', label: 'Author Visibility', passed: true, score: 100, impact: Impact.MEDIUM, message: 'Có thông tin về tác giả.', category: 'eeat' });
  } else {
    auditItems.push({ id: 'eeat-author', label: 'Author Visibility', passed: false, score: 0, impact: Impact.MEDIUM, message: 'Thiếu thông tin tác giả/biên tập viên. Google cần biết ai viết bài này.', category: 'eeat' });
  }

  // Experience Signals
  const expWords = ['kinh nghiệm', 'trải nghiệm', 'thực tế', 'tôi đã', 'chúng tôi đã', 'test', 'kiểm thử'];
  let foundExp = false;
  for (const w of expWords) {
    if (contentLower.includes(w)) { foundExp = true; break; }
  }
  if (foundExp) {
    eeatScore += 25;
    auditItems.push({ id: 'eeat-exp', label: 'Experience Signals', passed: true, score: 100, impact: Impact.HIGH, message: 'Nội dung thể hiện được kinh nghiệm thực tế.', category: 'eeat' });
  } else {
    auditItems.push({ id: 'eeat-exp', label: 'Experience Signals', passed: false, score: 0, impact: Impact.HIGH, message: 'Thiếu từ ngữ thể hiện kinh nghiệm thực tế (Ví dụ: "Tôi đã thử...", "Kinh nghiệm cho thấy...").', category: 'eeat' });
  }
  
  // FAQ Existence (Helpful content booster)
  const hasFAQ = contentLower.includes('faq') || contentLower.includes('câu hỏi thường gặp') || contentLower.includes('thắc mắc') || contentLower.includes('hỏi đáp');
  if (hasFAQ) {
      eeatScore += 30;
      auditItems.push({ id: 'eeat-faq', label: 'FAQ Section', passed: true, score: 100, impact: Impact.HIGH, message: 'Có mục Hỏi đáp/FAQ.', category: 'eeat' });
  } else {
      auditItems.push({ id: 'eeat-faq', label: 'FAQ Section', passed: false, score: 0, impact: Impact.HIGH, message: 'Thiếu mục FAQ. Đây là cơ hội tốt để tăng độ phủ từ khóa và Helpful Content.', category: 'eeat' });
  }

  // Citations/Sources
  const hasSources = contentLower.includes('nguồn tham khảo') || contentLower.includes('theo báo') || contentLower.includes('số liệu');
  if (hasSources || externalLinks.length > 0) { // External links also count as citations
      eeatScore += 20;
      auditItems.push({ id: 'eeat-source', label: 'Trust & Citations', passed: true, score: 100, impact: Impact.MEDIUM, message: 'Có trích dẫn nguồn hoặc link ngoài uy tín.', category: 'eeat' });
  } else {
      auditItems.push({ id: 'eeat-source', label: 'Trust & Citations', passed: false, score: 50, impact: Impact.LOW, message: 'Nên thêm nguồn tham khảo uy tín (External Link) hoặc số liệu cụ thể.', category: 'eeat' });
      eeatScore += 10;
  }

  // 4. CTR OPTIMIZATION (15%)
  let ctrScore = 0;
  
  // Title Length
  const titleLen = input.seoTitle.length;
  if (titleLen >= 30 && titleLen <= 65) {
      ctrScore += 30;
      auditItems.push({ id: 'ctr-len', label: 'Title Length', passed: true, score: 100, impact: Impact.MEDIUM, message: 'Độ dài Title chuẩn.', category: 'ctr' });
  } else {
      auditItems.push({ id: 'ctr-len', label: 'Title Length', passed: false, score: 0, impact: Impact.MEDIUM, message: `Title dài ${titleLen} ký tự. Tốt nhất là 30-65 ký tự để không bị cắt trên Google.`, category: 'ctr' });
  }

  // Power Words & Numbers
  const currentYear = new Date().getFullYear();
  const nextYear = currentYear + 1;
  const powerPattern = new RegExp(`(${currentYear}|${nextYear}|top|nhất|hiệu quả|bí quyết|review|bảng giá|mới)`, 'i');
  
  if (powerPattern.test(input.seoTitle)) {
      ctrScore += 40;
      auditItems.push({ id: 'ctr-power', label: 'Power Words', passed: true, score: 100, impact: Impact.MEDIUM, message: 'Title có chứa từ khóa thu hút (Power words/Năm).', category: 'ctr' });
  } else {
      auditItems.push({ id: 'ctr-power', label: 'Power Words', passed: false, score: 0, impact: Impact.MEDIUM, message: `Title hơi nhạt. Hãy thêm năm (${currentYear}), số lượng (Top 10), hoặc tính từ mạnh (Hiệu quả, Tốt nhất).`, category: 'ctr' });
  }

  // Meta Description
  if (input.metaDescription.length > 120 && input.metaDescription.length < 165) {
      ctrScore += 30;
       auditItems.push({ id: 'ctr-meta', label: 'Meta Description', passed: true, score: 100, impact: Impact.LOW, message: 'Meta Description độ dài tốt.', category: 'ctr' });
  } else {
       auditItems.push({ id: 'ctr-meta', label: 'Meta Description', passed: false, score: 0, impact: Impact.LOW, message: 'Meta Description nên từ 120-160 ký tự.', category: 'ctr' });
  }

  // 5. READABILITY & UX (10%)
  let readScore = 0;
  
  // Lists
  const hasLists = /<ul|<ol|<li>|-\s/.test(rawContent);
  if (hasLists) {
      readScore += 50;
      auditItems.push({ id: 'read-list', label: 'Scannability', passed: true, score: 100, impact: Impact.LOW, message: 'Có sử dụng danh sách (bullet points) giúp dễ đọc.', category: 'readability' });
  } else {
      auditItems.push({ id: 'read-list', label: 'Scannability', passed: false, score: 0, impact: Impact.LOW, message: 'Bài viết thiếu danh sách liệt kê. Dùng bullet points để phá vỡ khối văn bản.', category: 'readability' });
  }

  // Paragraph length
  const paragraphs = rawContent.split(/\n\s*\n/);
  const longParagraphs = paragraphs.filter(p => getWordCount(p) > 150);
  if (longParagraphs.length === 0) {
      readScore += 50;
      auditItems.push({ id: 'read-para', label: 'Paragraph Length', passed: true, score: 100, impact: Impact.LOW, message: 'Các đoạn văn ngắn gọn, dễ đọc.', category: 'readability' });
  } else {
      auditItems.push({ id: 'read-para', label: 'Paragraph Length', passed: false, score: 20, impact: Impact.LOW, message: `Phát hiện ${longParagraphs.length} đoạn văn quá dài (>150 từ). Hãy tách nhỏ để tối ưu trải nghiệm Mobile.`, category: 'readability' });
  }

  // --- FINAL CALCULATION ---
  // Clamp scores to 100
  const clamp = (num: number) => Math.min(100, Math.max(0, num));
  
  const totalScore = Math.round(
    (clamp(intentScore) * W_INTENT) +
    (clamp(onPageScore) * W_ONPAGE) +
    (clamp(eeatScore) * W_EEAT) +
    (clamp(ctrScore) * W_CTR) +
    (clamp(readScore) * W_READ)
  );

  const priorityFixes = auditItems
    .filter(i => !i.passed)
    .sort((a, b) => {
        const impactScore = { [Impact.HIGH]: 3, [Impact.MEDIUM]: 2, [Impact.LOW]: 1 };
        return impactScore[b.impact] - impactScore[a.impact];
    })
    .slice(0, 5);

  const faqSuggestions = generateFAQs(input.focusKeyword, input.intent);

  return {
    totalScore,
    breakdown: {
        intent: clamp(Math.round(intentScore)),
        onPage: clamp(Math.round(onPageScore)),
        eeat: clamp(Math.round(eeatScore)),
        ctr: clamp(Math.round(ctrScore)),
        readability: clamp(Math.round(readScore))
    },
    auditItems,
    priorityFixes,
    faqSuggestions
  };
};

const generateFAQs = (keyword: string, intent: SearchIntent): string[] => {
    const questions: string[] = [];
    if (!keyword) return [];

    switch (intent) {
        case SearchIntent.INFORMATIONAL:
            questions.push(`${keyword} là gì?`);
            questions.push(`Lợi ích của ${keyword} như thế nào?`);
            questions.push(`Hướng dẫn sử dụng ${keyword} chi tiết?`);
            questions.push(`Những sai lầm cần tránh khi làm ${keyword}?`);
            break;
        case SearchIntent.COMMERCIAL:
            questions.push(`${keyword} giá bao nhiêu?`);
            questions.push(`Có nên mua ${keyword} không?`);
            questions.push(`So sánh ${keyword} với các đối thủ?`);
            questions.push(`Ưu nhược điểm của ${keyword} là gì?`);
            break;
        case SearchIntent.TRANSACTIONAL:
            questions.push(`Mua ${keyword} chính hãng ở đâu?`);
            questions.push(`Chính sách bảo hành cho ${keyword}?`);
            questions.push(`Phí vận chuyển khi mua ${keyword}?`);
            break;
        case SearchIntent.LOCAL:
            questions.push(`Địa chỉ bán ${keyword} gần đây?`);
            questions.push(`${keyword} mở cửa giờ nào?`);
            questions.push(`Đường đi đến cửa hàng ${keyword}?`);
            break;
    }
    return questions;
};