// api/menu.ts - 菜单相关 API (基于 OpenAPI 规范)
import { request } from '../utils/request'

/**
 * 菜单分类
 */
export interface MenuCategory {
  category_id: number
  name: string
  sort_order: number
  products: MenuProduct[]
}

/**
 * 商品规格组
 */
export interface MenuSpecGroup {
  group_id: number
  name: string
  sort_order: number
  options: MenuSpecOption[]
}

/**
 * 商品规格选项
 */
export interface MenuSpecOption {
  option_id: number
  name: string
  price_modifier: number
  inventory_status: 'available' | 'sold_out'
  sort_order: number
}

/**
 * 商品信息
 */
export interface MenuProduct {
  product_id: number
  name: string
  description: string | null
  image_url: string | null
  base_price: number
  status: string
  inventory_status: 'available' | 'sold_out'
  spec_groups: MenuSpecGroup[]
}

/**
 * 菜单响应数据
 */
export interface MenuResponse {
  categories: MenuCategory[]
  uncategorized_products: MenuProduct[]
  multi_category_enabled: boolean
}

/**
 * 获取菜单数据
 * GET /api/v1/menu
 */
export async function getMenu(): Promise<MenuResponse> {
  const response = await request<MenuResponse>({
    url: '/api/v1/menu',
    method: 'GET',
    needAuth: false // 菜单数据不需要认证
  })
  return response.data!
}
