#!/usr/bin/env python3
"""
API-Market 数据验证脚本 v2.0
支持紧凑索引格式
"""
import json
import os
import sys
import time

DB_PATH = '/workspace/API-Market/api-database.json'
INDEX_PATH = '/workspace/API-Market/search-index.json'
APIS_DIR = '/workspace/API-Market/apis'

errors = []
warnings = []

def check(condition, msg, level='error'):
    if not condition:
        if level == 'error':
            errors.append(msg)
            print(f"  ❌ {msg}")
        else:
            warnings.append(msg)
            print(f"  ⚠️ {msg}")
    else:
        print(f"  ✅ {msg}")

def main():
    start_time = time.time()
    print("=" * 50)
    print("  API-Market 数据验证 v2.0")
    print("=" * 50)

    # 1. 文件存在性
    print("\n📁 文件检查:")
    check(os.path.exists(DB_PATH), "api-database.json 存在")
    check(os.path.exists(INDEX_PATH), "search-index.json 存在")
    check(os.path.exists(APIS_DIR), "apis/ 目录存在")

    # 文件大小
    db_size = os.path.getsize(DB_PATH) / 1024 / 1024
    idx_size = os.path.getsize(INDEX_PATH) / 1024 / 1024
    print(f"  📊 数据库大小: {db_size:.2f} MB")
    print(f"  📊 索引大小: {idx_size:.2f} MB")

    if not os.path.exists(DB_PATH):
        print("\n❌ 主数据库不存在，无法继续验证")
        sys.exit(1)

    # 2. 数据库结构
    print("\n📊 数据库结构:")
    with open(DB_PATH) as f:
        db = json.load(f)

    check('metadata' in db, "metadata 字段存在")
    check('categories' in db, "categories 字段存在")
    check(db['metadata'].get('total_apis', 0) > 0, f"API数量 > 0 ({db['metadata'].get('total_apis', 0)})")
    check(db['metadata'].get('total_categories', 0) > 0, f"分类数量 > 0 ({db['metadata'].get('total_categories', 0)})")

    # 3. API数据质量
    print("\n🔍 API数据质量:")
    total = 0
    has_name = 0
    has_url = 0
    has_desc = 0
    has_quality = 0
    has_category_not_other = 0
    duplicate_ids = set()
    seen_ids = set()

    for cat in db['categories']:
        for api in cat['apis']:
            total += 1
            if api.get('name'): has_name += 1
            if api.get('url'): has_url += 1
            if api.get('description') and len(api['description']) > 5: has_desc += 1
            if api.get('quality_grade'): has_quality += 1
            if api.get('category') != 'other': has_category_not_other += 1

            # 检查重复ID
            aid = api.get('id')
            if aid in seen_ids:
                duplicate_ids.add(aid)
            seen_ids.add(aid)

    check(len(duplicate_ids) == 0, f"无重复ID (发现 {len(duplicate_ids)} 个)")
    check(has_name == total, f"所有API有名称 ({has_name}/{total})")
    check(has_url / total > 0.95, f"URL覆盖率 > 95% ({has_url/total*100:.1f}%)", 'warning' if has_url/total <= 0.95 else 'error')
    check(has_desc / total > 0.5, f"描述覆盖率 > 50% ({has_desc/total*100:.1f}%)", 'warning' if has_desc/total <= 0.5 else 'error')
    check(has_quality == total, f"所有API有质量评分 ({has_quality}/{total})")
    check(has_category_not_other / total > 0.9, f"非Other分类 > 90% ({has_category_not_other/total*100:.1f}%)", 'warning' if has_category_not_other/total <= 0.9 else 'error')

    # 4. 搜索索引
    print("\n🔎 搜索索引:")
    with open(INDEX_PATH) as f:
        idx = json.load(f)

    check(len(idx) == total, f"索引数量匹配 ({len(idx)} == {total})")

    # 检测索引格式
    uses_short_keys = len(idx) > 0 and 'i' in idx[0]
    if uses_short_keys:
        print("  📝 索引格式: 紧凑格式 (短字段名)")
        has_search_text = sum(1 for i in idx if i.get('t'))
        check(has_search_text == len(idx), f"所有索引有搜索文本 ({has_search_text}/{len(idx)})")
    else:
        print("  📝 索引格式: 标准格式")
        has_search_text = sum(1 for i in idx if i.get('_search_text'))
        check(has_search_text == len(idx), f"所有索引有搜索文本 ({has_search_text}/{len(idx)})")

    # 5. 分类文件
    print("\n📂 分类文件:")
    cat_ids = {c['id'] for c in db['categories']}
    missing_files = []
    for cid in cat_ids:
        fpath = os.path.join(APIS_DIR, f"{cid}.json")
        if not os.path.exists(fpath):
            missing_files.append(cid)
    check(len(missing_files) == 0, f"所有分类文件存在 (缺失: {missing_files[:5]}...)" if missing_files else "所有分类文件存在")

    # 6. 搜索功能测试
    print("\n🧪 搜索功能测试:")
    test_queries = ['weather', 'payment', 'openai', 'api']
    for q in test_queries:
        if uses_short_keys:
            results = [i for i in idx if q in i.get('t', '')]
        else:
            results = [i for i in idx if q in i.get('_search_text', '')]
        check(len(results) > 0, f"搜索 '{q}' 有结果 ({len(results)}个)")

    # 7. 性能测试
    print("\n⚡ 性能测试:")
    # 加载时间
    start = time.time()
    with open(DB_PATH) as f:
        json.load(f)
    db_load = (time.time() - start) * 1000

    start = time.time()
    with open(INDEX_PATH) as f:
        json.load(f)
    idx_load = (time.time() - start) * 1000

    print(f"  📊 数据库加载: {db_load:.1f} ms")
    print(f"  📊 索引加载: {idx_load:.1f} ms")
    check(db_load < 500, "数据库加载 < 500ms", 'warning')
    check(idx_load < 200, "索引加载 < 200ms", 'warning')

    # 总结
    elapsed = time.time() - start_time
    print(f"\n{'='*50}")
    if errors:
        print(f"  ❌ {len(errors)} 个错误, {len(warnings)} 个警告")
        print(f"  ⏱️ 验证耗时: {elapsed:.2f}s")
        sys.exit(1)
    elif warnings:
        print(f"  ⚠️ {len(warnings)} 个警告, 验证通过")
        print(f"  ⏱️ 验证耗时: {elapsed:.2f}s")
    else:
        print("  ✅ 全部验证通过！")
        print(f"  ⏱️ 验证耗时: {elapsed:.2f}s")
    print(f"{'='*50}")

if __name__ == '__main__':
    main()
