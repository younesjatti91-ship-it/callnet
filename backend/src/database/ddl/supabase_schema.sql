-- COD Flow: Enterprise PostgreSQL / Supabase Schema DDL
-- Generated for multi-tenant Cash-on-Delivery operations

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS & ROLES
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  permissions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(150) NOT NULL,
  role VARCHAR(50) DEFAULT 'Seller',
  is_active BOOLEAN DEFAULT TRUE,
  phone_number VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sellers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_name VARCHAR(200) NOT NULL,
  tax_number VARCHAR(100),
  contact_phone VARCHAR(50),
  country VARCHAR(50),
  status VARCHAR(50) DEFAULT 'active',
  owner_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(150) NOT NULL,
  slug VARCHAR(150) UNIQUE NOT NULL,
  currency VARCHAR(10) DEFAULT 'USD',
  locale VARCHAR(10) DEFAULT 'en',
  timezone VARCHAR(50) DEFAULT 'UTC',
  is_active BOOLEAN DEFAULT TRUE,
  settings JSONB DEFAULT '{}'::jsonb,
  seller_id UUID NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stores_seller_id ON stores(seller_id);

CREATE TABLE IF NOT EXISTS user_store_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  assigned_role VARCHAR(50) DEFAULT 'Agent',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_user_store UNIQUE (user_id, store_id)
);

-- 2. COMMERCE DOMAIN
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  full_name VARCHAR(150) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  email VARCHAR(150),
  city VARCHAR(100),
  province VARCHAR(100),
  address TEXT,
  total_orders INT DEFAULT 0,
  delivered_orders INT DEFAULT 0,
  returned_orders INT DEFAULT 0,
  is_blacklisted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customers_store_phone ON customers(store_id, phone);

CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  full_name VARCHAR(150) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  city VARCHAR(100),
  address TEXT,
  product_id VARCHAR(100),
  status VARCHAR(50) DEFAULT 'new',
  source VARCHAR(50) DEFAULT 'manual_entry',
  raw_payload JSONB DEFAULT '{}'::jsonb,
  fraud_score INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leads_store_phone ON leads(store_id, phone);

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  sku VARCHAR(100),
  price NUMERIC(10, 2) DEFAULT 0,
  cost_price NUMERIC(10, 2) DEFAULT 0,
  stock_quantity INT DEFAULT 0,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_store_id ON products(store_id);

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  order_number VARCHAR(100) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending_verification',
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  customer_name VARCHAR(150) NOT NULL,
  customer_phone VARCHAR(50) NOT NULL,
  customer_email VARCHAR(150),
  city VARCHAR(100),
  province VARCHAR(100),
  shipping_address TEXT,
  subtotal NUMERIC(10, 2) DEFAULT 0,
  shipping_fee NUMERIC(10, 2) DEFAULT 0,
  cod_amount NUMERIC(10, 2) DEFAULT 0,
  currency VARCHAR(10) DEFAULT 'USD',
  assigned_agent_id UUID REFERENCES users(id) ON DELETE SET NULL,
  call_attempts_count INT DEFAULT 0,
  last_call_attempt_at TIMESTAMPTZ,
  scheduled_callback_at TIMESTAMPTZ,
  source VARCHAR(50) DEFAULT 'manual',
  external_order_id VARCHAR(100),
  tracking_number VARCHAR(100),
  courier_name VARCHAR(100),
  remittance_status VARCHAR(50) DEFAULT 'unreconciled',
  notes TEXT,
  cancellation_reason VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_store_status ON orders(store_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON orders(customer_phone);
CREATE INDEX IF NOT EXISTS idx_orders_tracking_number ON orders(tracking_number);
CREATE INDEX IF NOT EXISTS idx_orders_assigned_agent ON orders(assigned_agent_id);

CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id VARCHAR(100),
  product_name VARCHAR(200) NOT NULL,
  sku VARCHAR(100),
  quantity INT DEFAULT 1,
  unit_price NUMERIC(10, 2) DEFAULT 0,
  total_price NUMERIC(10, 2) DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

CREATE TABLE IF NOT EXISTS order_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  previous_status VARCHAR(50) NOT NULL,
  new_status VARCHAR(50) NOT NULL,
  changed_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  changed_by_name VARCHAR(150),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_status_history_order ON order_status_history(order_id);

-- 3. INTEGRATIONS & CREDENTIALS
CREATE TABLE IF NOT EXISTS store_integration_providers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  logo_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  supported_features JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS store_integration_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES store_integration_providers(id) ON DELETE CASCADE,
  account_name VARCHAR(150) NOT NULL,
  external_shop_domain VARCHAR(255),
  status VARCHAR(50) DEFAULT 'connected',
  sync_orders_enabled BOOLEAN DEFAULT TRUE,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS webhook_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  provider_code VARCHAR(50) NOT NULL,
  topic VARCHAR(100) NOT NULL,
  webhook_secret VARCHAR(255) UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  total_events_received INT DEFAULT 0,
  last_event_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS integration_credentials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type VARCHAR(50) NOT NULL,
  entity_id VARCHAR(100) NOT NULL,
  encrypted_payload TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_entity_credential UNIQUE (entity_type, entity_id)
);

-- 4. WHATSAPP (WAHA)
CREATE TABLE IF NOT EXISTS whatsapp_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  session_name VARCHAR(100) UNIQUE NOT NULL,
  engine VARCHAR(50) DEFAULT 'NOWEB',
  status VARCHAR(50) DEFAULT 'STOPPED',
  connected_phone VARCHAR(50),
  qr_code_raw TEXT,
  is_default BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS message_broadcasts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name VARCHAR(150) NOT NULL,
  template_body TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'draft',
  total_recipients INT DEFAULT 0,
  sent_count INT DEFAULT 0,
  delivered_count INT DEFAULT 0,
  failed_count INT DEFAULT 0,
  throttle_ms INT DEFAULT 2000,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS message_delivery_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  broadcast_id UUID REFERENCES message_broadcasts(id) ON DELETE SET NULL,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  recipient_phone VARCHAR(50) NOT NULL,
  message_content TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'queued',
  external_message_id VARCHAR(150),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_msg_logs_store_phone ON message_delivery_logs(store_id, recipient_phone);

-- 5. COURIERS & LOGISTICS
CREATE TABLE IF NOT EXISTS courier_companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  tracking_url_template TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS courier_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  courier_company_id UUID NOT NULL REFERENCES courier_companies(id) ON DELETE CASCADE,
  account_name VARCHAR(150) NOT NULL,
  account_number VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS shipments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  courier_account_id UUID NOT NULL REFERENCES courier_accounts(id) ON DELETE CASCADE,
  tracking_number VARCHAR(100) UNIQUE NOT NULL,
  status VARCHAR(50) DEFAULT 'created',
  cod_amount_to_collect NUMERIC(10, 2) DEFAULT 0,
  shipping_cost NUMERIC(10, 2) DEFAULT 0,
  recipient_name VARCHAR(150),
  recipient_phone VARCHAR(50),
  destination_address TEXT,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shipments_tracking ON shipments(tracking_number);

CREATE TABLE IF NOT EXISTS shipment_tracking_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shipment_id UUID NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
  normalized_status VARCHAR(50) NOT NULL,
  raw_status VARCHAR(150),
  location VARCHAR(150),
  description TEXT,
  event_timestamp TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS delivery_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shipment_id UUID NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
  attempt_number INT DEFAULT 1,
  outcome VARCHAR(50) NOT NULL,
  failure_reason VARCHAR(100),
  notes TEXT,
  attempted_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS return_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  shipment_id UUID REFERENCES shipments(id) ON DELETE SET NULL,
  status VARCHAR(50) DEFAULT 'initiated',
  reason VARCHAR(100) NOT NULL,
  return_tracking_number VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. FINANCE & RECONCILIATION
CREATE TABLE IF NOT EXISTS remittance_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  courier_account_id UUID REFERENCES courier_accounts(id) ON DELETE SET NULL,
  file_name VARCHAR(255) NOT NULL,
  file_url TEXT,
  status VARCHAR(50) DEFAULT 'uploaded',
  total_rows INT DEFAULT 0,
  matched_rows INT DEFAULT 0,
  discrepancy_rows INT DEFAULT 0,
  total_remitted_amount NUMERIC(12, 2) DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reconciliation_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  remittance_file_id UUID NOT NULL REFERENCES remittance_files(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  tracking_number VARCHAR(100) NOT NULL,
  expected_amount NUMERIC(10, 2) DEFAULT 0,
  remitted_amount NUMERIC(10, 2) DEFAULT 0,
  difference_amount NUMERIC(10, 2) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'matched',
  carrier_status VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recon_tracking ON reconciliation_records(tracking_number);

CREATE TABLE IF NOT EXISTS payout_discrepancies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  reconciliation_record_id UUID NOT NULL REFERENCES reconciliation_records(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  tracking_number VARCHAR(100) NOT NULL,
  discrepancy_type VARCHAR(50) NOT NULL,
  discrepancy_amount NUMERIC(10, 2) DEFAULT 0,
  resolution_status VARCHAR(50) DEFAULT 'open',
  resolution_notes TEXT,
  resolved_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. CALL CENTER & AUDIT LOGS
CREATE TABLE IF NOT EXISTS call_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  agent_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  agent_name VARCHAR(150) NOT NULL,
  customer_phone VARCHAR(50) NOT NULL,
  outcome VARCHAR(50) DEFAULT 'no_answer',
  duration_seconds INT DEFAULT 0,
  notes TEXT,
  callback_scheduled_at TIMESTAMPTZ,
  whatsapp_triggered BOOLEAN DEFAULT FALSE,
  called_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_call_logs_order ON call_logs(order_id);

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100),
  entity_id VARCHAR(100),
  details JSONB DEFAULT '{}'::jsonb,
  ip_address VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_store ON audit_logs(store_id);
