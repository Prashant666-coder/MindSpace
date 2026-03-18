const fs = require('fs');
const mongoose = require('mongoose');
const Product = require('./server/models/Product.js');
require('dotenv').config({ path: './.env' });

const conversionRate = 83; // 1 USD = ~83 INR

// Map of USD prices to nice-looking INR prices
const priceMap = {
  '12.99': '1099',
  '9.99': '849',
  '24.99': '2099',
  '39.99': '3349',
  '29.99': '2499',
  '34.99': '2949',
  '16.99': '1449',
  '59.99': '4999',
  '44.99': '3749',
  '19.99': '1649',
  '27.99': '2349',
  '14.99': '1249'
};

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace price values
  for (const [usd, inr] of Object.entries(priceMap)) {
    content = content.replace(new RegExp(`price: ${usd}`, 'g'), `price: ${inr}`);
  }
  
  // Replace UI symbols
  if (filePath.includes('app.js')) {
    content = content.replace(`$uid =`, `rupees`); // not needed
    content = content.replace(/\\$\\$\\{p\\.price\\.toFixed\\(2\\)\\}/g, `₹\${p.price.toLocaleString('en-IN')}`);
  }
  
  if (filePath.includes('Product.js')) {
    content = content.replace('Price in USD', 'Price in INR');
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Updated ${filePath}`);
}

async function updateDB() {
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mindspace3d';
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to DB');
    
    const products = await Product.find({});
    for (const p of products) {
      // Find the closest mapped price or just multiply
      const usdStr = (Math.round(p.price * 100) / 100).toString();
      if (priceMap[usdStr] && p.price < 100) { // Assuming it's still in USD
        p.price = parseInt(priceMap[usdStr]);
      } else if (p.price < 500) {
        // If it's not mapped but small enough to be USD, fallback multiply
        let newPrice = p.price * conversionRate;
        // round to nearest 9 or 0
        p.price = Math.round(newPrice / 10) * 10 - 1; 
      }
      await p.save();
    }
    console.log('Updated MongoDB products');
    mongoose.disconnect();
  } catch(e) {
    console.error('DB update failed', e);
  }
}

async function main() {
  replaceInFile('./public/js/app.js');
  replaceInFile('./server/routes/products.js');
  replaceInFile('./server/seed.js');
  replaceInFile('./server/models/Product.js');
  await updateDB();
}

main();
