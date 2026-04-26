import React, { useState } from 'react'
import { Card, Button, Divider, List, Typography, Collapse } from 'antd'
import { ClockCircleOutlined, CheckCircleOutlined, OrderedListOutlined } from '@ant-design/icons'

const MacroPill = ({ label, value, color }) => (
  <span style={{
    display: 'inline-flex',
    alignItems: 'center',
    gap: 3,
    padding: '2px 8px',
    borderRadius: 20,
    background: color,
    fontSize: 11,
    fontWeight: 500,
    color: '#F1F5F9',
  }}>
    {label}: <strong>{typeof value === 'number' ? value.toFixed(1) : value}</strong>
  </span>
)

const MealSuggestionCard = ({ meal, onConvert, isConverting, saved }) => {
  if (!meal) return null

  const { meal_name, description, ingredients, instructions, prep_time, cook_time, servings, macros } = meal

  // macros are totals for all servings — show per-serving
  const s = servings || 1
  const cal   = macros?.calories != null ? macros.calories / s : null
  const prot  = macros?.protein  != null ? macros.protein  / s : null
  const carbs = macros?.carbs    != null ? macros.carbs    / s : null
  const fat   = macros?.fats     != null ? macros.fats     / s : null

  const totalTime = (prep_time || 0) + (cook_time || 0)

  // Parse numbered steps from the instructions string
  const steps = instructions
    ? instructions
        .split('\n')
        .map((line) => line.replace(/^\d+\.\s*/, '').trim())
        .filter(Boolean)
    : []

  return (
    <Card
      size="small"
      style={{
        background: saved ? 'rgba(5,150,105,0.08)' : '#273549',
        border: saved ? '1px solid #34D399' : '1px solid #334155',
        borderRadius: 10,
      }}
      styles={{ body: { padding: '10px 12px' } }}
    >
      {/* Name + timing */}
      <div style={{ marginBottom: 6 }}>
        <Typography.Text strong style={{ fontSize: 13, color: '#F1F5F9', display: 'block' }}>
          {meal_name}
        </Typography.Text>
        <div style={{ display: 'flex', gap: 12, fontSize: 11, color: '#64748B', marginTop: 2 }}>
          {prep_time > 0 && <span><ClockCircleOutlined /> {prep_time}m prep</span>}
          {cook_time > 0 && <span>🔥 {cook_time}m cook</span>}
          <span>🍽️ {servings} serving{servings !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {description && (
        <Typography.Text style={{ fontSize: 12, color: '#94A3B8', display: 'block', marginBottom: 8 }}>
          {description}
        </Typography.Text>
      )}

      {/* Macro pills — per serving */}
      {(cal != null || prot != null) && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
          {cal   != null && <MacroPill label="kcal" value={cal}   color="#7c3aed" />}
          {prot  != null && <MacroPill label="P"    value={prot}  color="#0369a1" />}
          {carbs != null && <MacroPill label="C"    value={carbs} color="#b45309" />}
          {fat   != null && <MacroPill label="F"    value={fat}   color="#065f46" />}
          <Typography.Text style={{ fontSize: 10, color: '#475569', alignSelf: 'center' }}>
            per serving
          </Typography.Text>
        </div>
      )}

      <Divider style={{ margin: '8px 0', borderColor: '#334155' }} />

      {/* Ingredients */}
      <div style={{ fontSize: 12, fontWeight: 500, color: '#94A3B8', marginBottom: 4 }}>
        Ingredients ({ingredients?.length ?? 0})
      </div>
      <List
        size="small"
        dataSource={ingredients ?? []}
        renderItem={(item) => (
          <List.Item style={{ padding: '2px 0', borderBlockEnd: 'none' }}>
            <Typography.Text style={{ fontSize: 11, color: '#CBD5E1' }}>
              {item.display_amount ?? item.quantity_g}
              {item.display_unit ? ` ${item.display_unit}` : 'g'} {item.name}
            </Typography.Text>
          </List.Item>
        )}
      />

      {/* Instructions — collapsible numbered steps */}
      {steps.length > 0 && (
        <>
          <Divider style={{ margin: '8px 0', borderColor: '#334155' }} />
          <Collapse
            ghost
            size="small"
            items={[{
              key: 'steps',
              label: (
                <span style={{ fontSize: 12, fontWeight: 500, color: '#94A3B8' }}>
                  <OrderedListOutlined style={{ marginRight: 6 }} />
                  Instructions ({steps.length} steps)
                </span>
              ),
              children: (
                <ol style={{ paddingLeft: 18, margin: 0 }}>
                  {steps.map((step, i) => (
                    <li key={i} style={{ fontSize: 12, color: '#CBD5E1', marginBottom: 6, lineHeight: 1.5 }}>
                      {step}
                    </li>
                  ))}
                </ol>
              ),
            }]}
            style={{ background: 'transparent', border: 'none', padding: 0 }}
          />
        </>
      )}

      <Divider style={{ margin: '8px 0', borderColor: '#334155' }} />

      {saved ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#34D399', fontSize: 13 }}>
          <CheckCircleOutlined />
          <span>Saved to library</span>
        </div>
      ) : (
        <Button
          type="primary"
          block
          size="small"
          loading={isConverting}
          onClick={onConvert}
          style={{ background: '#059669', borderColor: '#059669' }}
        >
          Save as Recipe
        </Button>
      )}
    </Card>
  )
}

export default MealSuggestionCard
