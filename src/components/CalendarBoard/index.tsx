import { Badge, Calendar, Typography } from 'antd'
import type { Dayjs } from 'dayjs'
import type { Dish } from '../../api/backend'
import './index.css'

interface Props {
  value: Dayjs
  dishes: Dish[]
  onSelect: (day: Dayjs) => void
  onPanelChange: (day: Dayjs) => void
}

const colors: Record<string, string> = {
  海鲜: '#2A9D8F', 肉类: '#E76F51', 蔬菜: '#6A994E', 汤羹: '#E9A23B',
}

export default function CalendarBoard({ value, dishes, onSelect, onPanelChange }: Props) {
  return (
    <section className="calendar-board">
      <div className="section-heading">
        <div><span className="eyebrow">MEAL CALENDAR</span><Typography.Title level={3}>本月吃什么</Typography.Title></div>
        <span className="count-pill">{dishes.length} 道记录</span>
      </div>
      <Calendar
        fullscreen={false}
        value={value}
        onSelect={onSelect}
        onPanelChange={onPanelChange}
        cellRender={(current, info) => {
          if (info.type !== 'date') return info.originNode
          const dayItems = dishes.filter((dish) => dish.meal_date === current.format('YYYY-MM-DD'))
          if (!dayItems.length) return null
          return <div className="calendar-dots">{dayItems.slice(0, 3).map((dish) => <Badge key={dish.id} color={colors[dish.category] || '#8A7C6D'} />)}</div>
        }}
      />
      <div className="calendar-legend">
        {Object.entries(colors).map(([name, color]) => <span key={name}><i style={{ background: color }} />{name}</span>)}
      </div>
    </section>
  )
}
