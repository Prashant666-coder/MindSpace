require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testGemini() {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.error('❌ Error: GEMINI_API_KEY is not defined in .env');
    process.exit(1);
  }

  console.log('🔍 GEMINI_API_KEY found (length:', apiKey.length, ')');
  console.log('🚀 Testing connection to Gemini API...');

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });
    
    const prompt = 'Repeat this word exactly: MindSpace';
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();
    
    if (text === 'MindSpace') {
      console.log('✅ Success! The API key and model are working perfectly.');
    } else {
      console.log('⚠️  Partial success. Received unexpected response:', text);
    }
  } catch (err) {
    console.error('❌ Gemini API Error:', err.message);
    if (err.message.includes('API_KEY_INVALID')) {
      console.log('💡 Hint: Your API key appears to be invalid. Please double-check it in .env');
    } else if (err.message.includes('quota')) {
      console.log('💡 Hint: You might have exceeded your API quota.');
    }
  }
}

testGemini();
