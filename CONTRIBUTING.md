# 🤝 API-Market 贡献指南

感谢您对 API-Market 的关注！我们欢迎所有形式的贡献。

---

## 📋 目录

1. [快速开始](#快速开始)
2. [开发环境](#开发环境)
3. [项目结构](#项目结构)
4. [代码规范](#代码规范)
5. [提交 PR](#提交-pr)
6. [测试](#测试)
7. [Docker 部署](#docker-部署)

---

## 快速开始

```bash
# 克隆仓库
git clone https://github.com/yourusername/API-Market.git
cd API-Market

# 安装依赖
pip install -r scripts/requirements.txt

# 启动服务器
python3 server.py

# 访问 http://localhost:8080
```

---

## 开发环境

### Python 版本
- Python 3.11+

### 虚拟环境（推荐）
```bash
python3 -m venv venv
source venv/bin/activate  # Linux/Mac
# 或
venv\Scripts\activate  # Windows

pip install -r scripts/requirements.txt
```

### 编辑器配置
项目使用 `.editorconfig` 统一代码风格，请确保您的编辑器支持 EditorConfig。

---

## 项目结构

```
API-Market/
├── apis/                    # 分类 API 数据文件
├── docs/                    # 文档
├── scripts/                 # 脚本
│   ├── tests/              # 测试
│   ├── pipeline.py         # 数据采集流水线
│   ├── validate.py         # 数据验证
│   └── requirements.txt    # Python 依赖
├── .github/workflows/       # GitHub Actions
├── api-database.json        # 主数据库
├── search-index.json        # 搜索索引
├── server.py               # HTTP 服务器
├── index.html              # Web 界面
├── Dockerfile              # Docker 配置
└── docker-compose.yml      # Docker Compose
```

---

## 代码规范

### Python
- 使用 4 空格缩进
- 最大行长度 100 字符
- 使用类型注解
- 添加 docstring

```python
def process_api(api: dict) -> dict:
    """
    处理 API 数据，返回标准化格式。
    
    Args:
        api: 原始 API 数据字典
        
    Returns:
        标准化后的 API 字典
    """
    return {
        'name': api.get('name', '').strip(),
        'url': api.get('url', '').strip(),
    }
```

### 代码格式化
```bash
# 使用 black 格式化
black scripts/

# 使用 flake8 检查
flake8 scripts/

# 使用 mypy 类型检查
mypy scripts/
```

---

## 提交 PR

### 流程
1. Fork 仓库
2. 创建分支：`git checkout -b feature/your-feature`
3. 提交更改：`git commit -m "feat: 添加新功能"`
4. 推送分支：`git push origin feature/your-feature`
5. 创建 Pull Request

### Commit 规范
- `feat:` 新功能
- `fix:` 修复问题
- `docs:` 文档更新
- `style:` 代码格式
- `refactor:` 重构
- `test:` 测试
- `chore:` 构建/工具

---

## 测试

### 运行测试
```bash
# 运行所有测试
pytest

# 运行特定测试
pytest scripts/tests/test_validate.py

# 生成覆盖率报告
pytest --cov=scripts --cov-report=html
```

### 验证数据
```bash
# 验证数据库完整性
python scripts/validate.py
```

---

## Docker 部署

### 构建镜像
```bash
docker build -t api-market .
```

### 运行容器
```bash
docker run -d -p 8080:8080 --name api-market api-market
```

### 使用 Docker Compose
```bash
# 启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

---

## 添加新 API

如果您想手动添加 API：

1. 编辑 `api-database.json`
2. 在对应分类的 `apis` 数组中添加条目
3. 运行 `python scripts/validate.py` 验证
4. 提交 PR

### API 条目格式
```json
{
  "id": "category_api-name",
  "name": "API 名称",
  "url": "https://api.example.com",
  "description": "API 描述",
  "category": "category",
  "auth": "apiKey",
  "https": true,
  "cors": true,
  "source": "source-repo",
  "quality_score": 85,
  "quality_grade": "A"
}
```

---

## 报告问题

创建 Issue 时请包含：
- 问题描述
- 复现步骤
- 期望行为
- 实际行为
- 环境信息（OS、Python 版本）

---

## 许可证

通过贡献代码，您同意将代码按照 [MIT License](LICENSE) 发布。

---

<div align="center">

**让 API 发现更简单** 🚀

</div>
