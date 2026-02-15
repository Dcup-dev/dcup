from dotenv import load_dotenv
from fastapi import FastAPI
from src.process.controller import router as process
from .logging import configure_logging, LogLevels
from pathlib import Path


env_path = Path(__file__).parent / '.env'

load_dotenv(dotenv_path=env_path)
configure_logging(LogLevels.info)
app = FastAPI()
app.include_router(process)
