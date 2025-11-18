/// <reference path="./wx/index.d.ts" />

// 首页数据类型定义
interface Banner {
  id: number;
  image_url: string;
  link?: string;
  title?: string;
}

// 简化的轮播图类型
interface SimpleBanner {
  id: number;
  title: string;
  link?: string;
}

// 促销卡片类型
interface PromoCard {
  id: number;
  title: string;
  subtitle: string;
  link?: string;
}

interface FunctionItem {
  id: string;
  name: string;
  icon: string;
  path: string;
  type: 'dine_in' | 'take_away' | 'delivery';
}

interface LoyaltyCard {
  user_id: number;
  total_cups: number;
  current_cups: number;
  reward_threshold: number;
  is_redeemable: boolean;
}

interface ShopInfo {
  name: string;
  address: string;
  phone: string;
  business_hours: string;
  status: 'open' | 'closed';
}

interface HomePageData {
  banners: SimpleBanner[];
  functions: FunctionItem[];
  promos: PromoCard[];
  loyaltyCard: LoyaltyCard | null;
  shopInfo: ShopInfo;
}
