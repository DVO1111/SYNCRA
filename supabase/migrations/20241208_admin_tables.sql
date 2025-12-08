-- Admin Settings Table
CREATE TABLE IF NOT EXISTS admin_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  profit_wallet_address TEXT,
  payment_enabled BOOLEAN DEFAULT true,
  service_fee_percentage DECIMAL(5,2) DEFAULT 2.5,
  min_payment_amount DECIMAL(15,2) DEFAULT 1000,
  max_payment_amount DECIMAL(15,2) DEFAULT 100000000,
  tax_processing_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT single_row CHECK (id = 1)
);

-- Tax Processing Table
CREATE TABLE IF NOT EXISTS tax_processing (
  id SERIAL PRIMARY KEY,
  payer_id TEXT NOT NULL,
  wallet_address TEXT NOT NULL,
  tax_type TEXT NOT NULL,
  tax_amount DECIMAL(15,2) NOT NULL,
  income_amount DECIMAL(15,2) DEFAULT 0,
  transaction_id TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'processed', 'failed', 'cancelled')),
  service_fee DECIMAL(15,2) DEFAULT 0,
  net_amount DECIMAL(15,2) NOT NULL,
  notes TEXT,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_tax_processing_status ON tax_processing(status);
CREATE INDEX IF NOT EXISTS idx_tax_processing_payer_id ON tax_processing(payer_id);
CREATE INDEX IF NOT EXISTS idx_tax_processing_created_at ON tax_processing(created_at DESC);

-- Insert default admin settings
INSERT INTO admin_settings (id, profit_wallet_address, payment_enabled, service_fee_percentage, min_payment_amount, max_payment_amount, tax_processing_enabled)
VALUES (1, NULL, true, 2.5, 1000, 100000000, true)
ON CONFLICT (id) DO NOTHING;

