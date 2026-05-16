#!/usr/bin/env python3
"""
API-Market 服务器 v4.0
- 紧凑索引格式支持
- 内存缓存优化
- 请求日志
- 错误处理增强
"""

import json
import os
import time
import logging
from http.server import HTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
from functools import lru_cache

# 配置
PORT = 8080
DB_PATH = '/workspace/API-Market/api-database.json'
INDEX_PATH = '/workspace/API-Market/search-index.json'

# 日志配置
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    datefmt='%H:%M:%S'
)
logger = logging.getLogger('api-market')

# 启动计时
start_time = time.time()

# 加载数据
logger.info("Loading database...")
with open(DB_PATH, 'r', encoding='utf-8') as f:
    DATABASE = json.load(f)

with open(INDEX_PATH, 'r', encoding='utf-8') as f:
    SEARCH_INDEX = json.load(f)

# 构建查找表
API_LOOKUP = {}
CATEGORY_MAP = {}
for category in DATABASE['categories']:
    CATEGORY_MAP[category['id']] = category
    for api in category['apis']:
        API_LOOKUP[api.get('id', '')] = api

# 索引字段映射（支持新旧格式）
INDEX_USES_SHORT_KEYS = len(SEARCH_INDEX) > 0 and 'i' in SEARCH_INDEX[0]

load_time = time.time() - start_time
logger.info(f"Loaded {DATABASE['metadata']['total_apis']} APIs, {len(CATEGORY_MAP)} categories in {load_time*1000:.0f}ms")


class APIHandler(SimpleHTTPRequestHandler):
    """优化的HTTP处理器"""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory='/workspace/API-Market', **kwargs)

    def log_message(self, format, *args):
        """自定义日志格式"""
        logger.info(f"{self.client_address[0]} - {format % args}")

    def do_GET(self):
        start = time.time()
        try:
            parsed = urlparse(self.path)
            path = parsed.path
            query = parse_qs(parsed.query)

            # API路由
            if path == '/api' or path == '/api/':
                self._handle_api_list(query)
            elif path == '/api/categories':
                self._handle_categories(query)
            elif path.startswith('/api/category/'):
                cat_id = path.split('/')[-1]
                self._handle_category_apis(cat_id, query)
            elif path.startswith('/api/search'):
                self._handle_search(query)
            elif path == '/api/stats':
                self._handle_stats()
            elif path == '/api/health':
                self._handle_health()
            else:
                super().do_GET()

            elapsed = (time.time() - start) * 1000
            if elapsed > 100:  # 慢请求警告
                logger.warning(f"Slow request: {path} ({elapsed:.0f}ms)")
        except Exception as e:
            logger.error(f"Error handling {self.path}: {e}")
            self._json_response({'error': str(e)}, 500)

    def _json_response(self, data, status=200):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        # 紧凑 JSON 输出
        self.wfile.write(json.dumps(data, ensure_ascii=False, separators=(',', ':')).encode('utf-8'))

    def _handle_health(self):
        self._json_response({
            'status': 'ok',
            'version': DATABASE['metadata']['version'],
            'uptime': round(time.time() - start_time, 1)
        })

    def _handle_stats(self):
        grade_dist = {}
        for cat in DATABASE['categories']:
            for api in cat['apis']:
                g = api.get('quality_grade', 'N/A')
                grade_dist[g] = grade_dist.get(g, 0) + 1

        self._json_response({
            'total_apis': DATABASE['metadata']['total_apis'],
            'total_categories': DATABASE['metadata']['total_categories'],
            'sources': DATABASE['metadata']['sources'],
            'grade_distribution': grade_dist,
            'metadata_coverage': {
                'auth': sum(1 for c in DATABASE['categories'] for a in c['apis'] if a.get('auth') is not None),
                'https': sum(1 for c in DATABASE['categories'] for a in c['apis'] if a.get('https') is not None),
                'cors': sum(1 for c in DATABASE['categories'] for a in c['apis'] if a.get('cors') is not None),
                'description': sum(1 for c in DATABASE['categories'] for a in c['apis'] if a.get('description')),
            }
        })

    def _handle_api_list(self, query):
        page = int(query.get('page', [1])[0])
        per_page = min(int(query.get('per_page', [20])[0]), 100)  # 限制每页最大
        sort_by = query.get('sort', ['name'])[0]
        order = query.get('order', ['asc'])[0]
        grade = query.get('grade', [None])[0]
        category = query.get('category', [None])[0]
        has_cors = query.get('cors', [None])[0]
        free_only = query.get('free', [None])[0]

        # 收集所有API
        all_apis = []
        for cat in DATABASE['categories']:
            for api in cat['apis']:
                all_apis.append({**api, '_category': cat['id']})

        # 筛选
        if grade:
            all_apis = [a for a in all_apis if a.get('quality_grade') == grade]
        if category:
            all_apis = [a for a in all_apis if a.get('_category') == category]
        if has_cors == 'true':
            all_apis = [a for a in all_apis if a.get('cors') == True]
        if free_only == 'true':
            all_apis = [a for a in all_apis if not a.get('auth')]

        # 排序
        reverse = order == 'desc'
        if sort_by == 'name':
            all_apis.sort(key=lambda x: x.get('name', '').lower(), reverse=reverse)
        elif sort_by == 'quality':
            all_apis.sort(key=lambda x: x.get('quality_score', 0), reverse=reverse)
        elif sort_by == 'category':
            all_apis.sort(key=lambda x: x.get('_category', ''), reverse=reverse)

        # 分页
        total = len(all_apis)
        start = (page - 1) * per_page
        page_apis = all_apis[start:start + per_page]

        # 清理输出
        for api in page_apis:
            api.pop('_category', None)
            api.pop('quality', None)

        self._json_response({
            'total': total,
            'page': page,
            'per_page': per_page,
            'total_pages': (total + per_page - 1) // per_page,
            'apis': page_apis,
        })

    def _handle_categories(self, query):
        sort_by = query.get('sort', ['api_count'])[0]
        order = query.get('order', ['desc'])[0]

        cats = []
        for cat in DATABASE['categories']:
            cats.append({
                'id': cat['id'],
                'name': cat['name'],
                'api_count': cat['api_count'],
                'avg_quality': round(
                    sum(a.get('quality_score', 0) for a in cat['apis']) / max(len(cat['apis']), 1), 1
                ) if cat['apis'] else 0,
            })

        reverse = order == 'desc'
        if sort_by == 'api_count':
            cats.sort(key=lambda x: x['api_count'], reverse=reverse)
        elif sort_by == 'name':
            cats.sort(key=lambda x: x['name'], reverse=reverse)
        elif sort_by == 'avg_quality':
            cats.sort(key=lambda x: x['avg_quality'], reverse=reverse)

        self._json_response({'total': len(cats), 'categories': cats})

    def _handle_category_apis(self, cat_id, query):
        cat = CATEGORY_MAP.get(cat_id)
        if not cat:
            self._json_response({'error': f'Category {cat_id} not found'}, 404)
            return

        page = int(query.get('page', [1])[0])
        per_page = min(int(query.get('per_page', [50])[0]), 100)
        sort_by = query.get('sort', ['quality'])[0]
        order = query.get('order', ['desc'])[0]

        apis = cat['apis'].copy()
        for api in apis:
            api.pop('quality', None)

        reverse = order == 'desc'
        if sort_by == 'name':
            apis.sort(key=lambda x: x.get('name', '').lower(), reverse=reverse)
        elif sort_by == 'quality':
            apis.sort(key=lambda x: x.get('quality_score', 0), reverse=reverse)

        total = len(apis)
        start = (page - 1) * per_page
        page_apis = apis[start:start + per_page]

        self._json_response({
            'category': {'id': cat['id'], 'name': cat['name'], 'api_count': cat['api_count']},
            'total': total,
            'page': page,
            'per_page': per_page,
            'apis': page_apis,
        })

    def _handle_search(self, query):
        q = query.get('q', [''])[0].strip().lower()
        if not q:
            self._json_response({'error': 'Missing query parameter q'}, 400)
            return

        page = int(query.get('page', [1])[0])
        per_page = min(int(query.get('per_page', [20])[0]), 100)
        category = query.get('category', [None])[0]

        words = q.split()
        results = []

        for item in SEARCH_INDEX:
            # 支持新旧索引格式
            if INDEX_USES_SHORT_KEYS:
                item_id = item.get('i', '')
                name = item.get('n', '')
                cat = item.get('c', '')
                search_text = item.get('t', '')
            else:
                item_id = item.get('id', '')
                name = item.get('name', '')
                cat = item.get('category', '')
                search_text = item.get('_search_text', f"{name} {item.get('description', '')} {cat}").lower()

            # 快速文本匹配
            if q not in search_text:
                continue

            # 计算相关性得分
            score = 0
            name_lower = name.lower()

            # 精确名称匹配
            if q == name_lower:
                score += 100
            elif q in name_lower:
                score += 50

            # 多词匹配
            if all(w in name_lower for w in words):
                score += 30
            for w in words:
                if w in name_lower:
                    score += 10

            # 分类匹配
            if q in cat.lower():
                score += 20

            if score > 0:
                if category and cat != category:
                    continue

                # 获取完整 API 数据
                full_api = API_LOOKUP.get(item_id, {})
                results.append({
                    **full_api,
                    '_score': score
                })

        # 按相关性排序
        results.sort(key=lambda x: x.get('_score', 0), reverse=True)

        total = len(results)
        start = (page - 1) * per_page
        page_results = results[start:start + per_page]

        # 清理输出
        for r in page_results:
            r.pop('_score', None)
            r.pop('quality', None)

        self._json_response({
            'query': q,
            'total': total,
            'page': page,
            'per_page': per_page,
            'results': page_results,
        })

    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()


if __name__ == '__main__':
    server = HTTPServer(('0.0.0.0', PORT), APIHandler)
    logger.info(f"Server started on port {PORT}")
    print(f"\n{'='*50}")
    print(f"  API-Market Server v4.0")
    print(f"  URL: http://localhost:{PORT}")
    print(f"  API: http://localhost:{PORT}/api")
    print(f"  Web: http://localhost:{PORT}/index.html")
    print(f"{'='*50}\n")
    server.serve_forever()
