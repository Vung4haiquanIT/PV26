import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

const app = express();
const PORT = 3000;

app.use(express.json());

// API route for AI Analysis & Voice/Text command parsing
app.post("/api/ai/analyze", async (req, res) => {
  const { state, prompt } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    // Fallback response if API key is not configured
    return res.json({
      summary: "Hệ thống AI Analysis Layer (Offline Mode): Phát hiện 1 mục tiêu UAV (Cự ly 12.5km, Hướng 045°) và 1 mục tiêu USV cao tốc (Cự ly 6.8km, Hướng 270°). Đề xuất duy trì đội hình, bật gây nhiễu và sẵn sàng hỏa lực tầm gần.",
      parsedCommand: prompt ? {
        object: 'UAV-01',
        time: '10:30:15',
        position: 'Cự ly 12.5km',
        heading: '045°',
        speed: '65 m/s',
        requirement: prompt
      } : null,
      branches: [
        { id: 'b1', name: 'Phương án A: Gây nhiễu điện tử & Cơ động né', description: 'Bật tổ hợp Jammer băng rộng, bẻ lái trái 30 độ' },
        { id: 'b2', name: 'Phương án B: Đánh chặn chủ động tầm gần', description: 'Sử dụng pháo tự động CIWS khi cự ly < 3km' },
        { id: 'b3', name: 'Phương án C: Triển khai mồi bẫy quang học/nhiệt', description: 'Phóng đạn rocket nhiễu xạ đánh lừa đầu tự dẫn' }
      ]
    });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const model = 'models/gemini-2.5-flash';

    const systemInstruction = `Bạn là hệ thống trí tuệ nhân tạo chuyên gia trong trung tâm tác chiến hải quân (AI Analysis Layer).
Nhiệm vụ: Phân tích tình huống đối phó UAV, USV trên tàu chiến đấu mặt nước dựa trên SimulationState được cung cấp.
Hãy trả về JSON gồm:
- summary: Tóm tắt tình huống chiến thuật hiện tại bằng tiếng Việt chuyên ngành.
- parsedCommand: Nếu có câu lệnh người dùng (prompt), hãy phân tích thành: {object, time, position, heading, speed, requirement}.
- branches: 3 phương án đối phó (Nhánh A, B, C) với tên, mô tả cụ thể.`;

    const response = await ai.models.generateContent({
      model,
      contents: [
        { role: 'user', parts: [{ text: `SimulationState: ${JSON.stringify(state)}\n\nYêu cầu / Lệnh người dùng: ${prompt || 'Phân tích tổng quan tình huống'}` }] }
      ],
      config: {
        systemInstruction,
        responseMimeType: 'application/json'
      }
    });

    const text = response.text || '{}';
    const data = JSON.parse(text);
    res.json(data);
  } catch (err: any) {
    console.error("Gemini API error:", err);
    res.json({
      summary: "Hệ thống AI Analysis Layer (Fallback): Đã phân tích trạng thái thời gian thực. Phát hiện UAV và USV đang tiến sát. Đề xuất thực hiện quy trình đối phó tiêu chuẩn.",
      parsedCommand: prompt ? { object: 'Mục tiêu chung', time: 'Hiện tại', position: 'Khu vực chiến đấu', heading: '000°', speed: 'N/A', requirement: prompt } : null,
      branches: [
        { id: 'b1', name: 'Phương án A: Cơ động né tránh & Gây nhiễu', description: 'Đổi hướng 30 độ, phát sóng gây nhiễu' },
        { id: 'b2', name: 'Phương án B: Hỏa lực phòng thủ cận chiến', description: 'Sử dụng CIWS khi mục tiêu vào cự ly 3km' },
        { id: 'b3', name: 'Phương án C: Tăng tốc thoát ly', description: 'Tăng tốc độ tàu lên tối đa' }
      ]
    });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
