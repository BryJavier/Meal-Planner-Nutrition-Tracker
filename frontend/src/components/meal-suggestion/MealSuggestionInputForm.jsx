import React from 'react'
import { Select, Input, Button, Space } from 'antd'
import { SendOutlined } from '@ant-design/icons'

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack']

const MealSuggestionInputForm = ({
  mealType,
  onMealTypeChange,
  preferences,
  onPreferencesChange,
  onSubmit,
  loading = false,
}) => {
  const handleSubmit = () => {
    onSubmit(mealType, preferences)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Space.Compact style={{ width: '100%' }}>
        <Select
          value={mealType}
          onChange={onMealTypeChange}
          options={MEAL_TYPES.map(type => ({
            value: type,
            label: type.charAt(0).toUpperCase() + type.slice(1),
          }))}
          style={{ width: 120 }}
        />
        <Input
          placeholder="Optional: 'I have chicken and spinach...'"
          value={preferences}
          onChange={e => onPreferencesChange(e.target.value)}
          allowClear
        />
      </Space.Compact>
      <Button
        type="primary"
        icon={<SendOutlined />}
        onClick={handleSubmit}
        loading={loading}
        block
      >
        {loading ? 'Generating...' : 'Get Meal Ideas'}
      </Button>
    </div>
  )
}

export default MealSuggestionInputForm
