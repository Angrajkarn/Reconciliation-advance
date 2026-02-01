-- Enterprise Transaction Reconciliation Platform Schema
-- Database: PostgreSQL / MySQL Compatible

-- 1. Reconciliation Runs: Tracks each execution instance
CREATE TABLE recon_runs (
    run_id VARCHAR(50) PRIMARY KEY,
    run_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) CHECK (status IN ('STARTED', 'COMPLETED', 'FAILED')),
    total_records NUMERIC,
    matched_records NUMERIC,
    exception_records NUMERIC
);

-- 2. Source Transactions: Staging area for raw data ingestion
CREATE TABLE recon_transactions (
    txn_id VARCHAR(100) PRIMARY KEY, -- Internal unique ID
    run_id VARCHAR(50) REFERENCES recon_runs(run_id),
    source_system VARCHAR(50) NOT NULL, -- 'CORE_BANKING', 'GATEWAY'
    external_ref_id VARCHAR(100), -- ID from the source system
    value_date DATE NOT NULL,
    amount DECIMAL(18, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    counterparty_account VARCHAR(50),
    status VARCHAR(20) DEFAULT 'PENDING' -- 'PENDING', 'MATCHED', 'EXCEPTION'
);

-- 3. Match Results: successfully reconciled transactions
CREATE TABLE recon_results (
    match_id SERIAL PRIMARY KEY,
    run_id VARCHAR(50) REFERENCES recon_runs(run_id),
    txn_id_source_a VARCHAR(100) REFERENCES recon_transactions(txn_id),
    txn_id_source_b VARCHAR(100) REFERENCES recon_transactions(txn_id),
    match_type VARCHAR(20), -- 'EXACT', 'TOLERANCE'
    match_score DECIMAL(5, 2), -- 100.00 for Exact, <100 for Fuzzy
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Exceptions: Items requiring manual intervention
CREATE TABLE recon_exceptions (
    exception_id SERIAL PRIMARY KEY,
    run_id VARCHAR(50) REFERENCES recon_runs(run_id),
    txn_id VARCHAR(100) REFERENCES recon_transactions(txn_id),
    exception_code VARCHAR(20), -- 'AMT_MISMATCH', 'DATE_MISMATCH', 'ORPHAN'
    severity VARCHAR(10) CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH')),
    description TEXT,
    resolution_status VARCHAR(20) DEFAULT 'OPEN' -- 'OPEN', 'INVESTIGATING', 'RESOLVED'
);

-- 5. Audit Log: Immutable record of all system actions
CREATE TABLE audit_log (
    audit_id SERIAL PRIMARY KEY,
    run_id VARCHAR(50),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    component VARCHAR(50), -- 'INGESTION', 'ENGINE', 'REPORTING'
    action VARCHAR(50),
    message TEXT,
    metadata JSONB -- Flexible storage for extra context
);

CREATE INDEX idx_txn_date ON recon_transactions(value_date);
CREATE INDEX idx_txn_amount ON recon_transactions(amount);
CREATE INDEX idx_txn_ref ON recon_transactions(external_ref_id);
