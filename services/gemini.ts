import { GoogleGenAI } from "@google/genai";
import { SEOInput, AnalysisResult } from "../types";

export async function optimizeContent(input: SEOInput, analysis: AnalysisResult) {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Prepare error list for AI
  const errors = analysis.auditItems
    .filter(item => !item.passed)
    .map(item => `- ${item.label}: ${item.message}`)
    .join('\n');

  const systemInstruction = `
BẠN LÀ SEO LEAD + EDITOR NGÀNH THIẾT BỊ ĐIỆN TỬ.
NHIỆM VỤ: Sửa và bổ sung bài viết dựa trên Search Intent, Loại bài và danh sách lỗi.

INPUT CỦA BẠN LÀ HTML:
- Bài viết gốc (HTML): ${input.content}
- Intent: ${analysis.taxonomy.intent}
- Loại bài: ${analysis.taxonomy.contentType}
- Ngành: ${analysis.taxonomy.industry}
- Danh sách lỗi: 
${errors}

QUY TẮC CẬN TRỌNG (BẮT BUỘC):
1. BẢO TỒN DỮ LIỆU CŨ: Tuyệt đối giữ nguyên các thẻ HTML hiện có trong bài gốc như <a href="...">, <img src="...">, <h2>, <h3>... Không được xóa link hoặc thay đổi thuộc tính href của các liên kết cũ.
2. SỬA CHỌN LỌC: Chỉ bổ sung hoặc sửa đổi các đoạn văn bản bị lỗi SEO. 
3. QUY ƯỚC HIỂN THỊ: 
   - Phần mới hoặc phần sửa PHẢI được bọc trong thẻ: <strong style="color: #ef4444;">[Nội dung mới hoặc nội dung đã sửa]</strong>.
   - Nội dung bên trong thẻ <strong> này vẫn phải giữ lại link nếu đoạn đó có chứa link.
4. KHÔNG ICON: Không thêm bất kỳ icon nào (như 🔴, ✅).
5. GIỮ NGUYÊN ĐỊNH DẠNG: Đảm bảo output trả về là một chuỗi HTML hợp lệ, không làm hỏng cấu trúc tag.

OUTPUT TRẢ VỀ ĐỊNH DẠNG JSON:
{
  "suggestions": ["Gợi ý 1: ...", "Gợi ý 2: ..."],
  "enhancedContent": "Nội dung HTML đầy đủ sau khi đã tối ưu"
}
`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Thực hiện tối ưu bài viết. Nhắc lại: Giữ nguyên tất cả các link <a> và ảnh <img> hiện có. Bọc phần thay đổi trong thẻ strong màu đỏ.",
      config: {
        systemInstruction,
        responseMimeType: "application/json"
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Gemini Optimization Error:", error);
    return null;
  }
}
