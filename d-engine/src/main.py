from fastapi import FastAPI
from src.process.controller import router as process
from .logging import configure_logging, LogLevels

configure_logging(LogLevels.info)
app = FastAPI()
app.include_router(process)
