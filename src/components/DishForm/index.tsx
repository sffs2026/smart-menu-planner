import { useEffect } from 'react'
import { DatePicker, Form, Input, Modal, Rate } from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import type { Dish, DishInput, GeneratedRecipe } from '../../api/backend'

interface FormValue { name: string; category: string; meal_date: Dayjs; ingredients: string; recipe: string; rating: number; review: string }
interface Props { open: boolean; date: Dayjs; dish?: Dish; recipe?: GeneratedRecipe; saving: boolean; onCancel: () => void; onSave: (value: DishInput) => void }

export default function DishForm({ open, date, dish, recipe, saving, onCancel, onSave }: Props) {
  const [form] = Form.useForm<FormValue>()
  useEffect(() => {
    if (!open) return
    form.setFieldsValue({
      name: dish?.name || recipe?.name || '', category: dish?.category || recipe?.category || '蔬菜',
      meal_date: dayjs(dish?.meal_date || date), ingredients: (dish?.ingredients || recipe?.ingredients || []).join('、'),
      recipe: dish?.recipe || recipe?.steps.map((v, i) => `${i + 1}. ${v}`).join('\n') || '', rating: dish?.rating || 0, review: dish?.review || '',
    })
  }, [open, dish, recipe, date, form])
  return <Modal title={dish ? '编辑这道菜' : '加入饮食日历'} open={open} getContainer={false} forceRender onCancel={onCancel} okText="保存" cancelText="取消" confirmLoading={saving} onOk={() => form.validateFields().then(v => onSave({ ...v, meal_date: v.meal_date.format('YYYY-MM-DD'), ingredients: v.ingredients.split(/[，,、]/).map(s => s.trim()).filter(Boolean) }))}>
    <Form form={form} layout="vertical" requiredMark={false}>
      <Form.Item label="菜名" name="name" rules={[{ required: true, message: '请输入菜名' }]}><Input placeholder="比如：番茄炖牛腩" /></Form.Item>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}><Form.Item label="类别" name="category" rules={[{ required:true }]}><Input placeholder="海鲜 / 肉 / 蔬菜 / 汤" /></Form.Item><Form.Item label="安排日期" name="meal_date"><DatePicker style={{ width:'100%' }} /></Form.Item></div>
      <Form.Item label="食材" name="ingredients"><Input placeholder="用逗号分隔" /></Form.Item>
      <Form.Item label="菜谱" name="recipe"><Input.TextArea autoSize={{ minRows:4, maxRows:8 }} /></Form.Item>
      <Form.Item label="评分" name="rating"><Rate /></Form.Item>
      <Form.Item label="评价" name="review"><Input.TextArea autoSize={{ minRows:2, maxRows:4 }} placeholder="口味怎么样？下次想改哪里？" /></Form.Item>
    </Form>
  </Modal>
}
