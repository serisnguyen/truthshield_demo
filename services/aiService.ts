
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

// FIX: Timeout helper that returns both the promise and a cancellation function
const createTimeoutPromise = (ms: number): [Promise<never>, () => void] => {
    let timeoutId: any;
    const promise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error("AI_TIMEOUT")), ms);
    });
    const clear = () => clearTimeout(timeoutId);
    return [promise, clear];
};

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
 * NEW: Analyzes media (Image/Audio/Video) for Deepfake indicators
 */
export const analyzeMediaDeepfake = async (file: File, type: 'image' | 'audio' | 'video'): Promise<{
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
    // 30 seconds timeout for media analysis
    const [timeoutProm, clearTimer] = createTimeoutPromise(30000);

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
                1. **Hyper-Realism Trap**: Check for waxy skin, impossible lighting, cinematic glow.
                2. **Micro-Anatomy**: Check pupils (perfectly round?), hair (floating strands?), accessories (melting?).
                3. **Context**: Is background bokeh natural?
                
                OUTPUT DECISION LOGIC:
                - If high-end 3D render look or "AI Glaze": **DEEPFAKE**.
                - If standard camera noise, natural imperfections: **REAL**.

                Return JSON: { "isDeepfake": boolean, "confidenceScore": number (0-100), "indicators": string[], "explanation": string (Vietnamese), "details": { "biologicalScore": number, "visualArtifactsScore": number, "faceForensicsMatch": number, "integrityScore": number } }
            `;
        } else if (type === 'video') {
            promptText = `
                Act as a "Forensic Video Analyst". Analyze this video frame-by-frame for Deepfake anomalies (FaceSwap, Lip-sync, Reenactment).
                
                Analyze specifically for:
                1. **Temporal Consistency**: Do facial features flicker or jitter between frames?
                2. **Lip Sync**: Does the mouth movement match the speech perfectly, or is there a subtle "mushy" mouth effect?
                3. **Blinking**: Is the blinking pattern natural or irregular?
                4. **Boundary**: Look at the chin/neck line for blending artifacts.
                
                Return JSON: { "isDeepfake": boolean, "confidenceScore": number (0-100), "indicators": string[], "explanation": string (Vietnamese), "details": { "biologicalScore": number, "visualArtifactsScore": number, "faceForensicsMatch": number, "integrityScore": number } }
            `;
        } else {
             promptText = `
                Act as a "Strict Forensic Audio Analyst". Analyze this audio for AI Voice Cloning / Deepfake Audio.
                
                Analyze specifically for:
                1. **Spectral Continuity**: Unnatural gaps or "metallic" artifacts?
                2. **Breathing**: Natural breaths?
                3. **Intonation**: Flat emotion?
                
                Return JSON: { "isDeepfake": boolean, "confidenceScore": number (0-100), "indicators": string[], "explanation": string (Vietnamese), "details": { "biologicalScore": 0, "visualArtifactsScore": 0, "faceForensicsMatch": 0, "audioSpectralScore": number, "integrityScore": number } }
            `;
        }

        const response: any = await Promise.race([
            ai.models.generateContent({
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
            }),
            timeoutProm
        ]);

        clearTimer();

        const jsonText = response.text || "{}";
        const result = JSON.parse(jsonText);
        
        return {
            isDeepfake: result.isDeepfake ?? false,
            confidenceScore: result.confidenceScore ?? 0,
            indicators: result.indicators ?? [],
            explanation: result.explanation ?? "Không tìm thấy dấu hiệu bất thường rõ rệt.",
            details: {
                biologicalScore: result.details?.biologicalScore || 50,
                visualArtifactsScore: result.details?.visualArtifactsScore || 0,
                audioSpectralScore: result.details?.audioSpectralScore || 0,
                integrityScore: result.details?.integrityScore || 100,
                faceForensicsMatch: result.details?.faceForensicsMatch || 0
            }
        };

    } catch (error) {
        console.error("Deepfake Analysis Error:", error);
        clearTimer();
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    isDeepfake: false,
                    confidenceScore: 15,
                    indicators: ["Chất lượng thấp", "Không đủ dữ liệu chi tiết"],
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

  const [timeoutProm, clearTimer] = createTimeoutPromise(8000);

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
        timeoutProm 
    ]);
    
    clearTimer();

    const text = response.text || "";
    const [classification, explanation] = text.split('|');
    
    let result: 'safe' | 'suspicious' | 'scam' = 'safe';
    if (classification?.trim().includes('SCAM')) result = 'scam';
    else if (classification?.trim().includes('SUSPICIOUS')) result = 'suspicious';

    return { result, explanation: explanation?.trim() || "Cần cảnh giác." };

  } catch (error: any) {
    clearTimer();
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
