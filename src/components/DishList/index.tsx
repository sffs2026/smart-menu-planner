import { useEffect, useState } from 'react'
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

function DishImage({ dish }: { dish: Dish }) {
  const [src, setSrc] = useState<string>()
  useEffect(() => {
    let active = true
    let url: string | undefined
    if (dish.has_image) loadDishImage(dish.id).then((value) => { url = value; if (active) setSrc(value) }).catch(() => undefined)
    return () => { active = false; if (url) URL.revokeObjectURL(url) }
  }, [dish.id, dish.has_image, dish.updated_at])
  return src ? <img className="dish-image" src={src} alt={dish.name} /> : <div className="dish-placeholder"><span>🍽</span><small>添加成品图</small></div>
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
