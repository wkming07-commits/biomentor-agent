"""Initialize the database: create all tables and seed demo data."""
import sys
import traceback

sys.path.insert(0, ".")

try:
    from app.database import engine, Base
    from app.models import *  # noqa — register all models
    from app.seed import seed_demo_data
    from app.database import SessionLocal

    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("Tables created successfully.")

    print("Seeding demo data...")
    db = SessionLocal()
    try:
        seed_demo_data(db)
        print("Demo data seeded successfully.")
    finally:
        db.close()

    # List tables
    from sqlalchemy import inspect
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    print(f"\nDatabase contains {len(tables)} tables:")
    for t in sorted(tables):
        print(f"  - {t}")

except Exception:
    traceback.print_exc()
    sys.exit(1)
