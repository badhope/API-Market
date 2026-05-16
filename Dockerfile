# ========================================
# API-Market Docker 镜像
# ========================================

FROM python:3.11-slim

# 标签信息
LABEL maintainer="API-Market Team"
LABEL description="全网规模化公开API集合"
LABEL version="4.0.0"

# 工作目录
WORKDIR /app

# 安装系统依赖
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# 复制依赖文件
COPY scripts/requirements.txt ./scripts/

# 安装 Python 依赖
RUN pip install --no-cache-dir -r scripts/requirements.txt

# 复制项目文件
COPY . .

# 暴露端口
EXPOSE 8080

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/api/health || exit 1

# 启动命令
CMD ["python3", "server.py"]
