import { useCallback, useEffect, useMemo, useState } from 'react'
import { Button, ConfigProvider, message, Segmented, Tag } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import zhCN from 'antd/locale/zh_CN'
import CalendarBoard from './components/CalendarBoard'
import DishList from './components/DishList'
import RecipeStudio from './components/RecipeStudio'
import DishForm from './components/DishForm'
import SharedMenuPanel from './components/SharedMenuPanel'
import { createDish,deleteDish,isCloudMode,listDishes,updateDish,uploadDishImage,type Dish,type DishInput,type GeneratedRecipe } from './api/backend'
import { createSharedMenu,getActiveMenuId,joinSharedMenu,listSharedMenus,setActiveMenuId,type SharedMenu } from './api/supabase'
import type { IMiniAppHostContext } from './types/qiankun'
import './App.css'

dayjs.locale('zh-cn')
type ViewMode='当天'|'本月全部'
export default function App(){
  const [selectedDate,setSelectedDate]=useState(dayjs()),[month,setMonth]=useState(dayjs()),[dishes,setDishes]=useState<Dish[]>([]),[loading,setLoading]=useState(true),[saving,setSaving]=useState(false),[formOpen,setFormOpen]=useState(false),[editing,setEditing]=useState<Dish>(),[generated,setGenerated]=useState<GeneratedRecipe>(),[view,setView]=useState<ViewMode>('当天')
  const [menus,setMenus]=useState<SharedMenu[]>([]),[activeMenuId,setActiveMenuState]=useState(getActiveMenuId()),[cloudLoading,setCloudLoading]=useState(isCloudMode)
  const [messageApi,contextHolder]=message.useMessage()
  const notify=useCallback((type:'success'|'error',text:string)=>{const ctx=(window as unknown as{__MINIAPP_CONTEXT__?:IMiniAppHostContext}).__MINIAPP_CONTEXT__;if(ctx?.notify)ctx.notify(type,text);else messageApi[type](text)},[messageApi])
  const loadMenus=useCallback(async()=>{if(!isCloudMode)return;setCloudLoading(true);try{const items=await listSharedMenus();setMenus(items);let current=getActiveMenuId();if(current&&!items.some(menu=>menu.id===current))current='';if(!current&&items[0])current=items[0].id;if(current){setActiveMenuId(current);setActiveMenuState(current)}}catch(error){notify('error',error instanceof Error?error.message:'共享菜单加载失败')}finally{setCloudLoading(false)}},[notify])
  useEffect(()=>{void loadMenus()},[loadMenus])
  const refresh=useCallback(async(target=month,quiet=false)=>{if(!quiet)setLoading(true);try{setDishes((await listDishes(target.format('YYYY-MM'))).dishes)}catch(error){if(!quiet)notify('error',error instanceof Error?error.message:'加载失败')}finally{if(!quiet)setLoading(false)}},[month,notify,activeMenuId])
  useEffect(()=>{void refresh(month)},[month,activeMenuId,refresh])
  useEffect(()=>{if(!isCloudMode||!activeMenuId)return;const timer=window.setInterval(()=>void refresh(month,true),5000);return()=>window.clearInterval(timer)},[activeMenuId,month,refresh])
  const shownDishes=useMemo(()=>view==='当天'?dishes.filter(d=>d.meal_date===selectedDate.format('YYYY-MM-DD')):dishes,[view,dishes,selectedDate])
  const openCreate=(recipe?:GeneratedRecipe)=>{if(isCloudMode&&!activeMenuId){notify('error','请先创建或加入一个共享菜单');return}setEditing(undefined);setGenerated(recipe);setFormOpen(true)}
  const openEdit=(dish:Dish)=>{setEditing(dish);setGenerated(undefined);setFormOpen(true)}
  const save=async(input:DishInput)=>{setSaving(true);try{editing?await updateDish(editing.id,input):await createDish(input);notify('success',editing?'菜品已更新':'已加入饮食日历');setFormOpen(false);await refresh()}catch(error){notify('error',error instanceof Error?error.message:'保存失败')}finally{setSaving(false)}}
  const selectMenu=(id:string)=>{setActiveMenuId(id);setActiveMenuState(id);setDishes([])}
  const createMenu=async(title:string)=>{try{const menu=await createSharedMenu(title);await loadMenus();selectMenu(menu.id);notify('success',`已创建“${menu.title}”`)}catch(error){notify('error',error instanceof Error?error.message:'创建失败');throw error}}
  const joinMenu=async(code:string)=>{try{const id=await joinSharedMenu(code);await loadMenus();selectMenu(id);notify('success','已加入共享菜单')}catch(error){notify('error',error instanceof Error?error.message:'加入失败');throw error}}
  return <ConfigProvider locale={zhCN} theme={{token:{colorPrimary:'#315c49',borderRadius:12,fontFamily:"-apple-system,BlinkMacSystemFont,'PingFang SC','Helvetica Neue',Arial,sans-serif"},components:{Modal:{contentBg:'#fffdf8',headerBg:'#fffdf8'}}}} getPopupContainer={node=>node?.parentElement||document.querySelector('.miniapp-root')||document.body}><div className="miniapp-root">{contextHolder}
    <header className="app-hero"><div><div className="brand-line"><span className="brand-kicker">MENU NOTE · 私人饮食手账</span><Tag color={isCloudMode?'green':'blue'}>{isCloudMode?'云端共享':'账号保存'}</Tag></div><h1>今天，想吃点什么？</h1><p>{isCloudMode?'把邀请码发给朋友，一起安排每一顿。':'让灵感成为菜谱，也让每一顿好味道都留下记录。'}</p></div><Button type="primary" size="large" icon={<PlusOutlined/>} onClick={()=>openCreate()}>记一道菜</Button></header>
    <main className="app-layout"><aside>{isCloudMode&&<SharedMenuPanel menus={menus} activeId={activeMenuId} loading={cloudLoading} onSelect={selectMenu} onCreate={createMenu} onJoin={joinMenu}/>}<CalendarBoard value={selectedDate} dishes={dishes} onSelect={value=>{setSelectedDate(value);if(!value.isSame(month,'month'))setMonth(value);setView('当天')}} onPanelChange={setMonth}/><RecipeStudio onUse={openCreate} onError={text=>notify('error',text)}/></aside>
      <section className="content-column"><div className="content-toolbar"><div><span>{selectedDate.format('M月D日 dddd')}</span><strong>{shownDishes.length?`安排了 ${shownDishes.length} 道菜`:isCloudMode&&!activeMenuId?'先创建或加入共享菜单':'给这一天添点香气吧'}</strong></div><Segmented<ViewMode> value={view} options={['当天','本月全部']} onChange={setView}/></div><DishList dishes={shownDishes} loading={loading} dateLabel={view==='当天'?selectedDate.format('M月D日的餐桌'):month.format('M月的全部记录')} onEdit={openEdit} onDelete={async dish=>{try{await deleteDish(dish.id);notify('success','已删除');await refresh()}catch(error){notify('error',error instanceof Error?error.message:'删除失败')}}} onRate={async(dish,rating)=>{try{await updateDish(dish.id,{rating});setDishes(items=>items.map(item=>item.id===dish.id?{...item,rating}:item))}catch(error){notify('error',error instanceof Error?error.message:'评分失败')}}} onUpload={async(dish,file)=>{try{await uploadDishImage(dish.id,file);notify('success','成品图已保存');await refresh()}catch(error){notify('error',error instanceof Error?error.message:'上传失败')}}}/></section>
    </main><DishForm open={formOpen} date={selectedDate} dish={editing} recipe={generated} saving={saving} onCancel={()=>setFormOpen(false)} onSave={save}/></div></ConfigProvider>
}
