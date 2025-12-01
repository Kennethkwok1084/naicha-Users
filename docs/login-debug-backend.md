# 登录问题后端诊断指南

## 🔍 问题现象

不同设备登录时:
- ✅ 前端获取到**不同的微信 code** (已确认)
- ❌ 后端返回**相同的 user_id = 5** (异常)
- ❌ 返回 `is_new_user: false` (说明不是新建用户)

## 🎯 诊断重点

### 1. 后端是否真正调用了微信 API?

在后端登录接口中添加详细日志:

```python
# 在 /api/v1/users/login 接口中添加
import logging
logger = logging.getLogger(__name__)

@router.post("/login")
async def login(payload: WeChatLoginPayload):
    code = payload.code
    logger.info(f"[LOGIN] 收到登录请求 - code: {code[:8]}... (长度: {len(code)})")
    
    # 调用微信 jscode2session
    wx_response = await call_wechat_api(code)
    logger.info(f"[LOGIN] 微信API响应 - openid: {wx_response.get('openid', 'N/A')[:8]}..., " 
                f"session_key存在: {bool(wx_response.get('session_key'))}, "
                f"errcode: {wx_response.get('errcode', 0)}")
    
    # 根据 openid 获取或创建用户
    openid = wx_response.get('openid')
    user = get_or_create_user(openid)
    logger.info(f"[LOGIN] 用户ID: {user.id}, 是否新用户: {user.is_new}")
    
    # 生成 token
    access_token = create_access_token(user.id)
    logger.info(f"[LOGIN] 生成token - 前60位: {access_token[:60]}, 后10位: {access_token[-10:]}")
    
    return {
        "access_token": access_token,
        "user_id": user.id,
        "is_new_user": user.is_new
    }
```

### 2. 检查微信 API 配置

确认后端配置文件中:

```python
# settings.py 或 config.py
WECHAT_APPID = "wx..."  # 必须是正式的 AppID,不能是测试号
WECHAT_SECRET = "..."   # 对应的 AppSecret

# 微信 API 地址
WECHAT_JSCODE2SESSION_URL = "https://api.weixin.qq.com/sns/jscode2session"
```

**关键检查点:**
- ✅ AppID 和 Secret 是否正确?
- ✅ 是否使用了测试号(测试号可能有限制)?
- ✅ 网络能否访问 `api.weixin.qq.com`?

### 3. 排查常见问题

#### 问题A: 后端使用了 Mock/Fallback 逻辑

```python
# ❌ 错误示例 - 开发环境返回固定用户
if settings.ENV == "development":
    return {
        "access_token": "mock_token",
        "user_id": 5,  # ⚠️ 固定返回 user_id 5!
        "is_new_user": False
    }
```

**解决方法:** 注释掉所有测试/开发环境的 Mock 代码,使用真实微信 API

#### 问题B: 缓存导致问题

```python
# ❌ 错误示例 - 缓存了微信API响应
@lru_cache(maxsize=128)
def get_wechat_openid(code: str):
    # code 应该是一次性的,不能缓存!
    return call_wechat_api(code)
```

**解决方法:** 移除对 code → openid 的缓存

#### 问题C: 数据库查询问题

```python
# ❌ 错误示例 - 总是返回第一个用户
def get_or_create_user(openid: str):
    user = db.query(User).first()  # ⚠️ 没有过滤条件!
    return user
```

**正确写法:**
```python
def get_or_create_user(openid: str):
    user = db.query(User).filter(User.openid == openid).first()
    if not user:
        user = User(openid=openid)
        db.add(user)
        db.commit()
    return user
```

### 4. 微信 API 返回值检查

微信 `jscode2session` 正常响应:
```json
{
  "openid": "oX4Yp5...",
  "session_key": "...",
  "unionid": "..." // 可选
}
```

异常响应:
```json
{
  "errcode": 40029,
  "errmsg": "invalid code"
}
```

**常见错误码:**
- `40029` - code 无效(已使用或过期)
- `40163` - code 已被使用
- `-1` - 系统繁忙

### 5. 测试步骤

1. **重启后端服务** (清除内存缓存)
2. **清空数据库 users 表** (可选,方便观察)
3. **打开后端日志监控**
4. **在模拟器登录** → 查看日志中的 openid 和 user_id
5. **在真机登录** → 查看日志中的 openid 和 user_id
6. **对比两次日志:**
   - openid 应该不同
   - user_id 应该不同
   - 如果相同,说明微信 API 返回了相同的 openid(极不可能),或后端逻辑有问题

## 📊 预期结果

### 正常情况
```
# 模拟器登录
[LOGIN] 收到登录请求 - code: 0f3Rrcml...
[LOGIN] 微信API响应 - openid: oX4Yp5AB...
[LOGIN] 用户ID: 5, 是否新用户: true
[LOGIN] 生成token - 前60位: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo1L...

# 真机登录
[LOGIN] 收到登录请求 - code: 0c3bgrHa...
[LOGIN] 微信API响应 - openid: oX4Yp5XY...  # ✅ openid 不同
[LOGIN] 用户ID: 6, 是否新用户: true        # ✅ 创建新用户
[LOGIN] 生成token - 前60位: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo2L...
```

### 异常情况 (当前状态)
```
# 模拟器登录
[LOGIN] 收到登录请求 - code: 0f3Rrcml...
[LOGIN] 用户ID: 5  # ❌ 总是 5

# 真机登录
[LOGIN] 收到登录请求 - code: 0c3bgrHa...  # ✅ code 不同
[LOGIN] 用户ID: 5  # ❌ 还是 5!
```

## 🔧 快速修复建议

1. **在后端添加上述日志**
2. **检查是否有环境变量控制的 Mock 逻辑**
3. **确认 `get_or_create_user` 函数实现正确**
4. **测试并分享后端日志**

## 📝 前端已完成的诊断

前端已添加详细日志,可以对比:
- 不同设备的 code (已确认不同)
- 不同设备的 token (待确认是否相同)
- 如果 token 前60位和后10位都相同 → 后端返回了固定 token → 问题在后端

## 🚨 紧急排查清单

- [ ] 后端是否有 `if ENV == "dev"` 返回固定用户的代码?
- [ ] 微信 AppID/Secret 是否配置正确?
- [ ] 后端能否访问 `https://api.weixin.qq.com`?
- [ ] 数据库查询是否使用了 `.first()` 而不是 `.filter(openid=...).first()`?
- [ ] 是否有缓存机制影响?
- [ ] 后端日志中 openid 是否真的不同?
