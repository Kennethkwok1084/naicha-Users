// api/shop.ts - 店铺相关 API
import { request } from '../utils/request'

/**
 * 店铺状态
 */
export interface ShopStatus {
  is_open: boolean
  business_hours: string
  announcement?: string
  features: {
    pickup_enabled: boolean
    delivery_enabled: boolean
    dine_in_enabled: boolean
  }
}

/**
 * 配送范围检查结果
 */
export interface DeliveryCheckResult {
  in_range: boolean
  distance?: number
  delivery_fee?: number
  estimated_time?: number
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
): Promise<DeliveryCheckResult> {
  const response = await request<DeliveryCheckResult>({
    url: '/api/v1/shop/delivery/check',
    method: 'POST',
    data: {
      latitude,
      longitude
    },
    needAuth: false
  })
  return response.data!
}
