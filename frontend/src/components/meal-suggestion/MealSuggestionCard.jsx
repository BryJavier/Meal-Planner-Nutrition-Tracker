import React from 'react'
import { Card, Button, Tag, Space, Divider, List } from 'antd'
import { ClockCircleOutlined } from '@ant-design/icons'

const MealSuggestionCard = ({ meal, onConvert, isLoading }) => {
  if (!meal) return null

  const { meal_name, ingredients, prep_time, servings, macros } = meal

  return (
    <Card
      title={
        <div>
          <h3 style={{ margin: 0 }}>{meal_name}</h3>
          <Space style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
            <span>
              <ClockCircleOutlined /> {prep_time} min
            </span>
            <span>🍽️ {servings} servings</span>
          </Space>
        </div>
      }
      size="small"
    >
      <div style={{ marginBottom: '12px' }}>
        <div style={{ fontSize: '12px', fontWeight: 500, marginBottom: '6px' }}>
          Macros (per serving):
        </div>
        <Space>
          <Tag>P: {(macros.protein / servings).toFixed(1)}g</Tag>
          <Tag>C: {(macros.carbs / servings).toFixed(1)}g</Tag>
          <Tag>F: {(macros.fats / servings).toFixed(1)}g</Tag>
        </Space>
      </div>

      <Divider style={{ margin: '12px 0' }} />

      <div style={{ fontSize: '12px', marginBottom: '12px' }}>
        <div style={{ fontWeight: 500, marginBottom: '6px' }}>Ingredients:</div>
        <List
          size="small"
          dataSource={ingredients}
          renderItem={(item) => (
            <List.Item style={{ padding: '4px 0' }}>
              {item.amount} {item.unit} {item.name}
            </List.Item>
          )}
        />
      </div>

      <Button
        type="primary"
        block
        onClick={onConvert}
        loading={isLoading}
        style={{ background: '#52c41a', borderColor: '#52c41a' }}
      >
        Convert to Recipe
      </Button>
    </Card>
  )
}

export default MealSuggestionCard
