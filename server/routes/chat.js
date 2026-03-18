const express = require('express');
const router = express.Router();

router.post('/chat', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ reply: "Please send a message." });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("❌ API KEY MISSING");
      return res.status(500).json({ reply: "Server configuration error." });
    }

    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(apiKey);

    // Using the available gemini-1.5-flash model to avoid quota errors
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const promptText = `You are an empathetic, supportive, and grounded listener. Keep your responses concise, warm, and helpful. Do not use emojis.\n\nUser: ${message}`;

    console.log("Sending request to Google API via SDK...");

    const result = await model.generateContent(promptText);
    const responseResult = await result.response;
    let replyText = responseResult.text();

    if (!replyText) {
      console.error("❌ Unexpected Response Structure: No text returned");
      return res.status(500).json({ reply: "I didn't quite understand that." });
    }

    replyText = replyText.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '').trim();

    console.log("✅ Success!");
    res.json({ reply: replyText });

  } catch (err) {
    console.error("❌ Google Generative AI Error:", err.message);
    res.status(500).json({ reply: "Server error. Please try again later." });
  }
});

module.exports = router;