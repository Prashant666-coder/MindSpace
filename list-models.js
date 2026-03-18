require('dotenv').config({ path: '/home/rahul/Downloads/mini project/.env' });
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function run() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("No API key");
    return;
  }
  
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await response.json();
    console.log("Models:", data.models?.map(m => m.name).join(', '));
  } catch (err) {
    console.error("Error:", err.message);
  }
}

run();
