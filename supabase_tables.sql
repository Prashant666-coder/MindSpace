-- Enable extension (UUID generation)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

--------------------------------------------------
-- 1. MOODS TABLE
--------------------------------------------------
CREATE TABLE IF NOT EXISTS moods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  emotion TEXT NOT NULL,
  intensity INTEGER DEFAULT 5,
  note TEXT,
  date TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS moods_userId_idx ON moods(user_id);

ALTER TABLE moods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their moods"
ON moods
FOR ALL
USING (auth.uid() = user_id);

--------------------------------------------------
-- 2. JOURNALS TABLE
--------------------------------------------------
CREATE TABLE IF NOT EXISTS journals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  mood TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT now(),
  "updatedAt" TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS journals_userId_idx ON journals(user_id);

-- Trigger function for updatedAt
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_journals_updatedAt
BEFORE UPDATE ON journals
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

ALTER TABLE journals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their journals"
ON journals
FOR ALL
USING (auth.uid() = user_id);

--------------------------------------------------
-- 3. PRODUCTS TABLE (Public Read)
--------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  description TEXT,
  category TEXT,
  rating INTEGER DEFAULT 5,
  image TEXT,
  "countInStock" INTEGER DEFAULT 10
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Anyone can view products"
ON products
FOR SELECT
USING (true);

--------------------------------------------------
-- 4. ORDERS TABLE
--------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "razorpayOrderId" TEXT UNIQUE NOT NULL,
  "razorpayPaymentId" TEXT NOT NULL,
  "razorpaySignature" TEXT NOT NULL,
  user_id UUID,
  items JSONB NOT NULL,
  "totalAmount" NUMERIC(10,2) NOT NULL,
  customer JSONB NOT NULL,
  status TEXT DEFAULT 'captured',
  "createdAt" TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS orders_user_idx ON orders(user_id);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their orders"
ON orders
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their orders"
ON orders
FOR INSERT
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);


CREATE EXTENSION IF NOT EXISTS "pgcrypto";

--------------------------------------------------
-- PRODUCTS TABLE
--------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  description TEXT,
  category TEXT,
  rating INTEGER DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
  image TEXT,
  count_in_stock INTEGER DEFAULT 10 CHECK (count_in_stock >= 0),
  created_at TIMESTAMPTZ DEFAULT now()
);

--------------------------------------------------
-- RLS ENABLE
--------------------------------------------------
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read products"
ON products
FOR SELECT
USING (true);

--------------------------------------------------
-- INSERT DATA
--------------------------------------------------

INSERT INTO products (name, price, description, category, rating, image)
VALUES
('Calm Stress Ball Set', 1099, 'Soft, squeezable stress balls in calming colors.', 'Stress Relief', 5, 'https://images-na.ssl-images-amazon.com/images/I/71h4Eh4mK7L._UL500_.jpg'),

('Premium Fidget Cube', 849, 'Six-sided fidget cube with buttons, switches, and spinners.', 'Stress Relief', 5, 'https://m.media-amazon.com/images/I/61an7feuocL._AC_UF1000,1000_QL80_.jpg'),

('Mindfulness Journal', 2099, 'Guided journal with daily prompts for gratitude and reflection.', 'Journals', 5, 'https://images.unsplash.com/photo-1519682337058-a94d519337bc'),

('Bamboo Meditation Cushion', 3349, 'Ergonomic meditation cushion with organic buckwheat filling.', 'Meditation', 5, 'https://m.media-amazon.com/images/I/71tzfh8iyKL.jpg'),

('Lavender Essential Oil Set', 2499, 'Pure lavender essential oil kit with diffuser.', 'Aromatherapy', 5, 'https://assets.myntassets.com/h_1440,q_75,w_1080/v1/assets/images/2024/AUGUST/30/yTsoL3W9_5181dd6823674e419a3542821617bd87.jpg'),

('Yoga Mat – Extra Thick', 2949, 'Premium 6mm thick yoga mat with alignment lines.', 'Fitness', 5, 'https://m.media-amazon.com/images/I/81k53EsViVL.jpg'),

('The Anxiety Toolkit', 1449, 'Practical guide with evidence-based strategies for managing anxiety.', 'Books', 5, 'https://images.unsplash.com/photo-1512820790803-83ca734da794'),

('Weighted Blanket – 15 lbs', 4999, 'Glass bead weighted blanket for deep pressure stimulation.', 'Accessories', 5, 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSkNWqplKtI1pQofTjLp7ftzi-f5z2YNXqSpQ&s'),

('Tibetan Singing Bowl', 3749, 'Hand-hammered singing bowl for meditation and sound healing.', 'Meditation', 5, 'https://m.media-amazon.com/images/I/91nliey9YoS.jpg'),

('Resistance Band Set', 1649, 'Color-coded resistance bands for stress-relieving workouts.', 'Fitness', 5, 'https://spikefitness.in/cdn/shop/products/resistanceband3-min.jpg?v=1647062854'),

('Aromatherapy Candle Set', 2349, 'Set of 4 soy wax candles in calming scents.', 'Aromatherapy', 5, 'https://www.yougibotanicals.com/cdn/shop/products/11_1_fa932b49-d56a-49a9-9209-5e50d69b1f31_1024x1024.png?v=1636813225'),

('Gratitude Card Deck', 1249, 'Weekly gratitude prompts in a beautiful card deck.', 'Journals', 5, 'https://shop.mindful.org/cdn/shop/files/InstagramPost-1.png?v=1745468135');

-- Allow Guest Checkouts (Make user_id nullable)
ALTER TABLE orders ALTER COLUMN user_id DROP NOT NULL;

-- Fix the RLS Policy to allow guests (null user_id) to insert orders securely
DROP POLICY IF EXISTS "Users can insert their orders" ON orders;

CREATE POLICY "Users can insert their orders"
ON orders
FOR INSERT
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
