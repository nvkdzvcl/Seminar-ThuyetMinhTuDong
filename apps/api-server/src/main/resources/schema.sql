USE vinhkhanhfoodtour;

SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(255),
    phone_number VARCHAR(50),
    email VARCHAR(255) UNIQUE,
    password VARCHAR(255),
    language VARCHAR(20),
    role VARCHAR(20),
    created_at DATE,
    status VARCHAR(20)
);

CREATE TABLE IF NOT EXISTS language (
    id INT AUTO_INCREMENT PRIMARY KEY,
    language_name VARCHAR(255),
    code VARCHAR(20) UNIQUE
);

CREATE TABLE IF NOT EXISTS shop_type (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100),
    description VARCHAR(500)
);

CREATE TABLE IF NOT EXISTS shop (
    id INT AUTO_INCREMENT PRIMARY KEY,
    owner_id INT NOT NULL,
    shop_type_id INT NOT NULL,
    name VARCHAR(255),
    address VARCHAR(500),
    short_description VARCHAR(255),
    description TEXT,
    image_name VARCHAR(255),
    audioURL VARCHAR(500),
    lat DOUBLE,
    lng DOUBLE,
    avg_cost_per_person INT,
    avg_wait_time_min INT,
    avg_eat_time_min INT,
    created_at DATE,
    status VARCHAR(20),
    CONSTRAINT fk_shop_owner FOREIGN KEY (owner_id) REFERENCES users(id),
    CONSTRAINT fk_shop_type FOREIGN KEY (shop_type_id) REFERENCES shop_type(id)
);

CREATE TABLE IF NOT EXISTS dish (
    id INT AUTO_INCREMENT PRIMARY KEY,
    shop_id INT,
    name VARCHAR(255),
    description TEXT,
    price INT,
    is_signature BIT(1),
    image VARCHAR(255),
    created_at DATE,
    status VARCHAR(20),
    CONSTRAINT fk_dish_shop FOREIGN KEY (shop_id) REFERENCES shop(id)
);

CREATE TABLE IF NOT EXISTS audio (
    id INT AUTO_INCREMENT PRIMARY KEY,
    dish_id INT,
    audio_name VARCHAR(255),
    language_id INT,
    CONSTRAINT fk_audio_dish FOREIGN KEY (dish_id) REFERENCES dish(id),
    CONSTRAINT fk_audio_language FOREIGN KEY (language_id) REFERENCES language(id)
);

CREATE TABLE IF NOT EXISTS narration_asset (
    id INT AUTO_INCREMENT PRIMARY KEY,
    entity_type VARCHAR(20) NOT NULL,
    entity_id INT NOT NULL,
    language_key VARCHAR(40) NOT NULL,
    effective_language_tag VARCHAR(60) NOT NULL,
    voice_name VARCHAR(120) NOT NULL,
    source_text TEXT NULL,
    script_text TEXT NULL,
    audio_url VARCHAR(600) NOT NULL,
    source_hash VARCHAR(64) NOT NULL,
    fallback_applied BIT(1) NOT NULL DEFAULT b'0',
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    CONSTRAINT uk_narration_asset_entity_language UNIQUE (entity_type, entity_id, language_key)
);

CREATE TABLE IF NOT EXISTS poi (
    id INT AUTO_INCREMENT PRIMARY KEY,
    shop_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    address VARCHAR(255) NOT NULL,
    lat DOUBLE NULL,
    lng DOUBLE NULL,
    region VARCHAR(255) NULL,
    category VARCHAR(255) NULL,
    owner_id INT NULL,
    owner_name VARCHAR(255) NULL,
    cover_image VARCHAR(500) NULL,
    qr_code VARCHAR(100) NULL UNIQUE,
    risk_flag BIT(1) NOT NULL DEFAULT b'0',
    risk_score INT NULL,
    rejection_reason TEXT NULL,
    status VARCHAR(50) NOT NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS poi_menu_item (
    id INT AUTO_INCREMENT PRIMARY KEY,
    poi_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description_text TEXT NULL,
    price INT NULL,
    rating DECIMAL(2,1) NULL,
    moderation_status VARCHAR(30) NULL,
    is_signature BIT(1) NULL,
    image_url VARCHAR(500) NULL,
    audio_script_text TEXT NULL,
    risk_score INT NULL,
    risk_flags VARCHAR(255) NULL,
    status VARCHAR(20) NULL,
    created_at DATETIME NULL,
    updated_at DATETIME NULL,
    CONSTRAINT fk_poi_menu_item_poi FOREIGN KEY (poi_id) REFERENCES poi(id)
);

CREATE TABLE IF NOT EXISTS poi_moderation_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    poi_id INT NOT NULL,
    menu_item_id INT NULL,
    field_name VARCHAR(100) NOT NULL,
    text_snapshot TEXT NULL,
    risk_score INT NULL,
    labels VARCHAR(255) NULL,
    matched_terms VARCHAR(255) NULL,
    suggested_rewrite TEXT NULL,
    model_version VARCHAR(100) NULL,
    status VARCHAR(20) NULL,
    reviewed_by VARCHAR(255) NULL,
    reviewed_at DATETIME NULL,
    created_at DATETIME NULL,
    CONSTRAINT fk_poi_moderation_poi FOREIGN KEY (poi_id) REFERENCES poi(id)
);

CREATE TABLE IF NOT EXISTS poi_approval_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    shop_id INT NOT NULL,
    poi_id INT NULL,
    status VARCHAR(50) NOT NULL,
    submitted_at DATETIME NOT NULL,
    reviewer VARCHAR(255) NULL,
    reviewed_at DATETIME NULL,
    reason TEXT NULL
);

CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    shop_id INT,
    customer_id INT,
    total_price INT,
    payment_method INT,
    created_at DATE,
    payment_status INT,
    status VARCHAR(20),
    CONSTRAINT fk_orders_shop FOREIGN KEY (shop_id) REFERENCES shop(id),
    CONSTRAINT fk_orders_customer FOREIGN KEY (customer_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS order_item (
    id INT AUTO_INCREMENT PRIMARY KEY,
    dish_id INT,
    order_id INT,
    quantity INT,
    price_per_unit INT,
    status VARCHAR(20),
    CONSTRAINT fk_order_item_dish FOREIGN KEY (dish_id) REFERENCES dish(id),
    CONSTRAINT fk_order_item_order FOREIGN KEY (order_id) REFERENCES orders(id)
);

CREATE TABLE IF NOT EXISTS tour_plan (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT,
    budget_total INT,
    tour_stop_count INT,
    time_total_min INT,
    people_count INT,
    est_cost INT,
    created_at DATE,
    status VARCHAR(20),
    CONSTRAINT fk_tour_plan_customer FOREIGN KEY (customer_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS tour_stop (
    id INT AUTO_INCREMENT PRIMARY KEY,
    shop_id INT,
    stop_index INT,
    planned_cost INT,
    time_to_spend_in_minutes INT,
    tour_plan_id INT,
    CONSTRAINT fk_tour_stop_shop FOREIGN KEY (shop_id) REFERENCES shop(id),
    CONSTRAINT fk_tour_stop_plan FOREIGN KEY (tour_plan_id) REFERENCES tour_plan(id)
);

CREATE TABLE IF NOT EXISTS tour_stop_item (
    id INT AUTO_INCREMENT PRIMARY KEY,
    dish_id INT,
    quantity INT,
    price_per_unit INT,
    tour_stop_id INT,
    CONSTRAINT fk_tour_stop_item_dish FOREIGN KEY (dish_id) REFERENCES dish(id),
    CONSTRAINT fk_tour_stop_item_stop FOREIGN KEY (tour_stop_id) REFERENCES tour_stop(id)
);

CREATE TABLE IF NOT EXISTS admin_audit_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    actor_id INT NULL,
    actor_email VARCHAR(255) NULL,
    actor_role VARCHAR(20) NULL,
    method VARCHAR(16) NULL,
    path VARCHAR(255) NULL,
    status_code INT NULL,
    ip_address VARCHAR(128) NULL,
    user_agent VARCHAR(500) NULL,
    action VARCHAR(32) NULL,
    detail VARCHAR(1000) NULL,
    created_at DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS admin_jobs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    job_code VARCHAR(64) NOT NULL UNIQUE,
    type VARCHAR(40) NOT NULL,
    status VARCHAR(20) NOT NULL,
    related_poi_id INT NULL,
    related_user_id INT NULL,
    retry_count INT NOT NULL DEFAULT 0,
    error_message VARCHAR(1000) NULL,
    created_at DATETIME NOT NULL,
    started_at DATETIME NULL,
    ended_at DATETIME NULL
);

CREATE TABLE IF NOT EXISTS admin_settings (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT NOT NULL,
    updated_at DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS analytics_event (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    event_id VARCHAR(64) NOT NULL UNIQUE,
    shop_id INT NOT NULL,
    poi_id INT NULL,
    dish_id INT NULL,
    customer_id INT NULL,
    session_id VARCHAR(64) NOT NULL,
    event_type VARCHAR(32) NOT NULL,
    language_code VARCHAR(16) NULL,
    source VARCHAR(32) NOT NULL,
    occurred_at DATETIME(3) NOT NULL,
    metadata_json TEXT NULL,
    INDEX idx_analytics_shop_time (shop_id, occurred_at),
    INDEX idx_analytics_shop_type_time (shop_id, event_type, occurred_at)
);

SET FOREIGN_KEY_CHECKS = 1;
