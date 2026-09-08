import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { Button, Empty, Popconfirm, Rate, Spin, Tag, Typography, Upload } from 'antd'
import { DeleteOutlined, EditOutlined, PictureOutlined } from '@ant-design/icons'
import type { Dish } from '../../api/backend'
import { loadDishImage } from '../../api/backend'
import './index.css'

interface Props {
  dishes: Dish[]
  loading: boolean
  dateLabel: string
  onEdit: (dish: Dish) => void
  onDelete: (dish: Dish) => void
  onRate: (dish: Dish, rating: number) => void
  onUpload: (dish: Dish, file: File) => void
}

const categoryAccents: Record<string, string[]> = {
  肉类: ['#a95742', '#c06b4d', '#8e4937'],
  海鲜: ['#4f7f73', '#6d9787', '#527a89'],
  蔬菜: ['#6e8655', '#8b935d', '#4f765a'],
  汤羹: ['#9b7758', '#aa8766', '#857d63'],
}

function dishAccent(dish: Dish) {
  const palette = categoryAccents[dish.category] ?? ['#8a735f', '#6f8275', '#a06e58']
  const hash = Array.from(dish.name).reduce((total, char) => total + (char.codePointAt(0) ?? 0), 0)
  return palette[hash % palette.length]
}

function DishImage({ dish }: { dish: Dish }) {
  const [src, setSrc] = useState<string>()
  const accent = useMemo(() => dishAccent(dish), [dish.category, dish.name])
  useEffect(() => {
    let active = true
    let url: string | undefined
    setSrc(undefined)
    if (dish.has_image) loadDishImage(dish.id).then((value) => { url = value; if (active) setSrc(value) }).catch(() => undefined)
    return () => { active = false; if (url?.startsWith('blob:')) URL.revokeObjectURL(url) }
  }, [dish.id, dish.has_image, dish.updated_at])
  if (src) return <img className="dish-image" src={src} alt={dish.name} />
  return <div className="dish-placeholder" style={{ '--dish-accent': accent } as CSSProperties} aria-label={`${dish.name}默认封面`}>
    <span className="dish-placeholder-category">{dish.category}</span>
    <strong>{dish.name.trim().slice(0, 1) || '味'}</strong>
    <div className="dish-placeholder-rings" aria-hidden="true"><i/><i/><i/></div>
  </div>
}

export default function DishList({ dishes, loading, dateLabel, onEdit, onDelete, onRate, onUpload }: Props) {
  return <section className="dish-section">
    <div className="section-heading"><div><span className="eyebrow">TODAY'S TABLE</span><Typography.Title level={3}>{dateLabel}</Typography.Title></div></div>
    <Spin spinning={loading}>
      {!dishes.length ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="这一天还没安排菜，去 AI 灵感台看看吧" /> :
        <div className="dish-grid">{dishes.map((dish) => <article className="dish-card" key={dish.id}>
          <DishImage dish={dish} />
          <div className="dish-content">
            <div className="dish-title-row"><div><Tag bordered={false}>{dish.category}</Tag><h3>{dish.name}</h3></div><div className="dish-actions">
              <Button type="text" icon={<EditOutlined />} onClick={() => onEdit(dish)} />
              <Popconfirm title="删除这道菜？" description="菜谱、评价和图片都会一起删除" onConfirm={() => onDelete(dish)}><Button danger type="text" icon={<DeleteOutlined />} /></Popconfirm>
            </div></div>
            <Rate value={dish.rating} onChange={(value) => onRate(dish, value)} />
            {dish.review && <p className="dish-review">“{dish.review}”</p>}
            {dish.ingredients.length > 0 && <p className="dish-meta">{dish.ingredients.slice(0, 4).join(' · ')}</p>}
            {dish.recipe && <details><summary>查看菜谱</summary><p>{dish.recipe}</p></details>}
            <Upload accept="image/png,image/jpeg,image/webp,image/gif" showUploadList={false} beforeUpload={(file) => { onUpload(dish, file); return false }}><Button icon={<PictureOutlined />}>{dish.has_image ? '更换图片' : '上传成品图'}</Button></Upload>
          </div>
        </article>)}</div>}
    </Spin>
  </section>
}
