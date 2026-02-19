from dotenv import load_dotenv
from fastapi import FastAPI
from src.store.routers import store_upload_router, store_url_router
from src.query.controller import query_router 
from .logging import configure_logging, LogLevels
from pathlib import Path


env_path = Path(__file__).parent.parent / '.env'

load_dotenv(dotenv_path=env_path)
configure_logging(LogLevels.info)
app = FastAPI()
app.include_router(store_upload_router)
app.include_router(store_url_router)
app.include_router(query_router)
