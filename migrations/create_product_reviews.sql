-- Create product_reviews table for customer reviews
CREATE TABLE IF NOT EXISTS product_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,

  -- Reviewer info
  reviewer_name TEXT NOT NULL,
  reviewer_email TEXT,

  -- Review content
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,

  -- Status
  is_approved BOOLEAN DEFAULT false,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_product_reviews_product_id ON product_reviews(product_id);
CREATE INDEX idx_product_reviews_order_id ON product_reviews(order_id);
CREATE INDEX idx_product_reviews_is_approved ON product_reviews(is_approved);
CREATE INDEX idx_product_reviews_created_at ON product_reviews(created_at DESC);

-- RLS Policies
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;

-- Public can read approved reviews
CREATE POLICY "public_read_approved_reviews" ON product_reviews
FOR SELECT USING (is_approved = true);

-- Users can read their own reviews
CREATE POLICY "user_read_own_review" ON product_reviews
FOR SELECT USING (auth.email() = reviewer_email);

-- Only service role (server) can insert/update
GRANT SELECT ON product_reviews TO anon;
GRANT SELECT ON product_reviews TO authenticated;
