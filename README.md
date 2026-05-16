<div align="center">

# 🌐 API-Market

### A Comprehensive Collection of 14,000+ Public APIs

**Unified • Standardized • Searchable • Open Source**

[![GitHub stars](https://img.shields.io/github/stars/badhope/API-Market?style=for-the-badge&logo=github)](https://github.com/badhope/API-Market/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/badhope/API-Market?style=for-the-badge&logo=github)](https://github.com/badhope/API-Market/network/members)
[![MIT License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)
[![API Count](https://img.shields.io/badge/APIs-14,405+-blue?style=for-the-badge)](api-database.json)

**[🚀 Live Demo](#-quick-start) • [📖 Documentation](#-documentation) • [🤝 Contributing](CONTRIBUTING.md) • [🌐 中文文档](#-中文文档)**

</div>

---

## 📖 Table of Contents

- [About The Project](#-about-the-project)
- [Key Features](#-key-features)
- [Quick Start](#-quick-start)
- [Usage Guide](#-usage-guide)
- [API Reference](#-api-reference)
- [Categories](#-categories)
- [Data Sources](#-data-sources)
- [Quality Scoring](#-quality-scoring)
- [For Developers](#-for-developers)
- [For Users](#-for-users)
- [Contributing](#-contributing)
- [License](#-license)
- [中文文档](#-中文文档)

---

## 🎯 About The Project

**API-Market** is the most comprehensive open-source collection of public APIs available on the internet. We aggregate APIs from multiple trusted sources, standardize their metadata, and provide powerful search and filtering capabilities.

### Why API-Market?

| Problem | Solution |
|---------|----------|
| 🔍 APIs scattered across hundreds of repositories | ✅ One unified, searchable database |
| 📊 Inconsistent metadata formats | ✅ Standardized schema with quality scores |
| 🏷️ Poor categorization | ✅ 60 well-defined categories |
| 🔒 Unknown API reliability | ✅ Quality scoring system (A-F grades) |

### What Makes Us Different?

- **📊 Scale**: 14,405+ APIs from 58+ curated sources
- **🎯 Quality**: Every API is scored and graded (A-F)
- **🔍 Search**: Powerful full-text search with relevance ranking
- **📁 Categories**: 60 carefully designed categories
- **🔄 Auto-Update**: Daily automated collection via GitHub Actions
- **🌐 Open Source**: Fully open, community-driven project

---

## ✨ Key Features

### For API Consumers
- 🔍 **Instant Search** - Find APIs by name, description, or category
- 📊 **Quality Grades** - Know which APIs are reliable (A/B/C/D/F)
- 🏷️ **Smart Filtering** - Filter by category, grade, authentication, CORS
- 📱 **Responsive UI** - Works on desktop, tablet, and mobile

### For Developers
- 🚀 **REST API** - Full programmatic access to all data
- 🐳 **Docker Ready** - One-command deployment
- 📦 **JSON Export** - Download raw data for your projects
- 🔧 **CI/CD Pipeline** - Automated daily updates

---

## 🚀 Quick Start

### Option 1: Use the Web Interface

```bash
# Clone and run
git clone https://github.com/badhope/API-Market.git
cd API-Market
python3 server.py

# Open http://localhost:8080 in your browser
```

### Option 2: Docker

```bash
# Using Docker Compose
docker-compose up -d

# Or build manually
docker build -t api-market .
docker run -p 8080:8080 api-market
```

### Option 3: Use the API Directly

```bash
# Search for APIs
curl "http://localhost:8080/api/search?q=weather"

# Get all categories
curl "http://localhost:8080/api/categories"

# Filter by grade
curl "http://localhost:8080/api?grade=A&per_page=50"
```

---

## 📖 Usage Guide

### Web Interface

1. **Browse Categories**: Click on any category to see all APIs in that category
2. **Search**: Type in the search box to find APIs by name or description
3. **Filter**: Use the filter panel to narrow down results
   - By Grade: A, B, C, D, F
   - By Category: Select from 60 categories
   - By Features: CORS support, HTTPS, Free APIs
4. **Sort**: Sort by quality score, name, or category
5. **View Details**: Click on any API card to see full details

### REST API

| Endpoint | Description | Example |
|----------|-------------|---------|
| `GET /api` | List all APIs with pagination | `/api?page=1&per_page=20` |
| `GET /api/search?q=` | Search APIs | `/api/search?q=weather` |
| `GET /api/categories` | List all categories | `/api/categories` |
| `GET /api/category/{id}` | Get APIs in a category | `/api/category/development` |
| `GET /api/stats` | Get statistics | `/api/stats` |
| `GET /api/health` | Health check | `/api/health` |

### Query Parameters

| Parameter | Description | Values |
|-----------|-------------|--------|
| `page` | Page number | 1, 2, 3... |
| `per_page` | Items per page | 1-100 |
| `sort` | Sort by | `name`, `quality`, `category` |
| `order` | Sort order | `asc`, `desc` |
| `grade` | Filter by grade | `A`, `B`, `C`, `D`, `F` |
| `category` | Filter by category | `development`, `weather`... |
| `cors` | Filter CORS support | `true` |
| `free` | Filter free APIs | `true` |

---

## 📚 API Reference

### Response Format

```json
{
  "total": 14405,
  "page": 1,
  "per_page": 20,
  "total_pages": 721,
  "apis": [
    {
      "id": "development_openai",
      "name": "OpenAI API",
      "url": "https://api.openai.com",
      "description": "Powerful AI models for text, code, and images",
      "category": "development",
      "auth": "apiKey",
      "https": true,
      "cors": true,
      "quality_score": 95,
      "quality_grade": "A"
    }
  ]
}
```

### API Object Schema

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier |
| `name` | string | API name |
| `url` | string | API endpoint URL |
| `description` | string | Brief description |
| `category` | string | Category ID |
| `auth` | string | Auth type: `apiKey`, `OAuth2`, `None` |
| `https` | boolean | HTTPS support |
| `cors` | boolean | CORS support |
| `quality_score` | number | Score 0-100 |
| `quality_grade` | string | Grade A-F |

---

## 📁 Categories

We have **60 carefully curated categories**:

| Category | Count | Description |
|----------|-------|-------------|
| Development | 4,297 | APIs, SDKs, frameworks, dev tools |
| Cloud Storage | 915 | File storage, CDN, hosting |
| Transportation | 698 | Maps, routing, logistics |
| Shopping | 661 | E-commerce, payments |
| Government | 504 | Public data, civic APIs |
| Machine Learning | 484 | AI, NLP, computer vision |
| Documents | 363 | PDF, conversion, productivity |
| Geocoding | 340 | Maps, location services |
| Entertainment | 309 | Games, media, streaming |
| Security | 293 | Auth, encryption, monitoring |

[View all 60 categories →](api-database.json)

---

## 📊 Data Sources

We collect APIs from trusted, curated sources:

| Source | APIs | Type |
|--------|------|------|
| APIs.guru | 2,529 | OpenAPI/Swagger specs |
| public-apis | 1,466 | Community curated |
| awesome-agent-apis | 4,223 | AI/Agent APIs |
| n0shake/Public-APIs | 489 | Developer APIs |
| Web directories | 2,000+ | Various sources |

**Total: 14,405 unique APIs** (deduplicated)

---

## 🎯 Quality Scoring

Every API is scored on a 0-100 scale and assigned a grade:

| Grade | Score Range | Meaning |
|-------|-------------|---------|
| 🟢 **A** | 85-100 | Excellent - Well documented, reliable |
| 🔵 **B** | 70-84 | Good - Solid choice for production |
| 🟡 **C** | 55-69 | Acceptable - May have limitations |
| 🟠 **D** | 40-54 | Poor - Use with caution |
| 🔴 **F** | 0-39 | Avoid - Missing critical info |

### Scoring Factors

- **Documentation** (+20): Has description
- **Security** (+15): HTTPS enabled
- **CORS** (+10): Cross-origin support
- **Category** (+15): Properly categorized
- **Source Quality** (+10): From trusted source

---

## 👨‍💻 For Developers

### Local Development

```bash
# Clone the repo
git clone https://github.com/badhope/API-Market.git
cd API-Market

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r scripts/requirements.txt

# Run server
python3 server.py

# Run tests
pytest scripts/tests/

# Validate data
python3 scripts/validate.py
```

### Integration Examples

**JavaScript/Node.js:**
```javascript
const response = await fetch('http://localhost:8080/api/search?q=weather');
const data = await response.json();
console.log(`Found ${data.total} weather APIs`);
```

**Python:**
```python
import requests

response = requests.get('http://localhost:8080/api/search?q=weather')
data = response.json()
print(f"Found {data['total']} weather APIs")
```

**cURL:**
```bash
curl -s "http://localhost:8080/api/search?q=weather" | jq '.total'
```

---

## 👥 For Users

### Who Should Use API-Market?

| User Type | Use Case |
|------------|----------|
| **Developers** | Find APIs for your projects |
| **Data Scientists** | Discover data sources |
| **Students** | Learn about API ecosystems |
| **Researchers** | Study API trends and patterns |
| **Product Managers** | Evaluate API options |

### How to Find the Right API

1. **Start with Search**: Enter keywords related to your needs
2. **Check the Grade**: Prefer A/B graded APIs for production
3. **Verify Details**: Click to see full API information
4. **Visit Documentation**: Follow the URL to official docs
5. **Test the API**: Most APIs offer free tiers for testing

### Tips for API Selection

- ✅ Choose **Grade A or B** APIs for production use
- ✅ Check **HTTPS** and **CORS** for web applications
- ✅ Look for **free tiers** if you're just starting
- ⚠️ **Grade C or D** APIs may need additional verification
- ❌ Avoid **Grade F** APIs - they lack essential information

---

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

### Ways to Contribute

- 🐛 **Report Issues**: Found a bug or outdated API?
- 💡 **Suggest APIs**: Know a great API we're missing?
- 📝 **Improve Docs**: Help us write better documentation
- 🔧 **Code**: Submit pull requests
- ⭐ **Star Us**: Show your support!

### Adding a New API

1. Fork the repository
2. Edit `api-database.json`
3. Add your API in the correct category:
```json
{
  "id": "category_api-name",
  "name": "API Name",
  "url": "https://api.example.com",
  "description": "Brief description",
  "category": "category",
  "auth": "apiKey",
  "https": true,
  "cors": true
}
```
4. Run `python3 scripts/validate.py`
5. Submit a pull request

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

All API data is collected from public sources. Please check individual API terms of service before use.

---

## 🌐 中文文档

### 项目简介

**API-Market** 是互联网上最全面的开源公开 API 集合。我们从多个可信来源聚合 API，标准化元数据，并提供强大的搜索和过滤功能。

### 快速开始

```bash
# 克隆并运行
git clone https://github.com/badhope/API-Market.git
cd API-Market
python3 server.py

# 浏览器打开 http://localhost:8080
```

### 主要特性

- **📊 规模**: 14,405+ 个 API，来自 58+ 个精选来源
- **🎯 质量**: 每个 API 都有评分和等级 (A-F)
- **🔍 搜索**: 强大的全文搜索和相关性排序
- **📁 分类**: 60 个精心设计的分类
- **🔄 自动更新**: GitHub Actions 每日自动采集

### 使用方法

1. **浏览分类**: 点击任意分类查看该分类的所有 API
2. **搜索**: 在搜索框输入关键词搜索
3. **筛选**: 使用筛选面板缩小范围
   - 按等级: A, B, C, D, F
   - 按分类: 从 60 个分类中选择
   - 按特性: CORS 支持、HTTPS、免费 API
4. **排序**: 按质量分数、名称或分类排序
5. **查看详情**: 点击任意 API 卡片查看完整信息

### API 接口

| 端点 | 描述 | 示例 |
|------|------|------|
| `GET /api` | 分页列出所有 API | `/api?page=1&per_page=20` |
| `GET /api/search?q=` | 搜索 API | `/api/search?q=weather` |
| `GET /api/categories` | 列出所有分类 | `/api/categories` |
| `GET /api/category/{id}` | 获取分类中的 API | `/api/category/development` |
| `GET /api/stats` | 获取统计信息 | `/api/stats` |

### 贡献指南

欢迎贡献！详情请参阅 [CONTRIBUTING.md](CONTRIBUTING.md)。

- 🐛 **报告问题**: 发现 bug 或过时的 API？
- 💡 **建议 API**: 知道我们缺少的优秀 API？
- 📝 **改进文档**: 帮助我们编写更好的文档
- 🔧 **代码**: 提交 Pull Request
- ⭐ **加星**: 表示支持！

---

<div align="center">

### 🙏 Acknowledgments

Special thanks to all the amazing open-source projects that make this possible:

- [public-apis](https://github.com/public-apis/public-apis) - The original public APIs collection
- [APIs.guru](https://apis.guru) - OpenAPI directory
- All our [contributors](https://github.com/badhope/API-Market/graphs/contributors)

---

**Made with ❤️ by the API-Market Community**

[⬆ Back to Top](#-api-market)

</div>
