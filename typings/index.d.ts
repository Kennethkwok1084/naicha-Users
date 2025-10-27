/// <reference path="./types/index.d.ts" />

interface IAppOption {
  globalData: {
    userInfo?: WechatMiniprogram.UserInfo;
    theme: 'default' | 'elder';
  };
  userInfoReadyCallback?: WechatMiniprogram.GetUserInfoSuccessCallback;
  checkUpdate: () => void;
  initTheme: () => void;
}