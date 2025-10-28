// api/menu.ts - 菜单相关 API
import { request } from '../utils/request'

/**
 * 菜单分类
 */
export interface MenuCategory {
  id: number
  name: string
  sort_order: number
  icon?: string
}

/**
 * 商品规格组
 */
export interface SpecGroup {
  id: number
  name: string
  required: boolean
  options: SpecOption[]
}

/**
 * 商品规格选项
 */
export interface SpecOption {
  id: number
  name: string
  price_modifier: number
  is_available: boolean
}

/**
 * 商品信息
 */
export interface Product {
  id: number
  name: string
  description: string
  base_price: number
  image_url?: string
  category_id: number
  is_available: boolean
  spec_groups: SpecGroup[]
  sort_order: number
}

/**
 * 菜单数据
 */
export interface MenuData {
  categories: MenuCategory[]
  products: Product[]
}

/**
 * 获取菜单数据
 * GET /api/v1/menu
 */
export async function getMenu(): Promise<MenuData> {
  const response = await request<MenuData>({
    url: '/api/v1/menu',
    method: 'GET'
  })
  return response.data!
}
