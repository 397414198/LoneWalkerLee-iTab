# LoneWalkerLee iTab 5.0

Cloudflare Workers Static Assets + Neon PostgreSQL.

## Features
- Glassmorphism fullscreen homepage
- Clock / Chinese date / calendar
- Browser geolocation weather
- Current weather + Monday-Sunday 7-day forecast
- Search engine switch
- Website categories and admin CRUD
- Neon cloud data sync
- Custom wallpaper URL

## Cloudflare
Keep these Secrets in the Worker project:
- DATABASE_URL
- ADMIN_PASSWORD

Deploy command: `npx wrangler deploy`


## 5.3 新增：网站 favicon 自动图标
- 网站卡片支持 Emoji、图片 URL、自动 favicon。
- 添加/编辑网站时可一键根据网址生成 favicon 地址。
- 管理员可使用“✨ 自动补全图标”批量为旧网站生成 favicon。
- 自动图标使用 DuckDuckGo favicon 服务，无需 API Key；图标加载失败时自动回退为 🔗。
- 不修改数据库结构，继续复用 sites.icon 字段。
