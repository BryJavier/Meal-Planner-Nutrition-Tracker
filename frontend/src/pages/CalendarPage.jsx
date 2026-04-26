import { useState, useEffect, useCallback } from 'react'
import { Button, Select, Typography, Spin, message, Modal } from 'antd'
import useIsMobile from '../hooks/useIsMobile'
import { mobileModalProps } from '../utils/modalProps'
import { LeftOutlined, RightOutlined } from '@ant-design/icons'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import dayjs from 'dayjs'
import { listPlans, createPlan, addEntry, updateEntry } from '../api/mealPlans'
import { listRecipes } from '../api/recipes'
import DayColumn from '../components/calendar/DayColumn'

function getMondayStr(d) {
  const day = dayjs(d)
  return day.subtract(day.day() === 0 ? 6 : day.day() - 1, 'day').format('YYYY-MM-DD')
}

export default function CalendarPage() {
  const [weekStart, setWeekStart] = useState(getMondayStr(new Date()))
  const [plan, setPlan] = useState(null)
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [recipes, setRecipes] = useState([])
  const [addModal, setAddModal] = useState(null) // { dayIndex, slot }
  const [selectedRecipe, setSelectedRecipe] = useState(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))
  const isMobile = useIsMobile()
  const addMealModalProps = mobileModalProps(isMobile, 400)

  const loadWeek = useCallback(async () => {
    setLoading(true)
    try {
      const { data: plans } = await listPlans({ week_start: weekStart })
      let current = plans[0]
      if (!current) {
        const { data } = await createPlan({ week_start_date: weekStart })
        current = data
      }
      setPlan(current)
      setEntries(current.entries || [])
    } finally {
      setLoading(false)
    }
  }, [weekStart])

  useEffect(() => { loadWeek() }, [loadWeek])
  useEffect(() => { listRecipes().then(({ data }) => setRecipes(data)) }, [])

  const navigate = (dir) => {
    setWeekStart(getMondayStr(dayjs(weekStart).add(dir * 7, 'day').toDate()))
  }

  const handleDragEnd = async ({ active, over }) => {
    if (!over || active.id === over.id) return
    const [overDay, overSlot] = over.id.split('-')
    const entry = entries.find(e => e.id === active.id)
    if (!entry) return

    setEntries(prev => prev.map(e =>
      e.id === active.id ? { ...e, day_of_week: Number(overDay), meal_slot: overSlot } : e
    ))

    try {
      await updateEntry(plan.id, active.id, { day_of_week: Number(overDay), meal_slot: overSlot })
    } catch {
      message.error('Failed to move entry')
      loadWeek()
    }
  }

  const openAddModal = (dayIndex, slot) => {
    setAddModal({ dayIndex, slot })
    setSelectedRecipe(null)
  }

  const handleAddEntry = async () => {
    if (!selectedRecipe) return
    try {
      const { data } = await addEntry(plan.id, {
        recipe_id: selectedRecipe,
        day_of_week: addModal.dayIndex,
        meal_slot: addModal.slot,
      })
      setEntries(prev => [...prev, data])
      setAddModal(null)
    } catch {
      message.error('Failed to add entry')
    }
  }

  const handleRemove = (entryId) => setEntries(prev => prev.filter(e => e.id !== entryId))

  const weekDays = Array.from({ length: 7 }, (_, i) =>
    dayjs(weekStart).add(i, 'day').format('YYYY-MM-DD')
  )

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Button icon={<LeftOutlined />} onClick={() => navigate(-1)} />
          <Typography.Title level={4} style={{ margin: 0 }}>
            Week of {dayjs(weekStart).format('MMM D, YYYY')}
          </Typography.Title>
          <Button icon={<RightOutlined />} onClick={() => navigate(1)} />
        </div>
      </div>

      {loading ? <Spin /> : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8 }}>
            {weekDays.map((dayDate, i) => (
              <div key={i} style={{ flex: '1 1 0', minWidth: 150 }}>
                <DayColumn
                  planId={plan?.id}
                  dayIndex={i}
                  dayDate={dayDate}
                  entries={entries.filter(e => e.day_of_week === i)}
                  onRemove={handleRemove}
                />
                <Button
                  size="small"
                  block
                  style={{ marginTop: 4 }}
                  onClick={() => openAddModal(i, 'breakfast')}
                >
                  + Add meal
                </Button>
              </div>
            ))}
          </div>
        </DndContext>
      )}

      <Modal
        open={!!addModal}
        title={`Add meal — ${addModal ? ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][addModal.dayIndex] : ''}`}
        onOk={handleAddEntry}
        onCancel={() => setAddModal(null)}
        okText="Add"
        {...addMealModalProps}
      >
        <Select
          showSearch
          placeholder="Choose recipe"
          style={{ width: '100%' }}
          optionFilterProp="label"
          options={recipes.map(r => ({ value: r.id, label: r.name }))}
          onChange={setSelectedRecipe}
          value={selectedRecipe}
        />
        {addModal && (
          <Select
            style={{ width: '100%', marginTop: 8 }}
            value={addModal.slot}
            onChange={(v) => setAddModal(prev => ({ ...prev, slot: v }))}
            options={['breakfast', 'lunch', 'dinner', 'snack'].map(s => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))}
          />
        )}
      </Modal>

    </div>
  )
}
