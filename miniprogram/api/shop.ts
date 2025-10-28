// api/shop.ts - 店铺相关 API (基于 OpenAPI 规范)
import { request } from '../utils/request'

/**
 * 店铺位置
 */
export interface ShopLocation {
  lat: number
  lng: number
}

/**
 * 店铺功能开关
 */
export interface ShopFeatures {
  multi_category_enabled: boolean
  reservation_enabled: boolean
  want_enabled: boolean
}

/**
 * 店铺营业时间
 */
export interface ShopOpenHours {
  [day: string]: string // 例如: "monday": "09:00-22:00"
}

/**
 * 店铺状态
 */
export interface ShopStatus {
  is_open: boolean
  delivery_radius_m: number
  timezone: string
  open_hours?: ShopOpenHours
  location?: ShopLocation
  features: ShopFeatures
}

/**
 * 配送范围检查请求
 */
export interface DeliveryCheckRequest {
  lat: number
  lng: number
}

/**
 * 配送范围检查结果
 */
export interface DeliveryCheckResponse {
  deliverable: boolean
  distance_m: number
}

/**
 * 获取店铺状态
 * GET /api/v1/shop/status
 */
export async function getShopStatus(): Promise<ShopStatus> {
  const response = await request<ShopStatus>({
    url: '/api/v1/shop/status',
    method: 'GET',
    needAuth: false // 店铺状态不需要认证
  })
  return response.data!
}

/**
 * 检查配送范围
 * POST /api/v1/shop/delivery/check
 */
export async function checkDeliveryRange(
  latitude: number,
  longitude: number
): Promise<DeliveryCheckResponse> {
  const response = await request<DeliveryCheckResponse>({
    url: '/api/v1/shop/delivery/check',
    method: 'POST',
    data: {
      lat: latitude,
      lng: longitude
    },
    needAuth: false
  })
  return response.data!
}
