"""
CodeSage AI — Security: JWT + Password Hashing
"""

from datetime import datetime, timedelta
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
import bcrypt
from bson import ObjectId

from app.core.config import settings

# ── Password Hashing ────────────────────────────────────────────────────────
# ── Password Hashing ────────────────────────────────────────────────────────

# ── OAuth2 Scheme ────────────────────────────────────────────────────────────
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def get_password_hash(password: str) -> str:
    pwd_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    pwd_bytes = plain_password.encode('utf-8')
    hash_bytes = hashed_password.encode('utf-8')
    return bcrypt.checkpw(pwd_bytes, hash_bytes)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


async def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    from app.core import database
    user = await database.users_collection.find_one({"username": username})
    if user is None:
        raise credentials_exception
    return user


async def get_optional_user(token: str = Depends(oauth2_scheme)) -> Optional[dict]:
    """Returns user or None — for optional auth endpoints."""
    try:
        return await get_current_user(token)
    except HTTPException:
        return None
