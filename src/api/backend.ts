import { getActiveMenuId, supabase } from './supabase'

declare const __PUBLIC_MODE__: boolean
const PUBLIC_MODE = typeof __PUBLIC_MODE__ !== 'undefined' && __PUBLIC_MODE__
export const BACKEND_BASE = PUBLIC_MODE ? '' : 'https://cowork.xiaohongshu.com/s/smart-menu-planner-backend'
export const isCloudMode = PUBLIC_MODE

export interface Dish { id:number; name:string; category:string; meal_date:string; recipe:string; ingredients:string[]; rating:number; review:string; has_image:boolean; image_path?:string|null; created_at:string; updated_at:string }
export interface DishInput { name:string; category:string; meal_date:string; recipe:string; ingredients:string[]; rating:number; review:string }
export interface GeneratedRecipe { name:string; category:string; ingredients:string[]; steps:string[]; tips:string; estimated_minutes:number }

type CloudDish = Omit<Dish,'has_image'> & { menu_id:string; image_path:string|null }
function mapCloudDish(row:CloudDish):Dish { return {...row,has_image:Boolean(row.image_path)} }
function requireMenuId(){ const id=getActiveMenuId(); if(!id) throw new Error('请先创建或加入一个共享菜单'); return id }
async function request<T>(path:string,init?:RequestInit):Promise<T>{
  const response=await fetch(`${BACKEND_BASE}${path}`,{credentials:'include',...init,headers:init?.body instanceof FormData?init.headers:{'Content-Type':'application/json',...init?.headers}})
  if(!response.ok){const data=await response.json().catch(()=>({})) as {detail?:string};throw new Error(data.detail||`请求失败（${response.status}）`)}
  if(response.status===204)return undefined as T
  return response.json() as Promise<T>
}
function monthEnd(month:string){const [y,m]=month.split('-').map(Number);return new Date(Date.UTC(y,m,1)).toISOString().slice(0,10)}

export async function listDishes(month:string){
  if(isCloudMode){
    const menuId=getActiveMenuId(); if(!menuId)return {dishes:[] as Dish[]}
    const {data,error}=await supabase.from('dishes').select('*').eq('menu_id',menuId).gte('meal_date',`${month}-01`).lt('meal_date',monthEnd(month)).order('meal_date',{ascending:false})
    if(error)throw new Error(error.message)
    return {dishes:((data||[]) as CloudDish[]).map(mapCloudDish)}
  }
  return request<{dishes:Dish[]}>(`/api/dishes?month=${encodeURIComponent(month)}`)
}
export async function createDish(input:DishInput){
  if(isCloudMode){const {data,error}=await supabase.from('dishes').insert({...input,menu_id:requireMenuId()}).select('*').single();if(error)throw new Error(error.message);return mapCloudDish(data as CloudDish)}
  return request<Dish>('/api/dishes',{method:'POST',body:JSON.stringify(input)})
}
export async function updateDish(id:number,input:Partial<DishInput>){
  if(isCloudMode){const {data,error}=await supabase.from('dishes').update({...input,updated_at:new Date().toISOString()}).eq('id',id).eq('menu_id',requireMenuId()).select('*').single();if(error)throw new Error(error.message);return mapCloudDish(data as CloudDish)}
  return request<Dish>(`/api/dishes/${id}`,{method:'PATCH',body:JSON.stringify(input)})
}
export async function deleteDish(id:number){
  if(isCloudMode){const menuId=requireMenuId();const {data}=await supabase.from('dishes').select('image_path').eq('id',id).eq('menu_id',menuId).maybeSingle();if(data?.image_path)await supabase.storage.from('dish-images').remove([data.image_path]);const {error}=await supabase.from('dishes').delete().eq('id',id).eq('menu_id',menuId);if(error)throw new Error(error.message);return}
  return request<void>(`/api/dishes/${id}`,{method:'DELETE'})
}
async function compressImage(file:File):Promise<Blob>{
  if(file.size>8*1024*1024)throw new Error('图片不能超过 8MB')
  const source=URL.createObjectURL(file)
  try{const image=await new Promise<HTMLImageElement>((resolve,reject)=>{const item=new Image();item.onload=()=>resolve(item);item.onerror=()=>reject(new Error('图片解析失败'));item.src=source});const maxSide=1400;const scale=Math.min(1,maxSide/Math.max(image.width,image.height));const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(image.width*scale));canvas.height=Math.max(1,Math.round(image.height*scale));const context=canvas.getContext('2d');if(!context)throw new Error('浏览器不支持图片处理');context.drawImage(image,0,0,canvas.width,canvas.height);return await new Promise<Blob>((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('图片压缩失败')),'image/jpeg',.82))}finally{URL.revokeObjectURL(source)}
}
export async function uploadDishImage(id:number,file:File){
  if(isCloudMode){const menuId=requireMenuId();const blob=await compressImage(file);const old=await supabase.from('dishes').select('image_path').eq('id',id).eq('menu_id',menuId).single();const path=`${menuId}/${id}/${Date.now()}.jpg`;const uploaded=await supabase.storage.from('dish-images').upload(path,blob,{contentType:'image/jpeg'});if(uploaded.error)throw new Error(uploaded.error.message);const {data,error}=await supabase.from('dishes').update({image_path:path,updated_at:new Date().toISOString()}).eq('id',id).eq('menu_id',menuId).select('*').single();if(error){await supabase.storage.from('dish-images').remove([path]);throw new Error(error.message)}if(old.data?.image_path)void supabase.storage.from('dish-images').remove([old.data.image_path]);return mapCloudDish(data as CloudDish)}
  const body=new FormData();body.append('image',file);return request<Dish>(`/api/dishes/${id}/image`,{method:'POST',body})
}
export async function loadDishImage(id:number){
  if(isCloudMode){const {data,error}=await supabase.from('dishes').select('image_path').eq('id',id).eq('menu_id',requireMenuId()).single();if(error||!data?.image_path)throw new Error('图片不存在');const signed=await supabase.storage.from('dish-images').createSignedUrl(data.image_path,3600);if(signed.error)throw new Error(signed.error.message);return signed.data.signedUrl}
  const response=await fetch(`${BACKEND_BASE}/api/dishes/${id}/image`,{credentials:'include'});if(!response.ok)throw new Error('图片加载失败');return URL.createObjectURL(await response.blob())
}

const recipePool:Record<string,Array<{name:string;core:string[];buy:string[];steps:string[];minutes:number}>>={
海鲜:[{name:'蒜香虾仁芦笋',core:['虾仁','芦笋'],buy:['蒜'],minutes:20,steps:['虾仁加少许盐腌制10分钟','芦笋切段焯水','蒜末爆香后下虾仁炒至变色','加入芦笋快速翻炒并调味']},{name:'番茄豆腐鱼片汤',core:['鱼片','番茄'],buy:['嫩豆腐'],minutes:30,steps:['鱼片用盐和淀粉抓匀','番茄炒出汁后加热水','加入豆腐煮5分钟','滑入鱼片煮熟并调味']}],
肉类:[{name:'青椒嫩炒肉片',core:['猪肉','青椒'],buy:['生姜'],minutes:25,steps:['肉片加生抽和淀粉腌制','青椒切块','肉片滑炒变色后盛出','炒香青椒再回锅肉片调味']},{name:'菌菇鸡腿煲',core:['鸡腿','蘑菇'],buy:['葱'],minutes:40,steps:['鸡腿切块煎至金黄','加入蘑菇翻炒','加热水和生抽焖煮25分钟','大火收汁后撒葱花']}],
蔬菜:[{name:'番茄炒蛋',core:['番茄','鸡蛋'],buy:[],minutes:15,steps:['鸡蛋打散炒至凝固后盛出','番茄切块炒出汁','倒回鸡蛋翻炒','加盐调味即可']},{name:'蒜蓉时蔬',core:['西兰花'],buy:['蒜'],minutes:15,steps:['西兰花切小朵焯水','蒜切末','热油炒香蒜末','加入西兰花和盐快速翻炒']}],
汤羹:[{name:'玉米山药排骨汤',core:['排骨','玉米'],buy:['山药'],minutes:70,steps:['排骨冷水下锅焯净','玉米与山药切块','所有食材加热水炖60分钟','出锅前加盐调味']},{name:'菌菇豆腐汤',core:['蘑菇','豆腐'],buy:['香葱'],minutes:25,steps:['菌菇洗净切片','少油炒香菌菇','加热水和豆腐煮10分钟','加盐胡椒并撒香葱']}]}
function normalize(v:string){return v.toLowerCase().replace(/[\s肉鲜嫩块片]/g,'')}
function localRecipe(input:{category:string;ingredients:string[];preferences:string}):GeneratedRecipe{const candidates=recipePool[input.category]||Object.values(recipePool).flat();const scored=candidates.map(item=>({item,score:item.core.filter(core=>input.ingredients.some(v=>normalize(v).includes(normalize(core))||normalize(core).includes(normalize(v)))).length})).sort((a,b)=>b.score-a.score);const choice=scored[0].item;const available=choice.core.filter(core=>input.ingredients.some(v=>normalize(v).includes(normalize(core))||normalize(core).includes(normalize(v))));const missing=[...choice.core.filter(v=>!available.includes(v)),...choice.buy];return{name:choice.name,category:input.category,ingredients:[...available,...missing.map(v=>`${v}（建议购买）`)],steps:choice.steps,tips:`从现有食材中选用${available.length?available.join('、'):'合适食材'}，${missing.length?`建议补买${missing.join('、')}`:'无需额外购买'}。${input.preferences?`已参考：${input.preferences}`:''}`,estimated_minutes:choice.minutes}}
export async function generateRecipe(input:{category:string;ingredients:string[];preferences:string}){if(isCloudMode)return localRecipe(input);return request<GeneratedRecipe>('/api/ai/recipe',{method:'POST',body:JSON.stringify(input)})}
