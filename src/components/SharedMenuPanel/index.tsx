import { useState } from 'react'
import { Button, Input, Modal, Select, Space, Tag, Typography } from 'antd'
import { CopyOutlined, LinkOutlined, PlusOutlined, TeamOutlined } from '@ant-design/icons'
import type { SharedMenu } from '../../api/supabase'
import './index.css'

interface Props { menus:SharedMenu[]; activeId:string; loading:boolean; onSelect:(id:string)=>void; onCreate:(title:string)=>Promise<void>; onJoin:(code:string)=>Promise<void> }
export default function SharedMenuPanel({menus,activeId,loading,onSelect,onCreate,onJoin}:Props){
  const [mode,setMode]=useState<'create'|'join'>()
  const [value,setValue]=useState('')
  const [saving,setSaving]=useState(false)
  const active=menus.find(menu=>menu.id===activeId)
  const submit=async()=>{setSaving(true);try{if(mode==='create')await onCreate(value);else await onJoin(value);setMode(undefined);setValue('')}finally{setSaving(false)}}
  const copy=async()=>{if(active)await navigator.clipboard.writeText(active.invite_code)}
  return <section className="shared-menu-panel">
    <div><span className="eyebrow"><TeamOutlined/> SHARED MENU</span><Typography.Title level={3}>和朋友一起点菜</Typography.Title></div>
    {menus.length?<><Select loading={loading} value={activeId||undefined} placeholder="选择共享菜单" onChange={onSelect} options={menus.map(menu=>({value:menu.id,label:menu.title}))}/>{active&&<div className="invite-row"><span>邀请码</span><Tag>{active.invite_code}</Tag><Button type="text" icon={<CopyOutlined/>} onClick={copy}>复制</Button></div>}</>:<p className="empty-copy">创建一个菜单，或输入朋友发来的邀请码。</p>}
    <Space wrap><Button icon={<PlusOutlined/>} onClick={()=>setMode('create')}>创建菜单</Button><Button icon={<LinkOutlined/>} onClick={()=>setMode('join')}>输入邀请码</Button></Space>
    <Modal open={Boolean(mode)} getContainer={false} forceRender title={mode==='create'?'创建共享菜单':'加入朋友的菜单'} okText={mode==='create'?'创建':'加入'} cancelText="取消" confirmLoading={saving} onCancel={()=>{setMode(undefined);setValue('')}} onOk={()=>void submit()} okButtonProps={{disabled:!value.trim()}}>
      <Input autoFocus value={value} maxLength={mode==='join'?8:30} onChange={event=>setValue(event.target.value)} placeholder={mode==='create'?'比如：周末聚餐':'输入 8 位邀请码'} onPressEnter={()=>value.trim()&&void submit()}/>
    </Modal>
  </section>
}
