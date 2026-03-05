"""
mumble API — FastAPI application setup.
All route logic is in the routes/ package.
"""

import os
from fastapi import FastAPI, APIRouter
from starlette.middleware.cors import CORSMiddleware

from config import client, logger
from routes import conversations, voice, vocabulary, progress, resources, auth, payments

app = FastAPI()

# Mount all routes under /api prefix
api_router = APIRouter(prefix="/api")
api_router.include_router(auth.router)
api_router.include_router(conversations.router)
api_router.include_router(voice.router)
api_router.include_router(vocabulary.router)
api_router.include_router(progress.router)
api_router.include_router(resources.router)
api_router.include_router(payments.router)
app.include_router(api_router)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
