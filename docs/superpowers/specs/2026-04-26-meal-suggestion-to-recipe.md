# Meal Suggestion to Recipe Conversion Feature

**Date:** April 26, 2026  
**Status:** Design Approved

## Problem Statement

Users currently receive meal suggestions, but converting them into saved recipes requires manual data entry. This feature enables one-click conversion from suggestion → recipe, with automatic ingredient scaling based on servings.

## Feature Overview

Add a **floating collapsible drawer** (bottom-right, all screens) that allows users to:
1. View AI-generated meal suggestions anywhere in the app
2. Convert suggestions to recipes with one click
3. Confirm/adjust servings before saving
4. Edit recipe servings later with automatic ingredient scaling

## User Workflows

### Workflow 1: Discover & Convert
1. User clicks floating meal suggestion button (bottom-right)
2. Drawer expands showing a meal suggestion card with: name, prep time, servings, macros, ingredients
3. User clicks "Convert to Recipe" button on the card
4. Modal dialog appears with title, ingredients preview, and servings field (pre-filled with suggestion default)
5. User confirms or adjusts servings, clicks "Save Recipe"
6. Recipe saved to database; drawer closes; success message shown

### Workflow 2: Navigate Away
1. User has drawer open
2. User navigates to different page/section
3. Drawer automatically closes
4. Floating button remains visible for next use

### Workflow 3: Edit Recipe Servings
1. User views saved recipe (in recipes section)
2. User adjusts "servings" input
3. All ingredient amounts scale automatically
4. Changes reflect macros/nutrition instantly

## Component Architecture

### Frontend Components

#### 1. **MealSuggestionDrawer** (New)
- **Purpose:** Container for meal suggestion UI
- **Props:** `isOpen: boolean`, `onClose: () => void`, `suggestion: MealSuggestion | null`
- **Behavior:**
  - Slides in from right on desktop, bottom on mobile
  - Closes when `onClose()` called
  - Closes automatically on route change (via `useEffect` + `useLocation()`)
  - Shows loading state while suggestion is fetching

#### 2. **MealSuggestionCard** (New)
- **Purpose:** Display individual meal suggestion
- **Props:** `meal: MealSuggestion`, `onConvert: () => void`
- **Renders:** Meal name, prep time, servings, macros, ingredients list, "Convert" button

#### 3. **ConvertToRecipeModal** (New)
- **Purpose:** Servings confirmation dialog
- **Props:** `visible: boolean`, `meal: MealSuggestion`, `onSave: (servings: number) => void`, `onCancel: () => void`
- **Behavior:**
  - Shows meal name, ingredients preview
  - Servings input pre-filled with meal's suggested servings
  - "Save Recipe" button → calls `onSave(servings)`, closes modal

#### 4. **FloatingButton** (New)
- **Purpose:** Fixed position button (bottom-right)
- **Props:** `onClick: () => void`
- **Renders:** Icon button, always visible

#### 5. **RecipeServingsEditor** (Modification to existing recipe view)
- **Existing component:** Modified to support servings editing
- **Change:** Add input field for servings; calculate scaled ingredient amounts
- **Formula:** `newAmount = originalAmount * (newServings / originalServings)`

### Data Flow

```
User clicks FloatingButton
  ↓
MealSuggestionDrawer opens
  ↓
Fetch AI suggestion → MealSuggestionCard displays
  ↓
User clicks "Convert" button
  ↓
ConvertToRecipeModal shows (servings pre-filled)
  ↓
User confirms servings
  ↓
POST /api/recipes (with meal data + servings)
  ↓
Save to database
  ↓
Recipe created; modal closes; drawer closes; show success toast
```

## Backend Integration

### API Endpoints

#### 1. **POST /api/suggestions** (Existing, used for fetching)
- Returns current meal suggestion with fields: `name`, `ingredients`, `prep_time`, `servings`, `macros`

#### 2. **POST /api/recipes** (Existing or new)
- **Input:** 
  ```json
  {
    "name": "Grilled Chicken Salad",
    "servings": 2,
    "ingredients": [...],
    "prep_time": 15,
    "macros": {...}
  }
  ```
- **Output:** `{ "id": "recipe_123", "created_at": "..." }`
- **Behavior:** Creates new recipe record in database

### Database Schema (Recipe Table)

Fields needed:
- `id`: UUID
- `name`: string
- `servings`: integer (store the baseline servings)
- `ingredients`: JSON array (store with base amounts; amounts calculated on client)
- `prep_time`: integer (minutes)
- `macros`: JSON (protein, carbs, fats)
- `user_id`: foreign key
- `created_at`: timestamp
- `updated_at`: timestamp

## State Management

### Global State (Zustand)
```javascript
mealSuggestionStore = {
  isDrawerOpen: boolean,
  currentSuggestion: MealSuggestion | null,
  isLoadingSuggestion: boolean,
  setDrawerOpen: (boolean) => void,
  setCurrentSuggestion: (MealSuggestion) => void,
  fetchSuggestion: async () => void,
}
```

### Local State (Component-level)
- ConvertToRecipeModal: `servings` (controlled input)
- RecipeServingsEditor: `currentServings` (for scaled display)

## Responsive Behavior

### Desktop (> 768px)
- Drawer slides in from right, width ~350px
- Fixed position on right edge
- Doesn't push content, overlays at same z-level as main content

### Mobile (≤ 768px)
- Drawer slides up from bottom, height ~70vh
- Full width
- Same close-on-navigation behavior

## Error Handling

1. **Suggestion fetch fails:** Show error message, allow retry
2. **Recipe save fails:** Show toast error, keep modal open
3. **Invalid servings:** Client-side validation (positive integer, min 1)

## Testing Considerations

- Unit tests for ingredient scaling calculation
- Component tests for drawer open/close behavior
- Integration tests for suggestion → recipe flow
- Route change closes drawer (e2e test)
- Mobile drawer responsive behavior

## Acceptance Criteria ✓

- [x] Every meal suggestion card has "Convert to Recipe" button
- [x] User prompted for servings (pre-filled with suggestion default)
- [x] Servings editable in saved recipe with automatic ingredient scaling
- [x] Floating button accessible anywhere in app
- [x] Drawer closes on navigation

## Future Enhancements

- Favorites/save suggestions without converting to recipe
- Recipe history/undo
- Batch convert multiple suggestions
- Share recipes with other users
