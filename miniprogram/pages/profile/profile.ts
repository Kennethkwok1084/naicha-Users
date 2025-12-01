// pages/profile/profile.ts
import { isLoggedIn, getCurrentUserId, clearAuth, saveAuth, getUserProfile, saveUserProfile } from '../../utils/auth';
import { login, getStampStatus, getMyCoupons, bindPhoneNumber, getUserInfo } from '../../api/user';

Component({
  data: {
    isLoggedIn: false,
    userId: null as number | null,
    loggingIn: false,
    userInfo: {
      nickname: '',
      avatar_url: '',
      phone: '',
    },
    stampProgress: {
      current: 0,
      target: 10,
      total: 0,
    },
    couponCount: 0,
  },

  pageLifetimes: {
    show() {
      // 更新 TabBar active 状态
      if (typeof this.getTabBar === 'function' && this.getTabBar()) {
        this.getTabBar().updateActive('profile');
      }
      
      // 检查登录状态
      this.checkLoginStatus();
    }
  },

  methods: {
    /**
     * 检查登录状态
     */
    checkLoginStatus() {
      const loggedIn = isLoggedIn();
      const userProfile = getUserProfile();
      
      this.setData({
        isLoggedIn: loggedIn,
        userId: getCurrentUserId(),
        userInfo: {
          nickname: userProfile?.nickname || '',
          avatar_url: userProfile?.avatar_url || '',
        },
      });
      
      // 如果已登录，加载用户数据
      if (loggedIn) {
        this.loadUserData();
      }
    },

    /**
     * 加载用户数据
     */
    async loadUserData() {
      try {
        // 并行请求用户信息、集点和优惠券数据
        const [userInfoRes, stampRes, couponRes] = await Promise.allSettled([
          getUserInfo(),    // 从后端获取完整信息（包括手机号）
          getStampStatus(),
          getMyCoupons(),
        ]);

        // 处理用户信息（后端数据为准，包含手机号）
        if (userInfoRes.status === 'fulfilled' && userInfoRes.value.data) {
          const backendUserInfo = userInfoRes.value.data;
          this.setData({
            'userInfo.phone': backendUserInfo.phone_number || '',
          });
          // 如果后端有更新的头像昵称，同步到本地
          if (backendUserInfo.nickname || backendUserInfo.avatar_url) {
            this.setData({
              'userInfo.nickname': backendUserInfo.nickname || this.data.userInfo.nickname,
              'userInfo.avatar_url': backendUserInfo.avatar_url || this.data.userInfo.avatar_url,
            });
            saveUserProfile({
              nickname: backendUserInfo.nickname,
              avatar_url: backendUserInfo.avatar_url,
            });
          }
        }

        // 处理集点数据
        if (stampRes.status === 'fulfilled' && stampRes.value.data) {
          this.setData({
            'stampProgress.current': stampRes.value.data.current_stamps,
            'stampProgress.target': stampRes.value.data.next_reward_stamps,
            'stampProgress.total': stampRes.value.data.total_rewards_claimed,
          });
        }

        // 处理优惠券数据
        if (couponRes.status === 'fulfilled' && couponRes.value.data?.available) {
          this.setData({
            couponCount: couponRes.value.data.available.length,
          });
        }
      } catch (error) {
        console.error('[Profile] 加载用户数据失败:', error);
      }
    },

    /**
     * 重新登录
     */
    async reLogin() {
      if (this.data.loggingIn) {
        console.log('[Profile] 正在登录中，请勿重复点击');
        return;
      }

      const startTime = Date.now();
      this.setData({ loggingIn: true });
      console.log('[Profile] 开始登录...');
      
      try {
        // 1. 获取用户信息授权
        wx.showLoading({ title: '请授权...', mask: true });
        const userProfile = await wx.getUserProfile({
          desc: '用于完善用户资料',
        });
        
        console.log('[Profile] 获取用户信息成功:', {
          nickName: userProfile.userInfo.nickName,
          hasAvatar: !!userProfile.userInfo.avatarUrl,
        });
        
        // 2. 获取微信登录 code
        wx.showLoading({ title: '登录中...', mask: true });
        const loginResult = await wx.login();
        
        // 3. 调用后端登录接口，传入用户信息
        const response = await login({
          code: loginResult.code,
          nickname: userProfile.userInfo.nickName,
          avatar_url: userProfile.userInfo.avatarUrl,
        });
        
        wx.hideLoading();
        
        if (response.data) {
          console.log('[Profile] 登录成功:', {
            user_id: response.data.user_id,
            is_new_user: response.data.is_new_user,
          });
          
          // 保存登录信息
          saveAuth({
            access_token: response.data.access_token,
            refresh_token: response.data.refresh_token,
            user_id: response.data.user_id,
          });
          
          // 保存用户信息到本地
          saveUserProfile({
            nickname: userProfile.userInfo.nickName,
            avatar_url: userProfile.userInfo.avatarUrl,
          });
          
          wx.showToast({
            title: '登录成功',
            icon: 'success',
          });
          
          // 刷新页面状态
          this.checkLoginStatus();
        } else {
          console.error('[Profile] 登录响应无数据:', response);
          wx.showToast({
            title: '登录失败，请重试',
            icon: 'none',
          });
        }
      } catch (error: any) {
        const elapsed = Date.now() - startTime;
        console.error(`[Profile] 登录失败 (耗时 ${elapsed}ms):`, error);
        
        wx.hideLoading();
        wx.showToast({
          title: error?.data?.message || error?.errMsg || error?.message || '登录失败',
          icon: 'none',
          duration: 3000,
        });
      } finally {
        this.setData({ loggingIn: false });
      }
    },

    /**
     * 退出登录
     */
    logout() {
      wx.showModal({
        title: '提示',
        content: '确定要退出登录吗？',
        success: (res) => {
          if (res.confirm) {
            clearAuth();
            this.checkLoginStatus();
            wx.showToast({
              title: '已退出登录',
              icon: 'success',
            });
          }
        },
      });
    },

    /**
     * 跳转到订单列表
     */
    navigateToOrders() {
      if (!this.data.isLoggedIn) {
        wx.showToast({
          title: '请先登录',
          icon: 'none',
        });
        return;
      }
      wx.switchTab({
        url: '/pages/order-list/order-list',
      });
    },

    /**
     * 跳转到优惠券页面
     */
    navigateToCoupons() {
      if (!this.data.isLoggedIn) {
        wx.showToast({
          title: '请先登录',
          icon: 'none',
        });
        return;
      }
      // TODO: 创建优惠券页面后更新路由
      wx.showToast({
        title: '优惠券功能开发中',
        icon: 'none',
      });
    },

    /**
     * 联系商家
     */
    contactShop() {
      wx.showModal({
        title: '联系商家',
        content: '客服电话：待配置',
        showCancel: false,
      });
    },

    /**
     * 更新用户信息（重新授权获取头像昵称）
     */
    async updateUserInfo() {
      if (!this.data.isLoggedIn) {
        wx.showToast({
          title: '请先登录',
          icon: 'none',
        });
        return;
      }

      try {
        wx.showLoading({ title: '获取信息中...', mask: true });
        
        const userProfile = await wx.getUserProfile({
          desc: '用于更新用户资料',
        });
        
        // 保存到本地
        saveUserProfile({
          nickname: userProfile.userInfo.nickName,
          avatar_url: userProfile.userInfo.avatarUrl,
        });
        
        // 更新页面显示
        this.setData({
          'userInfo.nickname': userProfile.userInfo.nickName,
          'userInfo.avatar_url': userProfile.userInfo.avatarUrl,
        });
        
        wx.hideLoading();
        wx.showToast({
          title: '更新成功',
          icon: 'success',
        });
        
        console.log('[Profile] 用户信息已更新:', {
          nickName: userProfile.userInfo.nickName,
          hasAvatar: !!userProfile.userInfo.avatarUrl,
        });
      } catch (error: any) {
        wx.hideLoading();
        console.error('[Profile] 更新用户信息失败:', error);
        
        if (error.errMsg && error.errMsg.includes('cancel')) {
          wx.showToast({
            title: '已取消授权',
            icon: 'none',
          });
        } else {
          wx.showToast({
            title: '更新失败',
            icon: 'none',
          });
        }
      }
    },

    /**
     * 绑定手机号（通过button open-type="getPhoneNumber"触发）
     */
    async bindPhone(e: any) {
      if (!this.data.isLoggedIn) {
        wx.showToast({
          title: '请先登录',
          icon: 'none',
        });
        return;
      }

      const { code, errMsg } = e.detail;
      
      if (!code) {
        console.error('[Profile] 获取手机号失败:', errMsg);
        
        // 用户取消授权
        if (errMsg && errMsg.includes('cancel')) {
          wx.showToast({
            title: '已取消授权',
            icon: 'none',
          });
          return;
        }
        
        // 权限问题
        if (errMsg && errMsg.includes('no permission')) {
          wx.showModal({
            title: '功能暂不可用',
            content: '获取手机号功能需要在真机环境中使用,且小程序需要先配置相关权限。\n\n开发者工具中此功能可能无法正常使用。',
            showCancel: false,
            confirmText: '我知道了',
          });
          return;
        }
        
        // 其他错误
        wx.showToast({
          title: '获取手机号失败',
          icon: 'none',
        });
        return;
      }

      try {
        wx.showLoading({ title: '绑定中...', mask: true });
        
        const response = await bindPhoneNumber({ code });
        
        wx.hideLoading();
        
        if (response.data && response.data.phone_number) {
          console.log('[Profile] 手机号绑定成功:', response.data.phone_number);
          
          // 更新页面显示
          this.setData({
            'userInfo.phone': response.data.phone_number,
          });
          
          wx.showToast({
            title: '绑定成功',
            icon: 'success',
          });
        } else {
          throw new Error('响应数据异常');
        }
      } catch (error: any) {
        wx.hideLoading();
        console.error('[Profile] 绑定手机号失败:', error);
        wx.showToast({
          title: error?.data?.message || '绑定失败，请重试',
          icon: 'none',
        });
      }
    },
  }
})
