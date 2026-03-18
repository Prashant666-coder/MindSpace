require('dotenv').config();

async function checkModels() {
  console.log("Checking available models for your API key...");
  
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.log("❌ API KEY NOT FOUND IN .env");
    return;
  }

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await response.json();

    if (data.error) {
      console.log("❌ Google Error:", data.error.message);
    } else {
      console.log("\n✅ TUMHARI API KEY IN MODELS KO SUPPORT KARTI HAI:\n");
      const models = data.models.filter(m => m.supportedGenerationMethods.includes("generateContent"));
      models.forEach(m => console.log("👉 " + m.name));
    }
  } catch (err) {
    console.log("Fetch failed:", err.message);
  }
}

checkModels();