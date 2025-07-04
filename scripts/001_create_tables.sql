-- Create materials table
CREATE TABLE IF NOT EXISTS materials (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(255) NOT NULL,
  description TEXT,
  available BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create material_units table
CREATE TABLE IF NOT EXISTS material_units (
  id SERIAL PRIMARY KEY,
  material_id VARCHAR(255) REFERENCES materials(id) ON DELETE CASCADE,
  value VARCHAR(255) NOT NULL,
  label VARCHAR(255) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  available BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(material_id, value)
);

-- Create barangay_pricing table
CREATE TABLE IF NOT EXISTS barangay_pricing (
  id SERIAL PRIMARY KEY,
  barangay VARCHAR(255) NOT NULL,
  material_id VARCHAR(255) REFERENCES materials(id) ON DELETE CASCADE,
  unit_value VARCHAR(255) NOT NULL,
  multiplier DECIMAL(5,2) DEFAULT 1.0,
  fixed_price DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(barangay, material_id, unit_value)
);

-- Create price_history table
CREATE TABLE IF NOT EXISTS price_history (
  id SERIAL PRIMARY KEY,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  material VARCHAR(255) NOT NULL,
  unit VARCHAR(255) NOT NULL,
  old_price DECIMAL(10,2) DEFAULT 0,
  new_price DECIMAL(10,2) DEFAULT 0,
  action VARCHAR(50) NOT NULL,
  barangay VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create admin_settings table for storing admin configuration
CREATE TABLE IF NOT EXISTS admin_settings (
  id SERIAL PRIMARY KEY,
  setting_key VARCHAR(255) UNIQUE NOT NULL,
  setting_value TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_materials_available ON materials(available);
CREATE INDEX IF NOT EXISTS idx_material_units_material_id ON material_units(material_id);
CREATE INDEX IF NOT EXISTS idx_material_units_available ON material_units(available);
CREATE INDEX IF NOT EXISTS idx_barangay_pricing_barangay ON barangay_pricing(barangay);
CREATE INDEX IF NOT EXISTS idx_barangay_pricing_material ON barangay_pricing(material_id);
CREATE INDEX IF NOT EXISTS idx_price_history_timestamp ON price_history(timestamp DESC);
