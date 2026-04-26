import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.auth import (
    RegisterRequest, LoginRequest, TokenResponse, RefreshRequest,
    UserRead, UserUpdate, ChangePasswordRequest, ApiKeyRequest,
)
from app.services.auth_service import (
    hash_password, verify_password,
    create_access_token, create_refresh_token, decode_token,
)
from app.utils.crypto import encrypt

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(body: RegisterRequest, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(User).where(User.email == body.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        id=str(uuid.uuid4()),
        email=body.email,
        username=body.username,
        hashed_password=hash_password(body.password),
    )
    db.add(user)
    await db.commit()

    return TokenResponse(
        access_token=create_access_token(user.id),
        refresh_token=create_refresh_token(user.id),
    )


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()
    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    return TokenResponse(
        access_token=create_access_token(user.id),
        refresh_token=create_refresh_token(user.id),
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh(body: RefreshRequest, db: AsyncSession = Depends(get_db)):
    payload = decode_token(body.refresh_token)
    if payload is None or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    user_id = payload.get("sub")
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return TokenResponse(
        access_token=create_access_token(user.id),
        refresh_token=create_refresh_token(user.id),
    )


@router.get("/me", response_model=UserRead)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.patch("/me", response_model=UserRead)
async def update_me(
    body: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    updates = body.model_dump(exclude_none=True)

    if "username" in updates and updates["username"] != current_user.username:
        clash = await db.execute(select(User).where(User.username == updates["username"]))
        if clash.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Username already taken")

    for field, value in updates.items():
        setattr(current_user, field, value)

    db.add(current_user)
    await db.commit()
    return current_user


@router.post("/me/change-password", status_code=status.HTTP_204_NO_CONTENT)
async def change_password(
    body: ChangePasswordRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not verify_password(body.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    current_user.hashed_password = hash_password(body.new_password)
    db.add(current_user)
    await db.commit()


@router.put("/me/api-key", response_model=UserRead)
async def update_api_key(
    body: ApiKeyRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if body.api_key == "":
        current_user.anthropic_api_key_encrypted = None
    else:
        current_user.anthropic_api_key_encrypted = encrypt(body.api_key)

    db.add(current_user)
    await db.commit()
    return current_user
