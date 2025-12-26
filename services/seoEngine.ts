
import { AnalysisResult, AuditItem, Impact, SearchIntent, SEOInput, ContentTaxonomy } from '../types';

const getWordCount = (text: string): number => {
  const cleanText = text.replace(/<[^>]*>/g, ' ').trim();
  if (!cleanText) return 0;
  return cleanText.split(/\s+/).length;
};

const countOccurrences = (source: string, term: string): number => {
  if (!term) return 0;
  const regex = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
  return (source.match(regex) || []).length;
};

const detectTaxonomy = (input: SEOInput): ContentTaxonomy => {
  const content = (input.seoTitle + ' ' + input.content).toLowerCase();
  const wordCount = getWordCount(input.content);
  
  let intent = SearchIntent.INFORMATIONAL;
  const transKeywords = ['mua', 'giá', 'bán', 'đặt hàng', 'liên hệ', 'shop', 'cửa hàng', 'tại hà nội', 'tphcm'];
  const commKeywords = ['tốt nhất', 'so sánh', 'review', 'đánh giá', 'nên mua', 'vs', 'top', 'lựa chọn'];
  
  if (countOccurrences(content, transKeywords.join(' ')) > 3) intent = SearchIntent.TRANSACTIONAL;
  else if (countOccurrences(content, commKeywords.join(' ')) > 2) intent = SearchIntent.COMMERCIAL;

  let contentType = 'Tin tức / Xu hướng';
  if (/top\s+\d+|danh sách|những/.test(content)) contentType = 'Top list';
  else if (content.includes('so sánh') || content.includes(' vs ')) contentType = 'So sánh';
  else if (content.includes('đánh giá') || content.includes('review')) contentType = 'Review sản phẩm';
  else if (content.includes('hướng dẫn') && (content.includes('mua') || content.includes('chọn'))) contentType = 'Hướng dẫn chọn mua';
  else if (content.includes('hướng dẫn') || content.includes('cách làm')) contentType = 'Hướng dẫn sử dụng';
  else if (content.includes('là gì') || content.includes('định nghĩa')) contentType = 'Giải thích thuật ngữ';
  else if (content.includes('lỗi') || content.includes('sửa') || content.includes('khắc phục')) contentType = 'Xử lý lỗi';
  else if (content.includes('faq') || content.includes('câu hỏi thường gặp')) contentType = 'FAQ';
  else if (wordCount < 300 && content.includes('mua')) contentType = 'Landing page bán hàng';

  let funnelStage: 'TOFU' | 'MOFU' | 'BOFU' = 'TOFU';
  let seoGoal: 'Traffic' | 'Conversion' | 'Brand / Trust' = 'Traffic';

  if (intent === SearchIntent.TRANSACTIONAL) {
    funnelStage = 'BOFU';
    seoGoal = 'Conversion';
  } else if (intent === SearchIntent.COMMERCIAL) {
    funnelStage = 'MOFU';
    seoGoal = 'Conversion';
  } else if (contentType === 'Review sản phẩm' || contentType === 'So sánh') {
    seoGoal = 'Brand / Trust';
  }

  let industry = 'Chưa xác định';
  let subIndustry = 'General';
  const electroKeys = ['laptop', 'điện thoại', 'camera', 'phụ kiện', 'máy tính', 'pc', 'tai nghe'];
  if (countOccurrences(content, electroKeys.join(' ')) > 2) {
    industry = 'Thiết bị điện tử';
    if (content.includes('laptop')) subIndustry = 'Laptop';
    else if (content.includes('điện thoại') || content.includes('iphone') || content.includes('samsung')) subIndustry = 'Điện thoại';
    else if (content.includes('camera')) subIndustry = 'Camera';
  }

  return { intent, contentType, funnelStage, industry, subIndustry, seoGoal };
};

export const analyzeContent = (input: SEOInput): AnalysisResult => {
  const content = input.content || ''; 
  const wordCount = getWordCount(content);
  const taxonomy = detectTaxonomy(input);
  const auditItems: AuditItem[] = [];

  if (wordCount === 0) {
    return {
      totalScore: 0,
      breakdown: { intent: 0, onPage: 0, eeat: 0, ctr: 0, readability: 0 },
      auditItems: [], priorityFixes: [], faqSuggestions: [], taxonomy
    };
  }

  const focusKey = input.focusKeyword.toLowerCase();
  const contentLower = content.toLowerCase();
  const titleLower = input.seoTitle.toLowerCase();
  const slugLower = input.slug.toLowerCase();

  // --- SEO ANALYSIS (ON-PAGE) ---
  
  // 1. Keyword in SEO Title
  const keyInTitle = titleLower.includes(focusKey);
  auditItems.push({
    id: 'key-title',
    label: 'Từ khóa trong Tiêu đề SEO',
    passed: keyInTitle,
    score: keyInTitle ? 100 : 0,
    impact: Impact.HIGH,
    message: keyInTitle ? 'Tốt! Tiêu đề SEO chứa từ khóa chính.' : 'Tiêu đề SEO không chứa từ khóa chính.',
    category: 'onpage'
  });

  // 2. Keyword in Slug
  const keyInSlug = slugLower.includes(focusKey.replace(/\s+/g, '-'));
  auditItems.push({
    id: 'key-slug',
    label: 'Từ khóa trong Slug',
    passed: keyInSlug,
    score: keyInSlug ? 100 : 0,
    impact: Impact.MEDIUM,
    message: keyInSlug ? 'Slug chứa từ khóa, rất tốt cho cấu trúc URL.' : 'Slug chưa chứa từ khóa chính.',
    category: 'onpage'
  });

  // 3. Keyword in Intro (First paragraph)
  const firstPara = contentLower.split(/<\/p>/)[0] || '';
  const keyInIntro = firstPara.includes(focusKey);
  auditItems.push({
    id: 'key-intro',
    label: 'Từ khóa trong Đoạn mở đầu',
    passed: keyInIntro,
    score: keyInIntro ? 100 : 0,
    impact: Impact.HIGH,
    message: keyInIntro ? 'Từ khóa xuất hiện ngay trong đoạn đầu tiên.' : 'Nên đưa từ khóa chính vào đoạn văn đầu tiên.',
    category: 'onpage'
  });

  // 4. Keyword Density
  const keyCount = countOccurrences(contentLower, focusKey);
  const density = (keyCount / wordCount) * 100;
  const densityPassed = density >= 0.5 && density <= 2.5;
  auditItems.push({
    id: 'key-density',
    label: 'Mật độ từ khóa',
    passed: densityPassed,
    score: densityPassed ? 100 : (density > 2.5 ? 40 : 20),
    impact: Impact.MEDIUM,
    message: densityPassed ? `Mật độ tốt (${density.toFixed(1)}%).` : (density > 2.5 ? `Quá cao (${density.toFixed(1)}%) - Coi chừng spam.` : `Quá thấp (${density.toFixed(1)}%).`),
    category: 'onpage'
  });

  // 5. Outbound & Internal Links
  const outboundLinks = (content.match(/href="http(?!s:\/\/yourdomain)/g) || []).length;
  const internalLinks = (content.match(/href="(?!http)/g) || []).length;
  auditItems.push({
    id: 'links-outbound',
    label: 'Liên kết ngoài (Outbound)',
    passed: outboundLinks > 0,
    score: outboundLinks > 0 ? 100 : 0,
    impact: Impact.LOW,
    message: outboundLinks > 0 ? 'Có liên kết trỏ ra ngoài nguồn uy tín.' : 'Nên có ít nhất 1 liên kết ngoài.',
    category: 'onpage'
  });
  auditItems.push({
    id: 'links-internal',
    label: 'Liên kết nội bộ (Internal)',
    passed: internalLinks > 0,
    score: internalLinks > 0 ? 100 : 0,
    impact: Impact.MEDIUM,
    message: internalLinks > 0 ? 'Tốt! Có liên kết nội bộ.' : 'Thiếu liên kết nội bộ điều hướng.',
    category: 'onpage'
  });

  // --- READABILITY ANALYSIS ---

  // 6. Subheading Distribution
  const h2Count = (content.match(/<h2[^>]*>/g) || []).length;
  const h3Count = (content.match(/<h3[^>]*>/g) || []).length;
  const headingPassed = h2Count >= 1;
  auditItems.push({
    id: 'read-headings',
    label: 'Sử dụng Heading (H2/H3)',
    passed: headingPassed,
    score: headingPassed ? 100 : 0,
    impact: Impact.HIGH,
    message: headingPassed ? `Cấu trúc tốt với ${h2Count} thẻ H2.` : 'Cần ít nhất một thẻ H2 để phân tách nội dung.',
    category: 'readability'
  });

  // 7. Paragraph Length
  const paras = content.split(/<\/p>/).map(p => p.replace(/<[^>]*>/g, '').trim()).filter(p => p.length > 0);
  const longParas = paras.filter(p => p.split(/\s+/).length > 150).length;
  auditItems.push({
    id: 'read-para-length',
    label: 'Độ dài đoạn văn',
    passed: longParas === 0,
    score: longParas === 0 ? 100 : Math.max(0, 100 - (longParas * 20)),
    impact: Impact.MEDIUM,
    message: longParas === 0 ? 'Các đoạn văn có độ dài lý tưởng.' : `Có ${longParas} đoạn văn quá dài (trên 150 từ).`,
    category: 'readability'
  });

  // 8. Images with Alt
  const imgCount = (content.match(/<img[^>]*>/g) || []).length;
  const altTags = (content.match(/alt=["'][^"']+["']/g) || []).length;
  auditItems.push({
    id: 'read-images',
    label: 'Hình ảnh & Alt Text',
    passed: imgCount > 0 && altTags >= imgCount,
    score: imgCount === 0 ? 0 : (altTags >= imgCount ? 100 : 50),
    impact: Impact.MEDIUM,
    message: imgCount > 0 ? (altTags >= imgCount ? 'Hình ảnh đầy đủ mô tả Alt.' : 'Thiếu thẻ Alt cho hình ảnh.') : 'Thiếu hình ảnh minh họa.',
    category: 'eeat'
  });

  // Final Scoring Logic
  const seoItems = auditItems.filter(i => i.category === 'onpage');
  const readItems = auditItems.filter(i => i.category === 'readability' || i.category === 'eeat');
  
  const seoScore = Math.round(seoItems.reduce((acc, c) => acc + c.score, 0) / seoItems.length);
  const readScore = Math.round(readItems.reduce((acc, c) => acc + c.score, 0) / readItems.length);

  return {
    totalScore: Math.round((seoScore * 0.7) + (readScore * 0.3)),
    breakdown: {
      intent: taxonomy.intent === SearchIntent.INFORMATIONAL ? 85 : 95,
      onPage: seoScore,
      eeat: imgCount > 0 ? 90 : 30,
      ctr: keyInTitle ? 88 : 45,
      readability: readScore
    },
    auditItems,
    priorityFixes: auditItems.filter(i => !i.passed).sort((a, b) => {
        const impactMap = { [Impact.HIGH]: 3, [Impact.MEDIUM]: 2, [Impact.LOW]: 1 };
        return impactMap[b.impact] - impactMap[a.impact];
    }),
    faqSuggestions: [`${input.focusKeyword} mua ở đâu giá rẻ?`, `Ưu nhược điểm của ${input.focusKeyword} là gì?`],
    taxonomy
  };
};
