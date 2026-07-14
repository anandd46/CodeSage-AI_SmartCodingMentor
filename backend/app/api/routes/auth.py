"""
CodeSage AI — Auth Routes
Register, Login, Profile, Update Profile
"""

from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from bson import ObjectId

from app.core.security import (
    get_password_hash, verify_password,
    create_access_token, get_current_user
)
from app.core import database

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


# ── Request / Response Models ─────────────────────────────────────────────────
class RegisterRequest(BaseModel):
    username: str
    email: EmailStr
    password: str
    skill_level: str = "Beginner"
    career_goal: str = ""


class LoginRequest(BaseModel):
    username: str
    password: str


class UpdateProfileRequest(BaseModel):
    skill_level: Optional[str] = None
    career_goal: Optional[str] = None


# ── Endpoints ─────────────────────────────────────────────────────────────────
@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(req: RegisterRequest):
    # Check duplicates
    existing = await database.users_collection.find_one(
        {"$or": [{"username": req.username}, {"email": req.email}]}
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username or email already registered",
        )

    hashed = get_password_hash(req.password)
    user_doc = {
        "username": req.username,
        "email": req.email,
        "hashed_password": hashed,
        "skill_level": req.skill_level,
        "career_goal": req.career_goal,
        "xp": 0,
        "streak": 0,
        "total_sessions": 0,
        "badges": [],
        "completed_topics": [],
        "weak_topics": [],
        "created_at": datetime.utcnow(),
        "last_login": datetime.utcnow(),
    }

    result = await database.users_collection.insert_one(user_doc)
    token = create_access_token(data={"sub": req.username})

    return {
        "access_token": token,
        "token_type": "bearer",
        "user_id": str(result.inserted_id),
        "username": req.username,
        "email": req.email,
        "skill_level": req.skill_level,
    }


@router.post("/login")
async def login(req: LoginRequest):
    user = await database.users_collection.find_one({"username": req.username})
    if not user or not verify_password(req.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )

    # Update last login
    await database.users_collection.update_one(
        {"_id": user["_id"]},
        {"$set": {"last_login": datetime.utcnow()}}
    )

    token = create_access_token(data={"sub": user["username"]})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user_id": str(user["_id"]),
        "username": user["username"],
        "email": user["email"],
        "skill_level": user.get("skill_level", "Beginner"),
        "xp": user.get("xp", 0),
    }


@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return {
        "id": str(current_user["_id"]),
        "username": current_user["username"],
        "email": current_user["email"],
        "xp": current_user.get("xp", 0),
        "streak": current_user.get("streak", 0),
        "skill_level": current_user.get("skill_level", "Beginner"),
        "career_goal": current_user.get("career_goal", ""),
        "completed_topics": current_user.get("completed_topics", []),
        "badges_count": len(current_user.get("badges", [])),
        "total_sessions": current_user.get("total_sessions", 0),
        "created_at": current_user.get("created_at", datetime.utcnow()).isoformat(),
    }


@router.patch("/profile")
async def update_profile(
    req: UpdateProfileRequest,
    current_user: dict = Depends(get_current_user)
):
    updates = {}
    if req.skill_level is not None:
        updates["skill_level"] = req.skill_level
    if req.career_goal is not None:
        updates["career_goal"] = req.career_goal

    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")

    try:
        await database.users_collection.update_one(
            {"_id": ObjectId(str(current_user["_id"]))},
            {"$set": updates}
        )
    except Exception:
        await database.users_collection.update_one(
            {"_id": current_user["_id"]},
            {"$set": updates}
        )

    return {"message": "Profile updated successfully", "updates": updates}
