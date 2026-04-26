import { useEffect, useState } from 'react'
import { Modal, Form, Input, InputNumber, Select, Button, Row, Col, Divider, AutoComplete, message, Typography } from 'antd'
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import { createRecipe, updateRecipe, listIngredients } from '../../api/recipes'
import useIsMobile from '../../hooks/useIsMobile'
import { mobileModalProps } from '../../utils/modalProps'

const scaleIngredients = (ingredients, originalServings, newServings) =>
  ingredients.map((ingredient) => ({
    ...ingredient,
    quantity_g: (ingredient.quantity_g * newServings) / originalServings,
  }))

export default function RecipeForm({ open, recipe, onClose, onSaved }) {
  const [form] = Form.useForm()
  const [ingredients, setIngredients] = useState([])
  const [ingredientOptions, setIngredientOptions] = useState([])
  const [saving, setSaving] = useState(false)
  const isMobile = useIsMobile()
  const modalProps = mobileModalProps(isMobile, 680)

  useEffect(() => {
    if (open) {
      loadIngredients()
      if (recipe) {
        form.setFieldsValue({
          name: recipe.name,
          description: recipe.description,
          instructions: recipe.instructions,
          servings: recipe.servings,
          prep_time_minutes: recipe.prep_time_minutes,
          cook_time_minutes: recipe.cook_time_minutes,
          tags: recipe.tags || [],
        })
        setIngredients(recipe.ingredients?.map(i => ({
          ingredient_id: i.ingredient_id,
          name: i.ingredient_name,
          quantity_g: i.quantity_g,
          display_amount: i.display_amount,
          display_unit: i.display_unit,
        })) || [])
      } else {
        form.resetFields()
        setIngredients([])
      }
    }
  }, [open, recipe])

  const loadIngredients = async (search = '') => {
    const { data } = await listIngredients({ search: search || undefined })
    setIngredientOptions(data.map(i => ({ value: i.id, label: i.name, data: i })))
  }

  const addIngredient = () => setIngredients(prev => [...prev, { ingredient_id: '', name: '', quantity_g: 100 }])
  const removeIngredient = (idx) => setIngredients(prev => prev.filter((_, i) => i !== idx))
  const updateIngredient = (idx, field, value) =>
    setIngredients(prev => prev.map((ing, i) => i === idx ? { ...ing, [field]: value } : ing))

  const handleServingsChange = (newServings) => {
    const currentServings = form.getFieldValue('servings')
    if (currentServings && ingredients.length > 0) {
      setIngredients(scaleIngredients(ingredients, currentServings, newServings))
    }
  }

  const onFinish = async (values) => {
    const invalid = ingredients.some(i => !i.ingredient_id || !i.quantity_g)
    if (invalid) { message.error('Select each ingredient from the dropdown and enter a gram amount'); return }

    setSaving(true)
    try {
      const payload = {
        ...values,
        ingredients: ingredients.map(i => ({
          ingredient_id: i.ingredient_id,
          quantity_g: i.quantity_g,
          display_amount: i.display_amount || null,
          display_unit: i.display_unit || null,
        })),
      }
      if (recipe) await updateRecipe(recipe.id, payload)
      else await createRecipe(payload)
      message.success(recipe ? 'Recipe updated' : 'Recipe created')
      onSaved()
    } catch {
      message.error('Failed to save recipe')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={recipe ? 'Edit Recipe' : 'New Recipe'}
      footer={null}
      {...modalProps}
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={onFinish}>

        {/* ── Basic info ── */}
        <Form.Item name="name" label="Recipe Name" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="description" label="Description">
          <Input.TextArea rows={2} />
        </Form.Item>

        {/* ── Servings / timing — 3 equal columns on every screen size ── */}
        <Row gutter={12}>
          <Col span={8}>
            <Form.Item name="servings" label="Servings" initialValue={1}>
              <InputNumber min={1} style={{ width: '100%' }} onChange={handleServingsChange} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="prep_time_minutes" label="Prep (min)">
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="cook_time_minutes" label="Cook (min)">
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="tags" label="Tags">
          <Select mode="tags" placeholder="e.g. breakfast, high-protein" />
        </Form.Item>

        {/* ── Ingredients ── */}
        <Divider>Ingredients</Divider>

        {ingredients.map((ing, idx) => (
          <div
            key={idx}
            style={{
              background: '#1a2535',
              border: '1px solid #334155',
              borderRadius: 8,
              padding: isMobile ? '10px 12px' : '8px 12px',
              marginBottom: 10,
            }}
          >
            {/* Row 1: ingredient name + delete */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
              <AutoComplete
                style={{ flex: 1 }}
                placeholder="Search ingredient…"
                value={ing.name}
                options={ingredientOptions}
                onSearch={(v) => {
                  setIngredients(prev => prev.map((item, i) =>
                    i === idx ? { ...item, name: v, ingredient_id: '' } : item
                  ))
                  loadIngredients(v)
                }}
                onSelect={(val, opt) => {
                  setIngredients(prev => prev.map((item, i) =>
                    i === idx ? { ...item, ingredient_id: val, name: opt.label } : item
                  ))
                }}
              />
              <Button
                icon={<DeleteOutlined />}
                danger
                type="text"
                onClick={() => removeIngredient(idx)}
                style={{ flexShrink: 0 }}
              />
            </div>

            {/* Row 2: grams | display amount | display unit */}
            <Row gutter={8}>
              <Col span={10}>
                <Typography.Text style={{ fontSize: 11, color: '#64748B', display: 'block', marginBottom: 3 }}>
                  Weight (g)
                </Typography.Text>
                <InputNumber
                  placeholder="grams"
                  min={0.1}
                  value={ing.quantity_g}
                  onChange={(v) => updateIngredient(idx, 'quantity_g', v)}
                  addonAfter="g"
                  style={{ width: '100%' }}
                />
              </Col>
              <Col span={7}>
                <Typography.Text style={{ fontSize: 11, color: '#64748B', display: 'block', marginBottom: 3 }}>
                  Amount
                </Typography.Text>
                <InputNumber
                  placeholder="e.g. 2"
                  min={0}
                  value={ing.display_amount}
                  onChange={(v) => updateIngredient(idx, 'display_amount', v)}
                  style={{ width: '100%' }}
                />
              </Col>
              <Col span={7}>
                <Typography.Text style={{ fontSize: 11, color: '#64748B', display: 'block', marginBottom: 3 }}>
                  Unit
                </Typography.Text>
                <Input
                  placeholder="tbsp"
                  value={ing.display_unit}
                  onChange={(e) => updateIngredient(idx, 'display_unit', e.target.value)}
                  style={{ width: '100%' }}
                />
              </Col>
            </Row>
          </div>
        ))}

        <Button
          icon={<PlusOutlined />}
          onClick={addIngredient}
          style={{ marginBottom: 16, width: isMobile ? '100%' : 'auto' }}
        >
          Add Ingredient
        </Button>

        {/* ── Instructions ── */}
        <Divider>Instructions</Divider>
        <Form.Item name="instructions">
          <Input.TextArea rows={4} placeholder="Step-by-step cooking instructions…" />
        </Form.Item>

        {/* ── Footer actions ── */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 8,
          flexDirection: isMobile ? 'column-reverse' : 'row',
        }}>
          <Button onClick={onClose} block={isMobile}>Cancel</Button>
          <Button type="primary" htmlType="submit" loading={saving} block={isMobile}>
            Save Recipe
          </Button>
        </div>

      </Form>
    </Modal>
  )
}
