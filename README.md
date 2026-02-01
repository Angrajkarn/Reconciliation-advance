# Enterprise Transaction Reconciliation Platform

## 🏦 Business Context
This platform is designed to simulate the **Operations Technology** environment of a Tier-1 Investment Bank. It addresses the critical need to reconcile high-volume financial transactions between independent banking systems (e.g., Internal Ledger vs. External Payment Gateway) to ensure financial integrity and regulatory compliance.

Unlike simple data matching scripts, this system focuses on **Exception-Driven Processing**, where:
1.  **Straight-Through Processing (STP)**: Clean matches are auto-reconciled without human intervention.
2.  **Exception Management**: Discrepancies are categorized by severity (Risk/Compliance) for manual operations review.
3.  **Auditability**: Every decision and status change is logged for regulatory audit trials (e.g., SOX, Basel III).

## 🚀 Key Features
- **Multi-Stage Reconciliation Engine**:
    - *Stage 1*: Exact Matching (100% confidence).
    - *Stage 2*: Tolerance-based Matching (fx rounding, T+1 settlement dates).
    - *Stage 3*: Exception Intelligence (identifying orphans, duplicates).
- **Enterprise Architecture**:
    - **Data Ingestion**: Schema-validated loading from diverse sources (CSV/Excel).
    - **Persistence**: SQL-ready schema for robust data storage.
    - **Audit Trail**: Immutable logs for all system actions.
- **Reporting**: Detailed breakdown of breaks (exceptions) for Operations teams.

## 🛠 Technology Stack
- **Language**: Python 3.10+
- **Core Libraries**: `pandas` (Vectorized processing), `numpy` (Numerical ops).
- **Configuration**: YAML-based rule definitions.
- **Database**: SQL-compliant (Schema provided for PostgreSQL/MySQL).

## 📂 Project Structure
```
.
├── config/             # Business rules and configuration
│   └── settings.yaml   # Tolerances, thresholds, and paths
├── data/               # Input files and generated reports
├── schema/             # Database DDL scripts
│   └── init.sql        # SQL Schema for Transactions & Audit
├── src/                # Source code
│   ├── ingestion.py    # Data loading & validation
│   ├── engine.py       # Reconciliation logic
│   ├── exceptions.py   # Error classification
│   └── main.py         # Pipeline orchestrator
└── requirements.txt    # Python dependencies
```

## 📜 How to Run
1.  **Install Dependencies**:
    ```bash
    pip install -r requirements.txt
    ```
2.  **Configure Rules**:
    Modify `config/settings.yaml` to set your specific amount tolerances or date offsets.
3.  **Execute Pipeline**:
    ```bash
    python src/main.py
    ```
4.  **Review Output**:
    Check the `data/output/` directory for reconciliation reports and `data/logs/` for the audit trail.
