import { useState } from 'react'
import { Button, Input, Select, Space, Tag, Typography } from 'antd'
import { BulbOutlined, ClockCircleOutlined, PlusOutlined } from '@ant-design/icons'
import type { GeneratedRecipe } from '../../api/backend'
import { generateRecipe } from '../../api/backend'
import './index.css'

interface Props { onUse: (recipe: GeneratedRecipe) => void; onError: (message: string) => void }
const categories = ['海鲜', '肉类', '蔬菜', '汤羹']

export default function RecipeStudio({ onUse, onError }: Props) {
  const [category, setCategory] = useState('蔬菜')
  const [ingredients, setIngredients] = useState('')
  const [preferences, setPreferences] = useState('少油、家常、30分钟内')
  const [result, setResult] = useState<GeneratedRecipe>()
  const [loading, setLoading] = useState(false)
  const run = async () => {
    setLoading(true)
    try { setResult(await generateRecipe({ category, ingredients: ingredients.split(/[，,、]/).map(v => v.trim()).filter(Boolean), preferences })) }
    catch (error) { onError(error instanceof Error ? error.message : '生成失败') }
    finally { setLoading(false) }
  }
  return <section className="recipe-studio">
    <div className="studio-orb"><BulbOutlined /></div>
    <span className="eyebrow">AI RECIPE STUDIO</span>
    <Typography.Title level={2}>给今天一点新灵感</Typography.Title>
    <p className="studio-intro">现有食材只是候选，AI 会挑选合理组合，也可以推荐你补买更合适的新食材。</p>
    <label>想吃的类别</label>
    <Select value={category} onChange={setCategory} options={categories.map(v => ({ value: v, label: v }))} style={{ width: '100%' }} />
    <label>现有食材</label><Input value={ingredients} onChange={e => setIngredients(e.target.value)} placeholder="比如：番茄、鸡蛋、虾仁" />
    <label>口味和要求</label><Input.TextArea value={preferences} onChange={e => setPreferences(e.target.value)} autoSize={{ minRows: 2, maxRows: 4 }} />
    <Button type="primary" size="large" block loading={loading} onClick={run} icon={<BulbOutlined />}>生成菜名与菜谱</Button>
    {result && <div className="recipe-result">
      <div className="recipe-result-head"><div><Tag>{result.category}</Tag><h3>{result.name}</h3></div><span><ClockCircleOutlined /> {result.estimated_minutes} 分钟</span></div>
      <Space size={[6,6]} wrap>{result.ingredients.map(item => <Tag key={item}>{item}</Tag>)}</Space>
      <ol>{result.steps.map(step => <li key={step}>{step}</li>)}</ol>
      {result.tips && <p className="recipe-tip">小贴士：{result.tips}</p>}
      <Button icon={<PlusOutlined />} onClick={() => onUse(result)}>加入选中日期</Button>
    </div>}
  </section>
}
