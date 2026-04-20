from app.database import engine
from app import models

print("Dropping existing tables to apply new schema...")
models.Base.metadata.drop_all(bind=engine)
print("Creating new tables...")
models.Base.metadata.create_all(bind=engine)
print("Done! Restart your backend and try importing again.")
