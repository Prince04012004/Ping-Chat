import axios from "axios";
import 'dotenv/config';

export const generateTheme = async (req, res) => {
  const { prompt } = req.body;
  const API_KEY = process.env.GEMINI_API_KEY;
  
  // Model name as per Google AI Studio documentation
// Is URL ko use kar ab:
const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${API_KEY}`;  // Note: Agar gemini-3-flash-preview specifically use kar raha hai to endpoint check kar lena, 
  // usually stable flash models (1.5 ya 2.0) zyada reliable response dete hain production-style apps mein.

  try {
    const response = await axios.post(url, {
      contents: [{
        parts: [{
          text: `Task: Create a UI theme JSON for the vibe: "${prompt}".
                 Return ONLY JSON with these exact keys:
                 {
                   "accent": "A vibrant HEX code",
                   "font": "One of: Outfit, Kalam, Cinzel Decorative, JetBrains Mono, Orbitron",
                   "icon": "Material icon name"
                 }`
        }]
      }],
      generationConfig: {
        // 🔥 Ye line sabse important hai parsing error hatane ke liye
        response_mime_type: "application/json", 
        temperature: 0.7,
        topP: 0.95,
      }
    });

    if (response.data && response.data.candidates?.[0]?.content?.parts?.[0]?.text) {
      const aiResponse = response.data.candidates[0].content.parts[0].text;
      const themeData = JSON.parse(aiResponse);
      
      // Frontend ko data bhej rahe hain
      res.status(200).json(themeData);
    } else {
      throw new Error("AI returned empty content");
    }

  } catch (error) {
    const status = error.response?.status || 500;
    const errorDetail = error.response?.data?.error?.message || error.message;
    
    console.error(`Status: ${status} | Error: ${errorDetail}`);

    // Frontend ko 429 handle karne ke liye sahi status bhej rahe hain
    res.status(status).json({ 
      message: status === 429 ? "Too Many Requests - AI is tired" : "Error", 
      detail: errorDetail 
    });
  }
};