import { useEffect, useState } from 'react'
import {
  Typography, Button, Input, Table, Space, Popconfirm, message, Modal, Form, InputNumber, Select, Tag
} from 'antd'
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { listIngredients, createIngredient, updateIngredient, deleteIngredient } from '../api/recipes'

const { Title } = Typography

const UNIT_OPTIONS = [
  { value: 'g', label: 'g (grams)' },
  { value: 'ml', label: 'ml (millilitres)' },
]

export default function IngredientsPage() {
  const [ingredients, setIngredients] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [form] = Form.useForm()

  const fetchIngredients = async () => {
    setLoading(true)
    try {
      const { data } = await listIngredients({ search: search || undefined })
      setIngredients(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchIngredients() }, [search])

  const openCreate = () => {
    setEditing(null)
    form.resetFields()
    form.setFieldsValue({ unit: 'g' })
    setModalOpen(true)
  }

  const openEdit = (record) => {
    setEditing(record)
    form.setFieldsValue({
      name: record.name,
      calories_per_100g: record.calories_per_100g,
      protein_per_100g: record.protein_per_100g,
      carbs_per_100g: record.carbs_per_100g,
      fat_per_100g: record.fat_per_100g,
      unit: record.unit,
    })
    setModalOpen(true)
  }

  const handleDelete = async (id) => {
    try {
      await deleteIngredient(id)
      message.success('Ingredient deleted')
      fetchIngredients()
    } catch {
      message.error('Failed to delete ingredient')
    }
  }

  const onFinish = async (values) => {
    setSaving(true)
    try {
      if (editing) {
        await updateIngredient(editing.id, values)
        message.success('Ingredient updated')
      } else {
        await createIngredient(values)
        message.success('Ingredient created')
      }
      setModalOpen(false)
      fetchIngredients()
    } catch {
      message.error('Failed to save ingredient')
    } finally {
      setSaving(false)
    }
  }

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: 'Calories / 100',
      dataIndex: 'calories_per_100g',
      key: 'calories_per_100g',
      render: (v) => `${v} kcal`,
      sorter: (a, b) => a.calories_per_100g - b.calories_per_100g,
    },
    {
      title: 'Protein',
      dataIndex: 'protein_per_100g',
      key: 'protein_per_100g',
      render: (v) => `${v}g`,
    },
    {
      title: 'Carbs',
      dataIndex: 'carbs_per_100g',
      key: 'carbs_per_100g',
      render: (v) => `${v}g`,
    },
    {
      title: 'Fat',
      dataIndex: 'fat_per_100g',
      key: 'fat_per_100g',
      render: (v) => `${v}g`,
    },
    {
      title: 'Unit',
      dataIndex: 'unit',
      key: 'unit',
      render: (v) => <Tag>{v}</Tag>,
    },
    {
      title: 'Source',
      dataIndex: 'created_by',
      key: 'created_by',
      render: (v) => v ? <Tag color="blue">Custom</Tag> : <Tag color="green">System</Tag>,
    },
    {
      title: '',
      key: 'actions',
      width: 100,
      render: (_, record) => {
        const isSystem = !record.created_by
        return (
          <Space>
            <Button
              size="small"
              icon={<EditOutlined />}
              disabled={isSystem}
              onClick={() => openEdit(record)}
            />
            <Popconfirm
              title="Delete this ingredient?"
              onConfirm={() => handleDelete(record.id)}
              disabled={isSystem}
            >
              <Button
                size="small"
                danger
                icon={<DeleteOutlined />}
                disabled={isSystem}
              />
            </Popconfirm>
          </Space>
        )
      },
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>Ingredients</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          New Ingredient
        </Button>
      </div>

      <Input
        prefix={<SearchOutlined />}
        placeholder="Search ingredients..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ marginBottom: 16, maxWidth: 360 }}
        allowClear
      />

      <Table
        rowKey="id"
        dataSource={ingredients}
        columns={columns}
        loading={loading}
        pagination={{ pageSize: 20 }}
        size="middle"
      />

      <Modal
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        title={editing ? 'Edit Ingredient' : 'New Ingredient'}
        footer={null}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={onFinish} style={{ marginTop: 8 }}>
          <Form.Item name="name" label="Name" rules={[{ required: true, min: 1 }]}>
            <Input placeholder="e.g. Chicken Breast" />
          </Form.Item>
          <Form.Item name="unit" label="Unit" initialValue="g">
            <Select options={UNIT_OPTIONS} />
          </Form.Item>
          <Form.Item name="calories_per_100g" label="Calories per 100" rules={[{ required: true }]}>
            <InputNumber min={0} addonAfter="kcal" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="protein_per_100g" label="Protein per 100" rules={[{ required: true }]}>
            <InputNumber min={0} addonAfter="g" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="carbs_per_100g" label="Carbs per 100" rules={[{ required: true }]}>
            <InputNumber min={0} addonAfter="g" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="fat_per_100g" label="Fat per 100" rules={[{ required: true }]}>
            <InputNumber min={0} addonAfter="g" style={{ width: '100%' }} />
          </Form.Item>
          <div style={{ textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit" loading={saving}>
                {editing ? 'Save Changes' : 'Create'}
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>
    </div>
  )
}
