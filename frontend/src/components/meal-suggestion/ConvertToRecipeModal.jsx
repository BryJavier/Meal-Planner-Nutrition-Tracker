import React, { useState } from 'react'
import { Modal, Form, InputNumber, Divider, List } from 'antd'

const ConvertToRecipeModal = ({
  visible,
  meal,
  onSave,
  onCancel,
  isLoading,
}) => {
  const [form] = Form.useForm()
  const [servings, setServings] = useState(meal?.servings || 1)

  React.useEffect(() => {
    if (visible && meal) {
      form.setFieldsValue({ servings: meal.servings })
      setServings(meal.servings)
    }
  }, [visible, meal, form])

  const handleSave = async () => {
    try {
      const values = await form.validateFields()
      await onSave(values.servings)
      form.resetFields()
    } catch (error) {
      console.error('Validation failed:', error)
    }
  }

  return (
    <Modal
      title="Save as Recipe"
      open={visible}
      onOk={handleSave}
      onCancel={onCancel}
      confirmLoading={isLoading}
      okText="Save Recipe"
      cancelText="Cancel"
      width={450}
    >
      {meal && (
        <>
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '14px', fontWeight: 500 }}>
              {meal.meal_name}
            </div>
            <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
              ⏱ {meal.prep_time} min | {meal.ingredients.length} ingredients
            </div>
          </div>

          <Divider />

          <Form form={form} layout="vertical">
            <Form.Item
              label="Servings"
              name="servings"
              rules={[
                {
                  required: true,
                  message: 'Please enter number of servings',
                },
                {
                  type: 'number',
                  min: 1,
                  message: 'Servings must be at least 1',
                },
              ]}
            >
              <InputNumber
                min={1}
                max={20}
                value={servings}
                onChange={(value) => setServings(value)}
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Form>

          <div style={{ marginTop: '16px' }}>
            <div style={{ fontSize: '12px', fontWeight: 500, marginBottom: '8px' }}>
              Ingredients ({meal.ingredients.length}):
            </div>
            <List
              size="small"
              dataSource={meal.ingredients}
              renderItem={(item) => (
                <List.Item style={{ padding: '4px 0' }}>
                  <span style={{ fontSize: '12px' }}>
                    {item.amount} {item.unit} {item.name}
                  </span>
                </List.Item>
              )}
            />
          </div>
        </>
      )}
    </Modal>
  )
}

export default ConvertToRecipeModal
