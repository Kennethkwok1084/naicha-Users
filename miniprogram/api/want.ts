// api/want.ts - 想要/到货提醒 API
import { request } from '../utils/request'

/**
 * 添加"想要"记录 (售罄商品)
 * POST /api/v1/products/{id}/want
 */
export async function addWant(productId: number): Promise<{ message: string }> {
  const response = await request<{ message: string }>({
    url: `/api/v1/products/${productId}/want`,
    method: 'POST',
    needAuth: true // 需要登录
  })
  return response.data!
}

/**
 * 取消"想要"记录
 * DELETE /api/v1/products/{id}/want
 */
export async function removeWant(productId: number): Promise<{ message: string }> {
  const response = await request<{ message: string }>({
    url: `/api/v1/products/${productId}/want`,
    method: 'DELETE',
    needAuth: true
  })
  return response.data!
}
