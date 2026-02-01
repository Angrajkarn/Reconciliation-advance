import sqlite3
import pandas as pd

DB_PATH = "resonant.db"

def inspect_db():
    print(f"🕵️‍♂️ Inspecting Database: {DB_PATH}")
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # 1. Check Table Exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='transactions';")
        if not cursor.fetchone():
            print("❌ Table 'transactions' DOES NOT EXIST.")
            return

        # 2. Check Schema
        print("\n📋 Schema for 'transactions':")
        cursor.execute("PRAGMA table_info(transactions);")
        columns = [row[1] for row in cursor.fetchall()]
        print(columns)
        
        # 3. Check Row Count
        cursor.execute("SELECT count(*) FROM transactions;")
        count = cursor.fetchone()[0]
        print(f"\n📊 Total Rows: {count}")
        
        # 4. Sample Data
        if count > 0:
            print("\n📝 Sample Row:")
            df = pd.read_sql_query("SELECT * FROM transactions LIMIT 1", conn)
            print(df.to_string())
        else:
            print("\n⚠️ Table is Empty.")

        conn.close()

    except Exception as e:
        print(f"❌ Error inspecting DB: {e}")

if __name__ == "__main__":
    inspect_db()
