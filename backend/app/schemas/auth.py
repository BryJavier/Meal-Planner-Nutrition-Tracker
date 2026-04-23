from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    email: EmailStr
    username: str = Field(min_length=3, max_length=100)
    password: str = Field(min_length=8)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


class UserRead(BaseModel):
    id: str
    email: str
    username: str
    calorie_goal: int | None
    protein_goal_g: float | None
    carbs_goal_g: float | None
    fat_goal_g: float | None
    dietary_preferences: list[str] | None

    model_config = {"from_attributes": True}


class UserUpdate(BaseModel):
    calorie_goal: int | None = None
    protein_goal_g: float | None = None
    carbs_goal_g: float | None = None
    fat_goal_g: float | None = None
    dietary_preferences: list[str] | None = None
