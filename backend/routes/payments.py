"""
Payment routes — Razorpay subscription-based billing.
Plans: Free (100 credits), Plus (1000 credits/mo), Pro (5000 credits/mo).
Credits roll over. Downgrade/cancel takes effect at end of billing cycle.
"""

import os
import hmac
import hashlib
import logging
from datetime import datetime, timezone

import razorpay
from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel

from config import db
from auth import get_current_user

logger = logging.getLogger("linguaflow")
router = APIRouter(prefix="/payments", tags=["payments"])

RAZORPAY_KEY_ID = os.environ.get("RAZORPAY_KEY_ID")
RAZORPAY_KEY_SECRET = os.environ.get("RAZORPAY_KEY_SECRET")
ADMIN_SECRET = os.environ.get("JWT_SECRET")

razorpay_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))

PLANS = {
    "free": {
        "name": "Free",
        "price": 0,
        "price_display": "Free",
        "credits": 500,
        "max_conversations": 3,
        "razorpay_plan_id": None,
    },
    "plus": {
        "name": "Plus",
        "price": 1199,
        "price_display": "Rs 1,199/mo",
        "credits": 3000,
        "max_conversations": 10,
        "razorpay_plan_id": os.environ.get("RAZORPAY_PLUS_PLAN_ID"),
    },
    "pro": {
        "name": "Pro",
        "price": 2499,
        "price_display": "Rs 2,499/mo",
        "credits": 7000,
        "max_conversations": -1,
        "razorpay_plan_id": os.environ.get("RAZORPAY_PRO_PLAN_ID"),
    },
}

PLAN_ORDER = {"free": 0, "plus": 1, "pro": 2}


# ── Pydantic models ─────────────────────────────────────

class CreateSubscriptionRequest(BaseModel):
    plan: str

class VerifySubscriptionRequest(BaseModel):
    razorpay_payment_id: str
    razorpay_subscription_id: str
    razorpay_signature: str
    plan: str


# ── Plans & Subscription Info ────────────────────────────

@router.get("/plans")
async def get_plans():
    return {
        "plans": [
            {
                "id": k,
                "name": v["name"],
                "price": v["price"],
                "price_display": v["price_display"],
                "credits": v["credits"],
                "max_conversations": v["max_conversations"],
            }
            for k, v in PLANS.items()
        ]
    }


@router.get("/subscription")
async def get_subscription(user: dict = Depends(get_current_user)):
    sub = await db.subscriptions.find_one({"user_id": user["id"]}, {"_id": 0})
    if not sub:
        now = datetime.now(timezone.utc).isoformat()
        sub = {
            "user_id": user["id"],
            "plan": "free",
            "credits": 100,
            "max_conversations": 3,
            "created_at": now,
        }
        await db.subscriptions.insert_one(sub)
        sub.pop("_id", None)

    plan_info = PLANS.get(sub["plan"], PLANS["free"])
    return {
        "user_id": sub["user_id"],
        "plan": sub["plan"],
        "credits": sub["credits"],
        "max_conversations": sub.get("max_conversations", plan_info["max_conversations"]),
        "razorpay_subscription_id": sub.get("razorpay_subscription_id"),
        "subscription_status": sub.get("subscription_status", "active" if sub["plan"] != "free" else None),
        "current_period_end": sub.get("current_period_end"),
        "pending_plan": sub.get("pending_plan"),
    }


# ── Create Subscription ─────────────────────────────────

@router.post("/create-subscription")
async def create_subscription(
    req: CreateSubscriptionRequest,
    user: dict = Depends(get_current_user),
):
    plan = PLANS.get(req.plan)
    if not plan or req.plan == "free":
        raise HTTPException(status_code=400, detail="Invalid plan")

    if not plan["razorpay_plan_id"]:
        raise HTTPException(status_code=500, detail="Razorpay plan not configured")

    try:
        subscription = razorpay_client.subscription.create({
            "plan_id": plan["razorpay_plan_id"],
            "total_count": 12,
            "quantity": 1,
            "notes": {
                "user_id": user["id"],
                "plan": req.plan,
            }
        })
        logger.info(f"Created subscription {subscription['id']} for user {user['id']}, plan {req.plan}")
        return {
            "subscription_id": subscription["id"],
            "plan": req.plan,
            "key_id": RAZORPAY_KEY_ID,
        }
    except Exception as e:
        logger.error(f"Subscription creation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Subscription creation failed: {str(e)}")


# ── Verify Subscription Payment ──────────────────────────

@router.post("/verify-subscription")
async def verify_subscription(
    req: VerifySubscriptionRequest,
    user: dict = Depends(get_current_user),
):
    plan = PLANS.get(req.plan)
    if not plan or req.plan == "free":
        raise HTTPException(status_code=400, detail="Invalid plan")

    # Verify signature
    expected_sig = hmac.new(
        RAZORPAY_KEY_SECRET.encode(),
        f"{req.razorpay_payment_id}|{req.razorpay_subscription_id}".encode(),
        hashlib.sha256,
    ).hexdigest()

    if expected_sig != req.razorpay_signature:
        raise HTTPException(status_code=400, detail="Invalid payment signature")

    now = datetime.now(timezone.utc).isoformat()

    # Get current credits to stack
    current_sub = await db.subscriptions.find_one({"user_id": user["id"]})
    existing_credits = current_sub["credits"] if current_sub else 0

    # Update subscription
    await db.subscriptions.update_one(
        {"user_id": user["id"]},
        {"$set": {
            "plan": req.plan,
            "credits": existing_credits + plan["credits"],
            "max_conversations": plan["max_conversations"],
            "razorpay_subscription_id": req.razorpay_subscription_id,
            "razorpay_payment_id": req.razorpay_payment_id,
            "subscription_status": "active",
            "pending_plan": None,
            "updated_at": now,
        },
        "$setOnInsert": {
            "user_id": user["id"],
            "created_at": now,
        }},
        upsert=True,
    )

    # Log the transaction
    await db.credit_transactions.insert_one({
        "user_id": user["id"],
        "type": "purchase",
        "plan": req.plan,
        "credits_added": plan["credits"],
        "razorpay_payment_id": req.razorpay_payment_id,
        "razorpay_subscription_id": req.razorpay_subscription_id,
        "created_at": now,
    })

    logger.info(f"Subscription verified: user={user['id']}, plan={req.plan}, credits={existing_credits}+{plan['credits']}")

    return {
        "status": "success",
        "plan": req.plan,
        "credits": existing_credits + plan["credits"],
    }


# ── Cancel Subscription ──────────────────────────────────

@router.post("/cancel-subscription")
async def cancel_subscription(user: dict = Depends(get_current_user)):
    sub = await db.subscriptions.find_one({"user_id": user["id"]}, {"_id": 0})
    if not sub or sub["plan"] == "free":
        raise HTTPException(status_code=400, detail="No active subscription to cancel")

    razorpay_sub_id = sub.get("razorpay_subscription_id")
    if razorpay_sub_id:
        try:
            razorpay_client.subscription.cancel(razorpay_sub_id, {"cancel_at_cycle_end": 1})
            logger.info(f"Cancelled subscription {razorpay_sub_id} at cycle end for user {user['id']}")
        except Exception as e:
            logger.error(f"Razorpay cancel failed: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to cancel subscription: {str(e)}")

    # Mark as pending cancellation — keeps current plan until cycle ends
    await db.subscriptions.update_one(
        {"user_id": user["id"]},
        {"$set": {
            "subscription_status": "cancelling",
            "pending_plan": "free",
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }}
    )

    return {
        "status": "success",
        "message": "Subscription will be cancelled at the end of your current billing cycle. You'll keep your current plan benefits until then.",
    }


# ── Change Plan (Upgrade/Downgrade) ──────────────────────

class ChangePlanRequest(BaseModel):
    plan: str

@router.post("/change-plan")
async def change_plan(
    req: ChangePlanRequest,
    user: dict = Depends(get_current_user),
):
    new_plan = PLANS.get(req.plan)
    if not new_plan:
        raise HTTPException(status_code=400, detail="Invalid plan")

    sub = await db.subscriptions.find_one({"user_id": user["id"]}, {"_id": 0})
    if not sub:
        raise HTTPException(status_code=400, detail="No subscription found")

    current_plan = sub["plan"]
    if current_plan == req.plan:
        raise HTTPException(status_code=400, detail="Already on this plan")

    is_upgrade = PLAN_ORDER.get(req.plan, 0) > PLAN_ORDER.get(current_plan, 0)

    if is_upgrade:
        # Upgrades create a new subscription — handled by create-subscription + verify
        raise HTTPException(status_code=400, detail="Use the subscription checkout flow to upgrade")

    # Downgrade — schedule for end of cycle
    await db.subscriptions.update_one(
        {"user_id": user["id"]},
        {"$set": {
            "pending_plan": req.plan,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }}
    )

    return {
        "status": "success",
        "message": f"Your plan will change to {new_plan['name']} at the end of your current billing cycle.",
    }


# ── Razorpay Webhook ─────────────────────────────────────

@router.post("/webhook")
async def razorpay_webhook(request: Request):
    """Handle Razorpay subscription events."""
    body = await request.body()
    signature = request.headers.get("x-razorpay-signature", "")

    # Verify webhook signature
    expected = hmac.new(
        RAZORPAY_KEY_SECRET.encode(),
        body,
        hashlib.sha256,
    ).hexdigest()

    if expected != signature:
        logger.warning("Webhook signature mismatch")
        raise HTTPException(status_code=400, detail="Invalid signature")

    payload = await request.json()
    event = payload.get("event", "")
    entity = payload.get("payload", {}).get("subscription", {}).get("entity", {})
    sub_id = entity.get("id")
    notes = entity.get("notes", {})
    user_id = notes.get("user_id")
    plan_name = notes.get("plan")

    logger.info(f"Webhook event: {event}, sub={sub_id}, user={user_id}")

    if event == "subscription.charged" and user_id:
        # Recurring payment — add credits
        plan = PLANS.get(plan_name)
        if plan:
            sub = await db.subscriptions.find_one({"user_id": user_id})
            if sub:
                new_credits = sub["credits"] + plan["credits"]
                await db.subscriptions.update_one(
                    {"user_id": user_id},
                    {"$set": {
                        "credits": new_credits,
                        "subscription_status": "active",
                        "updated_at": datetime.now(timezone.utc).isoformat(),
                    }}
                )
                await db.credit_transactions.insert_one({
                    "user_id": user_id,
                    "type": "purchase",
                    "plan": plan_name,
                    "credits_added": plan["credits"],
                    "razorpay_subscription_id": sub_id,
                    "source": "recurring",
                    "created_at": datetime.now(timezone.utc).isoformat(),
                })
                logger.info(f"Recurring charge: +{plan['credits']} credits for user {user_id}")

    elif event == "subscription.cancelled" and user_id:
        # Subscription ended — revert to free or pending plan
        sub = await db.subscriptions.find_one({"user_id": user_id})
        if sub:
            target = sub.get("pending_plan", "free")
            target_plan = PLANS.get(target, PLANS["free"])
            await db.subscriptions.update_one(
                {"user_id": user_id},
                {"$set": {
                    "plan": target,
                    "max_conversations": target_plan["max_conversations"],
                    "subscription_status": None,
                    "razorpay_subscription_id": None,
                    "pending_plan": None,
                    "updated_at": datetime.now(timezone.utc).isoformat(),
                }}
            )
            logger.info(f"Subscription cancelled: user {user_id} reverted to {target}")

    elif event == "subscription.halted" and user_id:
        # Payment failed multiple times
        await db.subscriptions.update_one(
            {"user_id": user_id},
            {"$set": {
                "subscription_status": "halted",
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }}
        )

    return {"status": "ok"}


# ── Credit History ────────────────────────────────────────

@router.get("/credit-history")
async def get_credit_history(
    page: int = 1,
    limit: int = 20,
    type: str = None,
    user: dict = Depends(get_current_user),
):
    query = {"user_id": user["id"]}
    if type in ("purchase", "usage"):
        query["type"] = type

    total = await db.credit_transactions.count_documents(query)
    skip = (max(1, page) - 1) * limit

    cursor = db.credit_transactions.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit)
    transactions = await cursor.to_list(length=limit)

    return {
        "transactions": transactions,
        "total": total,
        "page": page,
        "pages": max(1, -(-total // limit)),
    }


# ── Admin: Add Credits ────────────────────────────────────

class AdminCreditRequest(BaseModel):
    email: str
    credits: int
    admin_key: str


@router.post("/admin/add-credits")
async def admin_add_credits(data: AdminCreditRequest):
    if data.admin_key != ADMIN_SECRET:
        raise HTTPException(status_code=403, detail="Invalid admin key")

    if data.credits <= 0:
        raise HTTPException(status_code=400, detail="Credits must be positive")

    user = await db.users.find_one({"email": data.email.lower()}, {"_id": 0, "id": 1, "email": 1})
    if not user:
        raise HTTPException(status_code=404, detail=f"No user found with email {data.email}")

    sub = await db.subscriptions.find_one({"user_id": user["id"]})
    if not sub:
        raise HTTPException(status_code=404, detail="No subscription found for this user")

    old_credits = sub["credits"]
    new_credits = old_credits + data.credits

    await db.subscriptions.update_one({"user_id": user["id"]}, {"$set": {"credits": new_credits}})

    await db.credit_transactions.insert_one({
        "user_id": user["id"],
        "type": "purchase",
        "plan": "admin_topup",
        "credits_added": data.credits,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })

    logger.info(f"Admin added {data.credits} credits to {data.email}: {old_credits} -> {new_credits}")

    return {
        "email": data.email,
        "credits_added": data.credits,
        "old_balance": old_credits,
        "new_balance": new_credits,
    }
