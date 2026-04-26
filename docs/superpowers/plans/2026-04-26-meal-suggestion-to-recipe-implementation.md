# Meal Suggestion to Recipe Conversion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a floating drawer with meal suggestion cards that convert to recipes with one click, supporting servings confirmation and automatic ingredient scaling.

**Architecture:** Backend adds recipe creation from suggestions endpoint. Frontend creates: floating button component, collapsible drawer component, conversion modal, and meal suggestion card component. Zustand store manages drawer state and suggestions. All wrapped in AppLayout so it's accessible globally.

**Tech Stack:** FastAPI (backend), React + Zustand (frontend), Ant Design (UI components)

---

## File Structure

### Frontend Files (Create)
- `frontend/src/components/meal-suggestion/FloatingButton.jsx` — Fixed position button
- `frontend/src/components/meal-suggestion/MealSuggestionDrawer.jsx` — Collapsible drawer
- `frontend/src/components/meal-suggestion/MealSuggestionCard.jsx` — Suggestion display
- `frontend/src/components/meal-suggestion/ConvertToRecipeModal.jsx` — Servings dialog
- `frontend/src/store/mealSuggestionStore.js` — Zustand store
- `frontend/src/api/mealSuggestions.js` — API client

### Frontend Files (Modify)
- `frontend/src/components/layout/AppLayout.jsx` — Add floating components
- `frontend/src/components/recipes/RecipeForm.jsx` — Add scaling logic

### Backend Files (Create)
- `backend/app/routers/suggestions.py` — Suggestion endpoints
- `backend/app/services/suggestion_service.py` — AI suggestion service

### Backend Files (Modify)
- `backend/app/models/recipe.py` — Add servings field
- `backend/app/main.py` — Register router

---

## Tasks

### Task 1: Backend - Create Suggestion Model

**Files:**
- Create: `backend/app/models/suggestion.py`

- [ ] **Step 1: Create model**

```bash
cat > backend/app/models/suggestion.py << 'EOF'
from sqlalchemy import Column, String, Integer, JSON, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Suggestion(Base):
    __tablename__ = "suggestions"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("user.id"), nullable=False)
    meal_name = Column(String, nullable=False)
    ingredients = Column(JSON, nullable=False)
    prep_time = Column(Integer, nullable=False)
    servings = Column(Integer, nullable=False)
    macros = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="suggestions")
EOF
```

---

### Task 2: Backend - Update Recipe Model

**Files:**
- Modify: `backend/app/models/recipe.py`

- [ ] **Step 1: Verify servings field exists**

Open `backend/app/models/recipe.py` and ensure Recipe model has:
```python
servings = Column(Integer, nullable=False, default=1)
```

If not, add this line.

---

### Task 3: Backend - Create Database Migration

**Files:**
- Modify: Database via alembic

- [ ] **Step 1: Create and run migration**

```bash
cd backend
alembic revision --autogenerate -m "add suggestions and servings"
alembic upgrade head
```

---

### Task 4: Backend - Create Suggestion Service

**Files:**
- Create: `backend/app/services/suggestion_service.py`

- [ ] **Step 1: Create service**

```bash
cat > backend/app/services/suggestion_service.py << 'EOF'
import anthropic
import json
from app.config import settings

async def fetch_meal_suggestion():
    client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
    
    prompt = """Generate a healthy meal suggestion. Return ONLY valid JSON:
{
    "meal_name": "string",
    "ingredients": [{"name": "string", "amount": number, "unit": "string"}],
    "prep_time": number,
    "servings": number,
    "macros": {"protein": number, "carbs": number, "fats": number}
}"""
    
    message = client.messages.create(
        model="claude-3-5-sonnet-20241022",
        max_tokens=1024,
        messages=[{"role": "user", "content": prompt}]
    )
    
    response_text = message.content[0].text
    return json.loads(response_text)
EOF
```

- [ ] **Step 2: Add Anthropic to requirements**

```bash
cd backend
grep -q "anthropic" requirements.txt || echo "anthropic" >> requirements.txt
pip install anthropic
```

---

### Task 5: Backend - Create Suggestion Routes

**Files:**
- Create: `backend/app/routers/suggestions.py`

- [ ] **Step 1: Create routes**

```bash
cat > backend/app/routers/suggestions.py << 'EOF'
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
import uuid
from datetime import datetime
from app.database import get_db
from app.models.suggestion import Suggestion
from app.models.recipe import Recipe
from app.dependencies import get_current_user
from app.services.suggestion_service import fetch_meal_suggestion
from pydantic import BaseModel

router = APIRouter(prefix="/api/suggestions", tags=["suggestions"])

class SuggestionResponse(BaseModel):
    meal_name: str
    ingredients: list
    prep_time: int
    servings: int
    macros: dict

class ConvertToRecipeRequest(BaseModel):
    meal_name: str
    ingredients: list
    prep_time: int
    servings: int
    macros: dict

@router.post("/fetch", response_model=SuggestionResponse)
async def get_meal_suggestion(current_user = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    try:
        suggestion = await fetch_meal_suggestion()
        db_suggestion = Suggestion(
            id=str(uuid.uuid4()),
            user_id=current_user.id,
            meal_name=suggestion["meal_name"],
            ingredients=suggestion["ingredients"],
            prep_time=suggestion["prep_time"],
            servings=suggestion["servings"],
            macros=suggestion["macros"]
        )
        db.add(db_suggestion)
        await db.commit()
        return suggestion
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/convert-to-recipe")
async def convert_to_recipe(data: ConvertToRecipeRequest, current_user = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    try:
        new_recipe = Recipe(
            id=str(uuid.uuid4()),
            user_id=current_user.id,
            name=data.meal_name,
            ingredients=data.ingredients,
            prep_time=data.prep_time,
            servings=data.servings,
            macros=data.macros,
            created_at=datetime.utcnow()
        )
        db.add(new_recipe)
        await db.commit()
        await db.refresh(new_recipe)
        return {"id": new_recipe.id, "name": new_recipe.name}
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
EOF
```

- [ ] **Step 2: Register router in main.py**

Add to `backend/app/main.py` imports:
```python
from app.routers import suggestions
```

Add to router includes:
```python
app.include_router(suggestions.router)
```

---

### Task 6: Frontend - Create Zustand Store

**Files:**
- Create: `frontend/src/store/mealSuggestionStore.js`

- [ ] **Step 1: Create store**

```bash
cat > frontend/src/store/mealSuggestionStore.js << 'EOF'
import { create } from 'zustand'

const useMealSuggestionStore = create((set) => ({
  isDrawerOpen: false,
  currentSuggestion: null,
  isLoadingSuggestion: false,

  setDrawerOpen: (isOpen) => set({ isDrawerOpen: isOpen }),
  setCurrentSuggestion: (suggestion) => set({ currentSuggestion: suggestion }),
  setLoadingSuggestion: (isLoading) => set({ isLoadingSuggestion: isLoading }),
  resetDrawer: () => set({ isDrawerOpen: false, currentSuggestion: null, isLoadingSuggestion: false })
}))

export default useMealSuggestionStore
EOF
```

---

### Task 7: Frontend - Create API Client

**Files:**
- Create: `frontend/src/api/mealSuggestions.js`

- [ ] **Step 1: Create client**

```bash
cat > frontend/src/api/mealSuggestions.js << 'EOF'
import api from './client'

export const mealSuggestionsAPI = {
  async fetchSuggestion() {
    const response = await api.post('/suggestions/fetch')
    return response.data
  },

  async convertToRecipe(suggestion, servings) {
    const response = await api.post('/suggestions/convert-to-recipe', {
      meal_name: suggestion.meal_name,
      ingredients: suggestion.ingredients,
      prep_time: suggestion.prep_time,
      servings: servings,
      macros: suggestion.macros
    })
    return response.data
  }
}
EOF
```

---

### Task 8: Frontend - Create FloatingButton

**Files:**
- Create: `frontend/src/components/meal-suggestion/FloatingButton.jsx`

- [ ] **Step 1: Create component**

```bash
mkdir -p frontend/src/components/meal-suggestion
cat > frontend/src/components/meal-suggestion/FloatingButton.jsx << 'EOF'
import React from 'react'
import { Button } from 'antd'
import { BgColorsOutlined } from '@ant-design/icons'
import useMealSuggestionStore from '../../store/mealSuggestionStore'

const FloatingButton = () => {
  const { isDrawerOpen, setDrawerOpen } = useMealSuggestionStore()

  return (
    <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 100 }}>
      <Button
        type="primary"
        shape="circle"
        size="large"
        icon={<BgColorsOutlined style={{ fontSize: '20px' }} />}
        onClick={() => setDrawerOpen(!isDrawerOpen)}
        style={{ width: '56px', height: '56px', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
      />
    </div>
  )
}

export default FloatingButton
EOF
```

---

### Task 9: Frontend - Create MealSuggestionCard

**Files:**
- Create: `frontend/src/components/meal-suggestion/MealSuggestionCard.jsx`

- [ ] **Step 1: Create component**

```bash
cat > frontend/src/components/meal-suggestion/MealSuggestionCard.jsx << 'EOF'
import React from 'react'
import { Card, Button, Tag, Space, Divider, List } from 'antd'
import { ClockCircleOutlined } from '@ant-design/icons'

const MealSuggestionCard = ({ meal, onConvert, isLoading }) => {
  if (!meal) return null
  const { meal_name, ingredients, prep_time, servings, macros } = meal

  return (
    <Card
      title={<div><h3 style={{ margin: 0 }}>{meal_name}</h3>
        <Space style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
          <span><ClockCircleOutlined /> {prep_time} min</span>
          <span>🍽️ {servings} servings</span>
        </Space></div>}
      size="small"
    >
      <div style={{ marginBottom: '12px' }}>
        <div style={{ fontSize: '12px', fontWeight: 500, marginBottom: '6px' }}>Macros:</div>
        <Space><Tag>P: {(macros.protein / servings).toFixed(1)}g</Tag>
          <Tag>C: {(macros.carbs / servings).toFixed(1)}g</Tag>
          <Tag>F: {(macros.fats / servings).toFixed(1)}g</Tag></Space>
      </div>
      <Divider style={{ margin: '12px 0' }} />
      <div style={{ fontSize: '12px', marginBottom: '12px' }}>
        <div style={{ fontWeight: 500, marginBottom: '6px' }}>Ingredients:</div>
        <List size="small" dataSource={ingredients} renderItem={(item) => (
          <List.Item style={{ padding: '4px 0' }}>{item.amount} {item.unit} {item.name}</List.Item>
        )} />
      </div>
      <Button type="primary" block onClick={onConvert} loading={isLoading} style={{ background: '#52c41a' }}>
        Convert to Recipe
      </Button>
    </Card>
  )
}

export default MealSuggestionCard
EOF
```

---

### Task 10: Frontend - Create ConvertToRecipeModal

**Files:**
- Create: `frontend/src/components/meal-suggestion/ConvertToRecipeModal.jsx`

- [ ] **Step 1: Create component**

```bash
cat > frontend/src/components/meal-suggestion/ConvertToRecipeModal.jsx << 'EOF'
import React from 'react'
import { Modal, Form, InputNumber, Divider, List } from 'antd'

const ConvertToRecipeModal = ({ visible, meal, onSave, onCancel, isLoading }) => {
  const [form] = Form.useForm()

  React.useEffect(() => {
    if (visible && meal) form.setFieldsValue({ servings: meal.servings })
  }, [visible, meal, form])

  const handleSave = async () => {
    try {
      const values = await form.validateFields()
      await onSave(values.servings)
    } catch (error) {
      console.error('Validation failed:', error)
    }
  }

  return (
    <Modal title="Save as Recipe" open={visible} onOk={handleSave} onCancel={onCancel} confirmLoading={isLoading} width={450}>
      {meal && (
        <>
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '14px', fontWeight: 500 }}>{meal.meal_name}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>⏱ {meal.prep_time} min | {meal.ingredients.length} ingredients</div>
          </div>
          <Divider />
          <Form form={form} layout="vertical">
            <Form.Item label="Servings" name="servings" rules={[{ required: true, type: 'number', min: 1 }]}>
              <InputNumber min={1} max={20} style={{ width: '100%' }} />
            </Form.Item>
          </Form>
          <div style={{ marginTop: '16px' }}>
            <div style={{ fontSize: '12px', fontWeight: 500, marginBottom: '8px' }}>Ingredients:</div>
            <List size="small" dataSource={meal.ingredients} renderItem={(item) => (
              <List.Item style={{ padding: '4px 0' }}><span style={{ fontSize: '12px' }}>{item.amount} {item.unit} {item.name}</span></List.Item>
            )} />
          </div>
        </>
      )}
    </Modal>
  )
}

export default ConvertToRecipeModal
EOF
```

---

### Task 11: Frontend - Create MealSuggestionDrawer

**Files:**
- Create: `frontend/src/components/meal-suggestion/MealSuggestionDrawer.jsx`

- [ ] **Step 1: Create component**

```bash
cat > frontend/src/components/meal-suggestion/MealSuggestionDrawer.jsx << 'EOF'
import React, { useEffect, useState } from 'react'
import { Drawer, Spin, Empty, message } from 'antd'
import { useLocation } from 'react-router-dom'
import useMealSuggestionStore from '../../store/mealSuggestionStore'
import { mealSuggestionsAPI } from '../../api/mealSuggestions'
import MealSuggestionCard from './MealSuggestionCard'
import ConvertToRecipeModal from './ConvertToRecipeModal'

const MealSuggestionDrawer = () => {
  const location = useLocation()
  const { isDrawerOpen, currentSuggestion, isLoadingSuggestion, setDrawerOpen, setCurrentSuggestion, setLoadingSuggestion, resetDrawer } = useMealSuggestionStore()
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false)
  const [isConvertLoading, setIsConvertLoading] = useState(false)

  useEffect(() => { resetDrawer() }, [location, resetDrawer])

  useEffect(() => {
    if (isDrawerOpen && !currentSuggestion) fetchSuggestion()
  }, [isDrawerOpen, currentSuggestion])

  const fetchSuggestion = async () => {
    setLoadingSuggestion(true)
    try {
      const suggestion = await mealSuggestionsAPI.fetchSuggestion()
      setCurrentSuggestion(suggestion)
    } catch (error) {
      message.error('Failed to fetch meal suggestion')
    } finally {
      setLoadingSuggestion(false)
    }
  }

  const handleConvertSave = async (servings) => {
    setIsConvertLoading(true)
    try {
      await mealSuggestionsAPI.convertToRecipe(currentSuggestion, servings)
      message.success('Recipe saved successfully!')
      setIsConvertModalOpen(false)
      setCurrentSuggestion(null)
      setDrawerOpen(false)
    } catch (error) {
      message.error('Failed to save recipe')
    } finally {
      setIsConvertLoading(false)
    }
  }

  return (
    <>
      <Drawer title="💡 Meal Suggestion" placement="right" onClose={() => setDrawerOpen(false)} open={isDrawerOpen} width={350} bodyStyle={{ padding: '12px' }}>
        <Spin spinning={isLoadingSuggestion} tip="Loading...">
          {currentSuggestion ? (
            <MealSuggestionCard meal={currentSuggestion} onConvert={() => setIsConvertModalOpen(true)} isLoading={isConvertLoading} />
          ) : !isLoadingSuggestion ? <Empty description="No suggestion" /> : null}
        </Spin>
      </Drawer>
      <ConvertToRecipeModal visible={isConvertModalOpen} meal={currentSuggestion} onSave={handleConvertSave} onCancel={() => setIsConvertModalOpen(false)} isLoading={isConvertLoading} />
    </>
  )
}

export default MealSuggestionDrawer
EOF
```

---

### Task 12: Frontend - Integrate into AppLayout

**Files:**
- Modify: `frontend/src/components/layout/AppLayout.jsx`

- [ ] **Step 1: Add imports and components**

In AppLayout.jsx, add imports:
```javascript
import FloatingButton from '../meal-suggestion/FloatingButton'
import MealSuggestionDrawer from '../meal-suggestion/MealSuggestionDrawer'
```

In JSX, add before closing Layout:
```jsx
<FloatingButton />
<MealSuggestionDrawer />
```

---

### Task 13: Frontend - Add Scaling to RecipeForm

**Files:**
- Modify: `frontend/src/components/recipes/RecipeForm.jsx`

- [ ] **Step 1: Add utility and handler**

At top of file, add:
```javascript
const scaleIngredients = (ingredients, originalServings, newServings) => {
  return ingredients.map((ingredient) => ({
    ...ingredient,
    amount: (ingredient.amount * newServings) / originalServings,
  }))
}
```

In component, add handler:
```javascript
const handleServingsChange = (newServings) => {
  const scaledIngredients = scaleIngredients(
    form.getFieldValue('ingredients'),
    form.getFieldValue('servings'),
    newServings
  )
  form.setFieldsValue({ servings: newServings, ingredients: scaledIngredients })
}
```

Ensure Form.Item for servings has:
```javascript
<Form.Item name="servings" label="Servings" rules={[{ required: true }]}>
  <InputNumber min={1} onChange={handleServingsChange} />
</Form.Item>
```

---

### Task 14: Testing

- [ ] **Step 1: Start backend**

```bash
cd backend
python -m uvicorn app.main:app --reload
```

- [ ] **Step 2: Start frontend**

```bash
cd frontend
npm run dev
```

- [ ] **Step 3: Test all flows**

1. Navigate any page - verify floating button visible (bottom-right)
2. Click button - drawer slides in, shows loading
3. Wait - suggestion displays with name, prep time, servings, macros, ingredients
4. Click "Convert to Recipe" - modal opens, servings pre-filled
5. Change servings in modal - verify input updates
6. Click "Save Recipe" - success message, drawer closes
7. Navigate away - drawer auto-closes
8. Go to recipes - see new recipe, change servings
9. Verify ingredients scale (e.g., 2 servings → 4 servings = double amounts)

---

### Task 15: Commit

```bash
git add -A
git commit -m "feat: add meal suggestion to recipe conversion

- Floating button for meal suggestions (bottom-right, all pages)
- Collapsible drawer with AI-generated suggestions
- Convert to recipe modal with servings confirmation
- Automatic ingredient scaling on servings change
- Backend: /suggestions/fetch and /suggestions/convert-to-recipe endpoints
- Frontend: FloatingButton, MealSuggestionDrawer, components, Zustand store

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

