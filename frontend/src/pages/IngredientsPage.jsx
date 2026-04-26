import { useEffect, useState } from 'react'
import {
  Typography, Button, Input, Table, Space, Popconfirm,
  message, Modal, Form, InputNumber, Select, Tag, Card, Spin, Empty,
} from 'antd'
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { listIngredients, createIngredient, updateIngredient, deleteIngredient } from '../api/recipes'
import useIsMobile from '../hooks/useIsMobile'
import { mobileModalProps } from '../utils/modalProps'

const { Title, Text } = Typography
const UNIT_OPTIONS = [
  { value: 'g',  label: 'g (grams)' },
  { value: 'ml', label: 'ml (millilitres)' },
]

const MacroPill = ({ label, value, color }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: 3,
    padding: '2px 8px', borderRadius: 20, fontSize: 11,
    fontWeight: 500, color: '#F1F5F9', background: color,
  }}>
    {label} <strong>{value}</strong>
  </span>
)

function IngredientCard({ record, onEdit, onDelete }) {
  const isSystem = !record.created_by
  return (
    <Card
      size="small"
      style={{ background: '#1E293B', border: '1px solid #334155', borderRadius: 10, marginBottom: 10 }}
      styles={{ body: { padding: '12px 14px' } }}
    >
      {/* Name + source badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <Text strong style={{ fontSize: 14, color: '#F1F5F9', flex: 1, marginRight: 8 }}>
          {record.name}
        </Text>
        <Tag color={isSystem ? 'green' : 'blue'} style={{ margin: 0, flexShrink: 0 }}>
          {isSystem ? 'System' : 'Custom'}
        </Tag>
      </div>

      {/* Macro pills */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
        <MacroPill label="kcal"    value={`${record.calories_per_100g}`} color="#7c3aed" />
        <MacroPill label="P:"      value={`${record.protein_per_100g}g`} color="#0369a1" />
        <MacroPill label="C:"      value={`${record.carbs_per_100g}g`}   color="#b45309" />
        <MacroPill label="F:"      value={`${record.fat_per_100g}g`}     color="#065f46" />
        <Tag style={{ margin: 0 }}>{record.unit}</Tag>
      </div>

      {/* Actions */}
      {!isSystem && (
        <div style={{ display: 'flex', gap: 8 }}>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => onEdit(record)}
            style={{ flex: 1 }}
          >
            Edit
          </Button>
          <Popconfirm title="Delete this ingredient?" onConfirm={() => onDelete(record.id)}>
            <Button size="small" danger icon={<DeleteOutlined />} style={{ flex: 1 }}>
              Delete
            </Button>
          </Popconfirm>
        </div>
      )}
    </Card>
  )
}

export default function IngredientsPage() {
  const [ingredients, setIngredients] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [form] = Form.useForm()
  const isMobile = useIsMobile()
  const modalProps = mobileModalProps(isMobile, 480)

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
    { title: 'Protein', dataIndex: 'protein_per_100g', key: 'protein_per_100g', render: (v) => `${v}g` },
    { title: 'Carbs',   dataIndex: 'carbs_per_100g',   key: 'carbs_per_100g',   render: (v) => `${v}g` },
    { title: 'Fat',     dataIndex: 'fat_per_100g',     key: 'fat_per_100g',     render: (v) => `${v}g` },
    { title: 'Unit',    dataIndex: 'unit',             key: 'unit',             render: (v) => <Tag>{v}</Tag> },
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
            <Button size="small" icon={<EditOutlined />} disabled={isSystem} onClick={() => openEdit(record)} />
            <Popconfirm title="Delete this ingredient?" onConfirm={() => handleDelete(record.id)} disabled={isSystem}>
              <Button size="small" danger icon={<DeleteOutlined />} disabled={isSystem} />
            </Popconfirm>
          </Space>
        )
      },
    },
  ]

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>Ingredients</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          {isMobile ? 'New' : 'New Ingredient'}
        </Button>
      </div>

      {/* Search */}
      <Input
        prefix={<SearchOutlined />}
        placeholder="Search ingredients..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ marginBottom: 16, maxWidth: isMobile ? '100%' : 360 }}
        allowClear
      />

      {/* Card list on mobile, table on desktop */}
      {isMobile ? (
        loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div>
        ) : ingredients.length === 0 ? (
          <Empty description="No ingredients found" />
        ) : (
          <div>
            {ingredients.map((record) => (
              <IngredientCard
                key={record.id}
                record={record}
                onEdit={openEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )
      ) : (
        <Table
          rowKey="id"
          dataSource={ingredients}
          columns={columns}
          loading={loading}
          pagination={{ pageSize: 20 }}
          size="middle"
        />
      )}

      {/* Create / Edit modal */}
      <Modal
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        title={editing ? 'Edit Ingredient' : 'New Ingredient'}
        footer={null}
        {...modalProps}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={onFinish} style={{ marginTop: 8 }}>
          <Form.Item name="name" label="Name" rules={[{ required: true, min: 1 }]}>
            <Input placeholder="e.g. Chicken Breast" />
          </Form.Item>
          <Form.Item name="unit" label="Unit" initialValue="g">
            <Select options={UNIT_OPTIONS} />
          </Form.Item>
          <Form.Item name="calories_per_100g" label="Calories per 100g" rules={[{ required: true }]}>
            <InputNumber min={0} addonAfter="kcal" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="protein_per_100g" label="Protein per 100g" rules={[{ required: true }]}>
            <InputNumber min={0} addonAfter="g" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="carbs_per_100g" label="Carbs per 100g" rules={[{ required: true }]}>
            <InputNumber min={0} addonAfter="g" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="fat_per_100g" label="Fat per 100g" rules={[{ required: true }]}>
            <InputNumber min={0} addonAfter="g" style={{ width: '100%' }} />
          </Form.Item>
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 8,
            flexDirection: isMobile ? 'column-reverse' : 'row',
          }}>
            <Button onClick={() => setModalOpen(false)} block={isMobile}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={saving} block={isMobile}>
              {editing ? 'Save Changes' : 'Create'}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  )
}
