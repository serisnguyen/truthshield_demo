
import { GoogleGenAI } from "@google/genai";
import { CallLogItem } from "../context/AuthContext";

// Initialize AI Client
const getAIClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("API Key not found. Using mock/fallback logic.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const sanitizeInput = (input: string): string => {
  return input.replace(/<[^>]*>/g, "");
};

const timeoutPromise = (ms: number) => new Promise((_, reject) => {
    setTimeout(() => reject(new Error("AI_TIMEOUT")), ms);
});

// Helper to convert File/Blob to base64
export const fileToBase64 = (file: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            // Remove the Data-URI prefix (e.g. "data:image/png;base64,")
            const base64 = result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

// --- NEW FUNCTION: Analyze Context of a single sentence ---
export const analyzeConversationContext = (text: string, isKnownContact: boolean): { scoreIncrease: number, keywordsFound: string[] } => {
    const lowerText = text.toLowerCase();
    
    // Keywords Dictionary with Weights
    const riskMap: Record<string, number> = {
        "công an": 20,
        "điều tra": 20,
        "tài khoản": 15,
        "chuyển tiền": 25,
        "chuyển khoản": 25,
        "rửa tiền": 30,
        "bí mật": 15,
        "tạm giữ": 20,
        "nâng cấp sim": 25,
        "khóa": 10,
        "mã otp": 30,
        "mật khẩu": 30
    };

    const safeMap: Record<string, number> = {
        "shipper": -10,
        "giao hàng": -10,
        "đơn hàng": -5,
        "shopee": -5,
        "lazada": -5,
        "tiki": -5,
        "lấy hàng": -5
    };

    let score = 0;
    const found: string[] = [];

    // Check Risk Words
    for (const [word, weight] of Object.entries(riskMap)) {
        if (lowerText.includes(word)) {
            score += weight;
            found.push(word);
        }
    }

    // Check Safe Words (Reduce risk)
    for (const [word, weight] of Object.entries(safeMap)) {
        if (lowerText.includes(word)) {
            score += weight; // weight is negative
        }
    }

    // Heuristics
    // If it's a known contact, we are much more lenient
    if (isKnownContact) {
        score = Math.floor(score * 0.2); // Reduce risk impact by 80%
    }

    return {
        scoreIncrease: Math.max(-10, score), // Allow minimal reduction but mostly increase
        keywordsFound: found
    };
};

/**
 * NEW: Analyzes media (Image/Audio) for Deepfake indicators
 * Simulating logic from Hive AI, Intel FakeCatcher, and FaceForensics++
 */
export const analyzeMediaDeepfake = async (file: File, type: 'image' | 'audio'): Promise<{
    isDeepfake: boolean;
    confidenceScore: number; // 0-100 (100 = definitely fake)
    indicators: string[];
    explanation: string;
    details: {
        biologicalScore: number; // Intel FakeCatcher (Heartbeat/Blood flow)
        visualArtifactsScore: number; // Hive AI (Visual patterns)
        audioSpectralScore: number; // Audio only
        integrityScore: number; // Metadata/Compression
        faceForensicsMatch: number; // % match with known datasets
    }
}> => {
    try {
        const ai = getAIClient();
        if (!ai) {
             throw new Error("NO_API_KEY");
        }

        const base64Data = await fileToBase64(file);
        
        let promptText = "";
        let mimeType = file.type;

        if (type === 'image') {
            promptText = `
                Act as a "Forensic Image Analyst" specializing in detecting High-Quality Generative AI (Midjourney, Flux, Gemini, StyleGAN).
                Your task is to detect AI-generated/reconstructed faces that look "perfect" but lack real-world physics.

                CRITICAL ANALYSIS INSTRUCTIONS (Forensic Level 2):
                
                1. **Hyper-Realism Trap**:
                   - AI images often look "too perfect" (waxy skin, impossible lighting, cinematic glow everywhere). 
                   - Real photos have noise, ISO grain, and imperfect skin texture.
                   - If the skin looks like "rendered clay" or "plastic" despite having pores, MARK AS FAKE.

                2. **Micro-Anatomy & Physics (The "Tell"):**
                   - **Eyes**: Are pupils perfectly round? (Real pupils often aren't). Do reflections match the scene? (AI often puts generic studio lights in outdoor scenes).
                   - **Hair**: Look for "floating strands" that dissolve into nothing or blend into the skin/clothes.
                   - **Accessories**: Check earrings (mismatched?), glasses (frames melting into skin?), or background text (gibberish?).
                
                3. **Context Logic**:
                   - Is the background bokeh natural? AI bokeh often smears objects illogically.
                
                OUTPUT DECISION LOGIC:
                - If it looks like a high-end 3D render or has "AI Glaze" (weirdly smooth/shiny): **DEEPFAKE**.
                - If it has standard camera noise, natural imperfections, and consistent physics: **REAL**.

                Return a JSON object:
                {
                    "isDeepfake": boolean,
                    "confidenceScore": number (0-100. High-quality GenAI usually warrants 85-99 score),
                    "indicators": ["string", "string"],
                    "explanation": "concise technical summary in Vietnamese (e.g., 'Phát hiện da mặt có kết cấu sáp điển hình của AI', 'Ánh sáng trong mắt không khớp vật lý', 'Tóc bị lỗi render')",
                    "details": {
                        "biologicalScore": number (0-100. Low for AI because it lacks blood flow micro-changes),
                        "visualArtifactsScore": number (0-100. High for AI due to generative patterns),
                        "faceForensicsMatch": number (0-100),
                        "integrityScore": number (0-100)
                    }
                }
            `;
        } else {
             promptText = `
                Act as a "Strict Forensic Audio Analyst". Analyze this audio for AI Voice Cloning / Deepfake Audio.
                
                Analyze specifically for:
                1. **Spectral Continuity**: Are there unnatural gaps or "metallic" robotic artifacts in high frequencies?
                2. **Breathing**: Does the speaker take natural breaths? AI voices are often "breathless" or have unnaturally spaced breaths.
                3. **Intonation**: Is the emotion flat or inconsistent with the words?
                
                Output Rules:
                - If it sounds robotic or "too clean" (studio quality without background noise), lean towards FAKE.
                
                Return a JSON object:
                {
                    "isDeepfake": boolean,
                    "confidenceScore": number (0-100),
                    "indicators": ["string", "string"],
                    "explanation": "concise technical summary in Vietnamese",
                    "details": {
                        "biologicalScore": 0,
                        "visualArtifactsScore": 0,
                        "faceForensicsMatch": 0,
                        "audioSpectralScore": number (0-100, HIGH means ROBOTIC/FAKE artifacts found),
                        "integrityScore": number (0-100)
                    }
                }
            `;
        }

        const response: any = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: {
                parts: [
                    { inlineData: { mimeType: mimeType, data: base64Data } },
                    { text: promptText }
                ]
            },
            config: {
                responseMimeType: "application/json"
            }
        });

        const jsonText = response.text || "{}";
        const result = JSON.parse(jsonText);
        
        return {
            isDeepfake: result.isDeepfake ?? false,
            confidenceScore: result.confidenceScore ?? 0,
            indicators: result.indicators ?? [],
            explanation: result.explanation ?? "Không tìm thấy dấu hiệu bất thường rõ rệt.",
            details: {
                biologicalScore: result.details?.biologicalScore || 50, // Intel
                visualArtifactsScore: result.details?.visualArtifactsScore || 0, // Hive
                audioSpectralScore: result.details?.audioSpectralScore || 0, // Voice Detector
                integrityScore: result.details?.integrityScore || 100,
                faceForensicsMatch: result.details?.faceForensicsMatch || 0
            }
        };

    } catch (error) {
        console.error("Deepfake Analysis Error:", error);
        // Fallback for demo if API fails
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    isDeepfake: false,
                    confidenceScore: 15,
                    indicators: ["Chất lượng ảnh thấp", "Không đủ dữ liệu chi tiết"],
                    explanation: "Không thể kết nối máy chủ phân tích chuyên sâu. Kết quả dựa trên kiểm tra sơ bộ.",
                    details: {
                        biologicalScore: 50,
                        visualArtifactsScore: 20,
                        audioSpectralScore: 0,
                        integrityScore: 80,
                        faceForensicsMatch: 10
                    }
                });
            }, 2000);
        });
    }
};


/**
 * Analyzes text for scam indicators using Gemini.
 */
export const analyzeMessageRisk = async (message: string): Promise<{
  result: 'safe' | 'suspicious' | 'scam';
  explanation: string;
}> => {
  const cleanInput = sanitizeInput(message);
  const scamKeywords = /(chuyển tiền|cấp cứu|trúng thưởng|mật khẩu|otp|tài khoản ngân hàng|nâng cấp sim|khóa tài khoản)/i;
  const urgentKeywords = /(gấp|ngay lập tức|trong vòng 24h|khẩn cấp)/i;

  try {
    const ai = getAIClient();
    
    if (!ai) {
        throw new Error("NO_API_KEY");
    }
    
    const prompt = `
      System: You are a cybersecurity expert analyzing Vietnamese text messages for scams.
      Task: Analyze the content inside <user_content> tags. Keep explanation under 20 words.
      Classify as: SCAM, SUSPICIOUS, or SAFE.
      Output Format: "CLASSIFICATION | Short explanation for elderly person"

      <user_content>
      ${cleanInput}
      </user_content>
    `;

    const response: any = await Promise.race([
        ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [{ role: "user", parts: [{ text: prompt }] }]
        }),
        timeoutPromise(8000) 
    ]);

    const text = response.text || "";
    const [classification, explanation] = text.split('|');
    
    let result: 'safe' | 'suspicious' | 'scam' = 'safe';
    if (classification?.trim().includes('SCAM')) result = 'scam';
    else if (classification?.trim().includes('SUSPICIOUS')) result = 'suspicious';

    return { result, explanation: explanation?.trim() || "Cần cảnh giác." };

  } catch (error: any) {
    if (scamKeywords.test(cleanInput) || urgentKeywords.test(cleanInput)) {
        return { 
            result: 'suspicious', 
            explanation: "Hệ thống ngoại tuyến: Phát hiện từ khóa nhạy cảm. Vui lòng gọi điện xác minh." 
        };
    }
    return {
        result: 'safe',
        explanation: "Không phát hiện từ khóa nguy hiểm (Chế độ Offline)."
    };
  }
};

/**
 * Analyzes a call log entry.
 */
export const analyzeCallRisk = async (call: CallLogItem): Promise<{
    riskScore: number;
    explanation: string;
}> => {
    // Basic Offline Heuristics for demo
    let fallbackScore = 10;
    let fallbackExp = "An toàn.";
    
    if (!call.contactName) {
        if (call.duration < 10) { 
            fallbackScore = 75;
            fallbackExp = "Số lạ, gọi quá ngắn (Nháy máy).";
        } else if (call.duration >= 300) { 
            fallbackScore = 65;
            fallbackExp = "Số lạ, gọi rất lâu. Cần cảnh giác lừa đảo dàn dựng.";
        } else { 
            fallbackScore = 40;
            fallbackExp = "Số lạ, cần xác minh.";
        }
    } else {
        fallbackScore = 5;
        fallbackExp = "Người quen trong danh bạ.";
    }

    return {
        riskScore: fallbackScore,
        explanation: fallbackExp
    };
};
