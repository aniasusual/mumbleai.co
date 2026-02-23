"""Language list and scenario routes."""

from fastapi import APIRouter

from languages import get_all_languages_sorted
from scenarios import SCENARIOS

router = APIRouter()


@router.get("/languages")
async def get_languages():
    popular, others = get_all_languages_sorted()
    return {"popular": popular, "others": others}


@router.get("/scenarios")
async def get_scenarios():
    return [
        {"id": key, **{k: v for k, v in val.items() if k != "starter_prompts"}, "prompts": val["starter_prompts"]}
        for key, val in SCENARIOS.items()
    ]
