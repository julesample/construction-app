-- Insert default admin password hash (LozadaAdmin2024!)
INSERT INTO admin_settings (setting_key, setting_value) 
VALUES ('admin_password_hash', 'TG96YWRhQWRtaW4yMDI0IWNvbnN0cnVjdGlvbl9zYWx0XzIwMjQ=')
ON CONFLICT (setting_key) DO NOTHING;

-- Insert default materials
INSERT INTO materials (id, name, category, description, available) VALUES
('hollow-blocks', 'Hollow Blocks', 'Masonry', 'Standard concrete hollow blocks for construction', true),
('sand', 'Sand', 'Aggregates', 'Fine sand for concrete mixing and construction', true),
('gravel', 'Gravel', 'Aggregates', 'Coarse gravel for concrete and road construction', true),
('cement', 'Cement', 'Binding Materials', 'Portland cement for construction projects', true),
('steel-bars', 'Steel Bars', 'Masonry', 'Reinforcement steel bars for concrete structures', true),
('crushed-stone', 'Crushed Stone', 'Aggregates', 'Crushed stone for foundation and road base', true)
ON CONFLICT (id) DO NOTHING;

-- Insert default material units
INSERT INTO material_units (material_id, value, label, price, available) VALUES
-- Hollow Blocks
('hollow-blocks', 'pieces', 'Pieces', 15.00, true),
('hollow-blocks', 'hundred', 'Per Hundred', 1400.00, true),

-- Sand
('sand', 'cubic-meter', 'Cubic Meter', 800.00, true),
('sand', 'dump-truck', 'Dump Truck Load', 2500.00, true),

-- Gravel
('gravel', 'cubic-meter', 'Cubic Meter', 1200.00, true),
('gravel', 'dump-truck', 'Dump Truck Load', 3500.00, true),

-- Cement
('cement', 'bag', 'Bag (50kg)', 280.00, true),
('cement', 'pallet', 'Pallet (40 bags)', 10800.00, true),

-- Steel Bars
('steel-bars', 'piece-10mm', '10mm per piece', 180.00, true),
('steel-bars', 'piece-12mm', '12mm per piece', 260.00, true),
('steel-bars', 'piece-16mm', '16mm per piece', 460.00, true),

-- Crushed Stone
('crushed-stone', 'cubic-meter', 'Cubic Meter', 900.00, true),
('crushed-stone', 'dump-truck', 'Dump Truck Load', 2800.00, true)
ON CONFLICT (material_id, value) DO NOTHING;

-- Insert sample barangay pricing (10% increase for distant barangays)
INSERT INTO barangay_pricing (barangay, material_id, unit_value, multiplier, fixed_price) VALUES
-- Pange (10% increase)
('Pange', 'sand', 'cubic-meter', 1.1, NULL),
('Pange', 'gravel', 'cubic-meter', 1.1, NULL),
('Pange', 'cement', 'bag', 1.1, NULL),

-- Dapdap (15% increase)
('Dapdap', 'sand', 'cubic-meter', 1.15, NULL),
('Dapdap', 'gravel', 'cubic-meter', 1.15, NULL),
('Dapdap', 'cement', 'bag', 1.15, NULL),

-- Villahermosa (20% increase)
('Villahermosa', 'sand', 'cubic-meter', 1.2, NULL),
('Villahermosa', 'gravel', 'cubic-meter', 1.2, NULL),
('Villahermosa', 'cement', 'bag', 1.2, NULL)
ON CONFLICT (barangay, material_id, unit_value) DO NOTHING;
