import { useEffect, useState } from 'react'
import { Modal, Form, Input, InputNumber, Select, Button, Space, Divider, AutoComplete, message } from 'antd'
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import { createRecipe, updateRecipe, listIngredients } from '../../api/recipes'

const scaleIngredients = (ingredients, originalServings, newServings) => {
  return ingredients.map((ingredient) => ({
    ...ingredient,
    quantity_g: (ingredient.quantity_g * newServings) / originalServings,
  }))
}

export default function RecipeForm({ open, recipe, onClose, onSaved }) {
  const [form] = Form.useForm()
  const [ingredients, setIngredients] = useState([])
  const [ingredientOptions, setIngredientOptions] = useState([])
  const [saving, setSaving] = useState(false)

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
      width={680}
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item name="name" label="Recipe Name" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="description" label="Description">
          <Input.TextArea rows={2} />
        </Form.Item>
        <Space>
          <Form.Item name="servings" label="Servings" initialValue={1}>
            <InputNumber min={1} style={{ width: 100 }} onChange={handleServingsChange} />
          </Form.Item>
          <Form.Item name="prep_time_minutes" label="Prep (min)">
            <InputNumber min={0} style={{ width: 100 }} />
          </Form.Item>
          <Form.Item name="cook_time_minutes" label="Cook (min)">
            <InputNumber min={0} style={{ width: 100 }} />
          </Form.Item>
        </Space>
        <Form.Item name="tags" label="Tags">
          <Select mode="tags" placeholder="e.g. breakfast, high-protein" />
        </Form.Item>

        <Divider>Ingredients</Divider>
        {ingredients.map((ing, idx) => (
          <Space key={idx} align="start" style={{ marginBottom: 8, width: '100%' }}>
            <AutoComplete
              style={{ width: 220 }}
              placeholder="Search ingredient..."
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
            <InputNumber
              placeholder="grams"
              min={0.1}
              value={ing.quantity_g}
              onChange={(v) => updateIngredient(idx, 'quantity_g', v)}
              addonAfter="g"
              style={{ width: 130 }}
            />
            <InputNumber
              placeholder="amount"
              min={0}
              value={ing.display_amount}
              onChange={(v) => updateIngredient(idx, 'display_amount', v)}
              style={{ width: 90 }}
            />
            <Input
              placeholder="unit"
              value={ing.display_unit}
              onChange={(e) => updateIngredient(idx, 'display_unit', e.target.value)}
              style={{ width: 80 }}
            />
            <Button icon={<DeleteOutlined />} danger type="text" onClick={() => removeIngredient(idx)} />
          </Space>
        ))}
        <Button icon={<PlusOutlined />} onClick={addIngredient} style={{ marginBottom: 16 }}>Add Ingredient</Button>

        <Divider>Instructions</Divider>
        <Form.Item name="instructions">
          <Input.TextArea rows={4} placeholder="Step-by-step cooking instructions..." />
        </Form.Item>

        <div style={{ textAlign: 'right' }}>
          <Space>
            <Button onClick={onClose}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={saving}>Save Recipe</Button>
          </Space>
        </div>
      </Form>
    </Modal>
  )
}
