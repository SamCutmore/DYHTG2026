-- Deprecated
CREATE TABLE IF NOT EXISTS messages (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE
        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    body TEXT NOT NULL
);

-- Deprecated
CREATE TABLE IF NOT EXISTS prices (
    id BIGSERIAL PRIMARY KEY,
    site TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    name TEXT NOT NULL,
    location TEXT
);

-- Auth (ported from SPRE Users + session tokens)
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    better_password VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
    token VARCHAR(64) PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users (id),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions (expires_at);


-- Market
CREATE TABLE IF NOT EXISTS market_groups (
    market_group_id   INT PRIMARY KEY,
    parent_group_id   INT NULL REFERENCES market_groups (market_group_id),
    market_group_name VARCHAR(255) NOT NULL,
    description       TEXT NULL,
    has_types         BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS inv_types (
    type_id         INT PRIMARY KEY,
    type_name       VARCHAR(255) NOT NULL,
    description     TEXT NULL,
    base_price      DECIMAL(20, 2) NULL,
    published       BOOLEAN NOT NULL DEFAULT TRUE,
    market_group_id INT NULL REFERENCES market_groups (market_group_id)
);

CREATE TABLE IF NOT EXISTS locations (
    location_id        INT PRIMARY KEY,
    parent_location_id INT NULL REFERENCES locations (location_id),
    location_name      VARCHAR(255) NOT NULL,
    description        TEXT NULL
);

CREATE TABLE IF NOT EXISTS sources (
    source_id   INT PRIMARY KEY,
    source_code VARCHAR(64) NOT NULL UNIQUE,
    source_name VARCHAR(255) NOT NULL,
    base_url    TEXT NULL
);

CREATE TABLE IF NOT EXISTS market_orders (
    order_id            BIGSERIAL PRIMARY KEY,
    type_id             INT NOT NULL REFERENCES inv_types (type_id),
    location_id         INT NOT NULL REFERENCES locations (location_id),
    source_id           INT NOT NULL REFERENCES sources (source_id),
    side                VARCHAR(4) NOT NULL CHECK (side IN ('buy', 'sell')),
    price               DECIMAL(20, 2) NOT NULL CHECK (price >= 0),
    quantity            INT NOT NULL CHECK (quantity >= 0),
    quantity_initial    INT NOT NULL CHECK (quantity_initial > 0),
    status              VARCHAR(16) NOT NULL DEFAULT 'open'
                        CHECK (status IN ('open', 'partial', 'filled', 'cancelled')),
    external_url        TEXT NULL,
    external_listing_id VARCHAR(255) NULL,
    owner_kind          VARCHAR(32) NOT NULL
                        CHECK (owner_kind IN ('user', 'market_maker', 'external')),
    owner_ref           VARCHAR(255) NULL,
    user_id             BIGINT NULL REFERENCES users (id),
    expires_at          TIMESTAMP WITH TIME ZONE NULL,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_market_orders_book
    ON market_orders (type_id, location_id, side, status, price);

CREATE INDEX IF NOT EXISTS idx_market_orders_external
    ON market_orders (source_id, external_listing_id);

CREATE INDEX IF NOT EXISTS idx_market_orders_user_id
    ON market_orders (user_id);

CREATE INDEX IF NOT EXISTS idx_market_orders_expires_at
    ON market_orders (expires_at);

CREATE TABLE IF NOT EXISTS market_fills (
    fill_id       BIGSERIAL PRIMARY KEY,
    type_id       INT NOT NULL REFERENCES inv_types (type_id),
    location_id   INT NOT NULL REFERENCES locations (location_id),
    buy_order_id  BIGINT NOT NULL REFERENCES market_orders (order_id),
    sell_order_id BIGINT NOT NULL REFERENCES market_orders (order_id),
    price         DECIMAL(20, 2) NOT NULL CHECK (price >= 0),
    quantity      INT NOT NULL CHECK (quantity > 0),
    filled_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_market_fills_type_time
    ON market_fills (type_id, location_id, filled_at);

CREATE TABLE IF NOT EXISTS market_prices (
    type_id        INT NOT NULL REFERENCES inv_types (type_id),
    location_id    INT NOT NULL REFERENCES locations (location_id),
    adjusted_price DECIMAL(20, 2) NULL,
    average_price  DECIMAL(20, 2) NULL,
    PRIMARY KEY (type_id, location_id)
);

CREATE TABLE IF NOT EXISTS market_history (
    location_id INT NOT NULL REFERENCES locations (location_id),
    type_id     INT NOT NULL REFERENCES inv_types (type_id),
    date        DATE NOT NULL,
    low_price   DECIMAL(20, 2) NOT NULL,
    high_price  DECIMAL(20, 2) NOT NULL,
    avg_price   DECIMAL(20, 2) NOT NULL,
    volume      BIGINT NOT NULL DEFAULT 0,
    orders      BIGINT NOT NULL DEFAULT 0,
    PRIMARY KEY (location_id, type_id, date)
);


-- Basic mock table entries

INSERT INTO sources (source_id, source_code, source_name, base_url)
SELECT 1, 'ebay', 'eBay', 'https://www.ebay.co.uk'
WHERE NOT EXISTS (SELECT 1 FROM sources WHERE source_id = 1);

INSERT INTO sources (source_id, source_code, source_name, base_url)
SELECT 2, 'vinted', 'Vinted', 'https://www.vinted.co.uk'
WHERE NOT EXISTS (SELECT 1 FROM sources WHERE source_id = 2);

INSERT INTO sources (source_id, source_code, source_name, base_url)
SELECT 3, 'gumtree', 'Gumtree', 'https://www.gumtree.com'
WHERE NOT EXISTS (SELECT 1 FROM sources WHERE source_id = 3);

INSERT INTO sources (source_id, source_code, source_name, base_url)
SELECT 4, 'facebook', 'Facebook Marketplace', 'https://www.facebook.com/marketplace'
WHERE NOT EXISTS (SELECT 1 FROM sources WHERE source_id = 4);

INSERT INTO sources (source_id, source_code, source_name, base_url)
SELECT 5, 'amazon', 'Amazon', 'https://www.amazon.co.uk'
WHERE NOT EXISTS (SELECT 1 FROM sources WHERE source_id = 5);

INSERT INTO sources (source_id, source_code, source_name, base_url)
SELECT 6, 'mock_mm', 'Market Maker', NULL
WHERE NOT EXISTS (SELECT 1 FROM sources WHERE source_id = 6);

INSERT INTO locations (location_id, parent_location_id, location_name, description)
SELECT 1, NULL, 'UK', 'United Kingdom (postage / national)'
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE location_id = 1);

INSERT INTO market_groups (market_group_id, parent_group_id, market_group_name, description, has_types)
SELECT 10, NULL, 'Electronics', 'Consumer electronics', FALSE
WHERE NOT EXISTS (SELECT 1 FROM market_groups WHERE market_group_id = 10);

INSERT INTO market_groups (market_group_id, parent_group_id, market_group_name, description, has_types)
SELECT 11, 10, 'Phones', 'Mobile phones', FALSE
WHERE NOT EXISTS (SELECT 1 FROM market_groups WHERE market_group_id = 11);

INSERT INTO market_groups (market_group_id, parent_group_id, market_group_name, description, has_types)
SELECT 12, 11, 'Apple', 'Apple phones', TRUE
WHERE NOT EXISTS (SELECT 1 FROM market_groups WHERE market_group_id = 12);

INSERT INTO inv_types (type_id, type_name, description, base_price, published, market_group_id)
SELECT 1001, 'iPhone 13 128GB', 'Used iPhone 13 128GB', 180.00, TRUE, 12
WHERE NOT EXISTS (SELECT 1 FROM inv_types WHERE type_id = 1001);

-- Order books examples

INSERT INTO market_orders (
    type_id, location_id, source_id, side, price, quantity, quantity_initial,
    status, external_url, external_listing_id, owner_kind, owner_ref)
SELECT 1001, 1, 1, 'sell', 210.00, 1, 1, 'open',
       'https://www.ebay.co.uk/itm/demo-iphone-high', 'demo-sell-high', 'external', NULL
WHERE NOT EXISTS (SELECT 1 FROM market_orders WHERE external_listing_id = 'demo-sell-high');

INSERT INTO market_orders (
    type_id, location_id, source_id, side, price, quantity, quantity_initial,
    status, external_url, external_listing_id, owner_kind, owner_ref)
SELECT 1001, 1, 2, 'sell', 195.00, 1, 1, 'open',
       'https://www.vinted.co.uk/items/demo-iphone', 'demo-sell-ask', 'external', NULL
WHERE NOT EXISTS (SELECT 1 FROM market_orders WHERE external_listing_id = 'demo-sell-ask');

INSERT INTO market_orders (
    type_id, location_id, source_id, side, price, quantity, quantity_initial,
    status, external_url, external_listing_id, owner_kind, owner_ref)
SELECT 1001, 1, 6, 'buy', 170.00, 1, 1, 'open',
       NULL, NULL, 'market_maker', 'seed-buy-low'
WHERE NOT EXISTS (
    SELECT 1 FROM market_orders WHERE owner_ref = 'seed-buy-low' AND side = 'buy');

INSERT INTO market_orders (
    type_id, location_id, source_id, side, price, quantity, quantity_initial,
    status, external_url, external_listing_id, owner_kind, owner_ref)
SELECT 1001, 1, 6, 'buy', 185.00, 1, 1, 'open',
       NULL, NULL, 'market_maker', 'seed-buy-best'
WHERE NOT EXISTS (
    SELECT 1 FROM market_orders WHERE owner_ref = 'seed-buy-best' AND side = 'buy');

-- Demo history for type 1001 @ UK
INSERT INTO market_history (location_id, type_id, date, low_price, high_price, avg_price, volume, orders)
SELECT 1, 1001, DATE '2026-10-14', 175.00, 205.00, 190.00, 12, 8
WHERE NOT EXISTS (
    SELECT 1 FROM market_history WHERE location_id = 1 AND type_id = 1001 AND date = DATE '2026-10-14');

INSERT INTO market_history (location_id, type_id, date, low_price, high_price, avg_price, volume, orders)
SELECT 1, 1001, DATE '2026-10-15', 178.00, 200.00, 188.50, 9, 6
WHERE NOT EXISTS (
    SELECT 1 FROM market_history WHERE location_id = 1 AND type_id = 1001 AND date = DATE '2026-10-15');

INSERT INTO market_history (location_id, type_id, date, low_price, high_price, avg_price, volume, orders)
SELECT 1, 1001, DATE '2026-10-16', 172.00, 198.00, 185.00, 15, 11
WHERE NOT EXISTS (
    SELECT 1 FROM market_history WHERE location_id = 1 AND type_id = 1001 AND date = DATE '2026-10-16');
