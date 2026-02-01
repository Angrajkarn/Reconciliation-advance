import asyncio
from sqlalchemy import text
from app.db.session import engine

async def test_connection():
    print("Testing RAW Engine Connection...")
    try:
        async with engine.connect() as conn:
            result = await conn.execute(text("SELECT 1"))
            print(f"✅ Engine Connection Successful. Result: {result.scalar()}")
            
            result_users = await conn.execute(text("SELECT email FROM users"))
            for row in result_users:
                 print(f"✅ Found User: {row.email}")
    except Exception as e:
        print(f"❌ Engine Failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_connection())
