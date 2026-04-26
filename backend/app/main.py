from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.routers import auth, ingredients, recipes, meal_plans, nutrition, ai, suggestions
from app.seed import seed as run_seed

limiter = Limiter(key_func=get_remote_address)

app = FastAPI(title="Meal Planner API", version="1.0.0", docs_url="/docs")


@app.on_event("startup")
async def on_startup():
    await run_seed()
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(ingredients.router)
app.include_router(recipes.router)
app.include_router(meal_plans.router)
app.include_router(nutrition.router)
app.include_router(ai.router)
app.include_router(suggestions.router)


@app.exception_handler(404)
async def not_found_handler(request: Request, exc):
    return JSONResponse(status_code=404, content={"detail": "Not found"})


@app.exception_handler(500)
async def server_error_handler(request: Request, exc):
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})


@app.get("/health")
async def health():
    return {"status": "ok"}
