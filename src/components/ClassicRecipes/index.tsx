import { useMemo, useState, type CSSProperties } from 'react'
import { Button, Segmented, Tag } from 'antd'
import { ClockCircleOutlined, PlusOutlined, ReadOutlined } from '@ant-design/icons'
import type { ClassicRecipe } from '../../api/classicRecipes'
import { CLASSIC_RECIPE_TOTAL, getDailyClassicRecipes } from '../../api/classicRecipes'
import './index.css'

interface Props { dateKey:string; onUse:(recipe:ClassicRecipe)=>void }
type Filter='全部'|'肉类'|'海鲜'|'蔬菜'|'汤羹'

export default function ClassicRecipes({dateKey,onUse}:Props){
  const [filter,setFilter]=useState<Filter>('全部')
  const daily=useMemo(()=>getDailyClassicRecipes(dateKey),[dateKey])
  const visible=useMemo(()=>filter==='全部'?daily:daily.filter(item=>item.category===filter),[daily,filter])
  const dateLabel=new Intl.DateTimeFormat('zh-CN',{month:'long',day:'numeric'}).format(new Date(`${dateKey}T00:00:00`))
  return <section className="classic-recipes">
    <div className="classic-heading"><div><span className="eyebrow"><ReadOutlined/> DAILY CLASSIC COLLECTION</span><h2>今日经典菜谱</h2><p>{dateLabel} 精选 12 道 · 四类各 3 道 · 从 {CLASSIC_RECIPE_TOTAL} 道菜谱库每日轮换</p></div><Segmented<Filter> value={filter} options={['全部','肉类','海鲜','蔬菜','汤羹']} onChange={setFilter}/></div>
    <div className="classic-grid">{visible.map(recipe=><article className="classic-card" key={recipe.id} style={{'--recipe-accent':recipe.accent} as CSSProperties}>
      <div className="classic-cover"><span className="cover-region">{recipe.region}</span><strong>{recipe.name.slice(0,1)}</strong><div className="cover-rings"><i/><i/><i/></div></div>
      <div className="classic-body"><div className="classic-meta"><Tag bordered={false}>{recipe.category} · {recipe.difficulty}</Tag><span><ClockCircleOutlined/> {recipe.estimated_minutes} 分钟</span></div><h3>{recipe.name}</h3><p>{recipe.description}</p><div className="ingredient-line">{recipe.ingredients.join(' · ')}</div>
        <details><summary>查看做法</summary><ol>{recipe.steps.map((step,index)=><li key={`${recipe.id}-${index}`}>{step}</li>)}</ol><small>{recipe.tips}</small></details>
        <Button type="primary" ghost icon={<PlusOutlined/>} onClick={()=>onUse(recipe)}>加入选中日期</Button>
      </div>
    </article>)}</div>
  </section>
}
