"""
Payment routes — Razorpay integration for subscription plans.
"""

import os
import razorpay
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from config import db, logger
from routes.auth import get_current_user

router = APIRouter(prefix="/payments", tags=["payments"])

RAZORPAY_KEY_ID = os.environ.get("RAZORPAY_KEY_ID")
RAZORPAY_KEY_SECRET = os.environ.get("RAZORPAY_KEY_SECRET")

razorpay_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))

# Plan definitions
PLANS = {
    "free": {
        "name": "Free",
        "price": 0,
        "credits": 50,
        "max_conversations": 3,
    },
    "plus": {
        "name": "Plus",
        "price": 1499,  # $14.99 in cents
        "price_display": 14.99,
        "credits": 1000,
        "max_conversations": 10,
    },
    "pro": {
        "name": "Pro",
        "price": 2999,  # $29.99 in cents
        "price_display": 29.99,
        "credits": 5000,
        "max_conversations": -1,  # unlimited
    },
}


class CreateOrderRequest(BaseModel):
    plan: str


class VerifyPaymentRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    plan: str


@router.get("/plans")
async def get_plans():
    """Return available plans."""
    return {
        "plans": [
            {
                "id": plan_id,
                "name": plan["name"],
                "price": plan.get("price_display", plan["price"]),
                "credits": plan["credits"],
                "max_conversations": plan["max_conversations"],
            }
            for plan_id, plan in PLANS.items()
        ]
    }


@router.get("/subscription")
async def get_subscription(user: dict = Depends(get_current_user)):
    """Get current user's subscription and credit balance."""
    sub = await db.subscriptions.find_one(
        {"user_id": user["id"]}, {"_id": 0}
    )
    if not sub:
        # Default to free plan
        sub = {
            "user_id": user["id"],
            "plan": "free",
            "credits": 50,
            "max_conversations": 3,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        await db.subscriptions.insert_one({**sub})
        sub.pop("_id", None)

    return sub


@router.post("/create-order")
async def create_order(
    req: CreateOrderRequest,
    user: dict = Depends(get_current_user),
):
    """Create a Razorpay order for a plan upgrade."""
    plan = PLANS.get(req.plan)
    if not plan or req.plan == "free":
        raise HTTPException(status_code=400, detail="Invalid plan")

    # Amount in paise (INR) — Razorpay uses smallest currency unit
    # For USD $14 → convert to INR at approximate rate, or use USD directly
    # Razorpay supports USD — amount in cents
    amount = plan["price"]  # in cents for USD

    try:
        order = razorpay_client.order.create({
            "amount": amount * 100,  # Razorpay expects paise/cents (smallest unit)
            "currency": "USD",
            "receipt": f"sub_{user['id'][:8]}_{req.plan}",
            "notes": {
                "user_id": user["id"],
                "plan": req.plan,
            }
        })
        logger.info(f"Created Razorpay order {order['id']} for user {user['id']}, plan {req.plan}")
        return {
            "order_id": order["id"],
            "amount": order["amount"],
            "currency": order["currency"],
            "key_id": RAZORPAY_KEY_ID,
        }
    except Exception as e:
        logger.error(f"Razorpay order creation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Payment initiation failed: {str(e)}")


@router.post("/verify-payment")
async def verify_payment(
    req: VerifyPaymentRequest,
    user: dict = Depends(get_current_user),
):
    """Verify Razorpay payment signature and activate subscription."""
    plan = PLANS.get(req.plan)
    if not plan or req.plan == "free":
        raise HTTPException(status_code=400, detail="Invalid plan")

    # Verify signature
    try:
        razorpay_client.utility.verify_payment_signature({
            "razorpay_order_id": req.razorpay_order_id,
            "razorpay_payment_id": req.razorpay_payment_id,
            "razorpay_signature": req.razorpay_signature,
        })
    except razorpay.errors.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Payment verification failed")

    now = datetime.now(timezone.utc).isoformat()

    # Update or create subscription
    await db.subscriptions.update_one(
        {"user_id": user["id"]},
        {"$set": {
            "plan": req.plan,
            "credits": plan["credits"],
            "max_conversations": plan["max_conversations"],
            "razorpay_payment_id": req.razorpay_payment_id,
            "razorpay_order_id": req.razorpay_order_id,
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
        "created_at": now,
    })

    logger.info(f"Payment verified for user {user['id']}, plan {req.plan}, credits {plan['credits']}")

    return {
        "status": "success",
        "plan": req.plan,
        "credits": plan["credits"],
    }
