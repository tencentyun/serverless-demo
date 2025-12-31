#!/bin/bash
set -e

echo "=== 安装 crewai-python 依赖（SCF Linux 兼容版）==="

# 清空并重建 env 目录
rm -rf env
mkdir -p env

echo ""
echo "步骤 1: 安装主要依赖（Linux 平台）..."
python3 -m pip install \
    fastapi==0.125.0 \
    cloudbase-agent-server==0.1.11 \
    cloudbase-agent-core==0.1.11 \
    cloudbase-agent-crewai==0.1.11 \
    crewai==1.7.2 \
    litellm==1.50.0 \
    openai==1.83.0 \
    python-dotenv==1.1.1 \
    numpy \
    --platform manylinux_2_17_x86_64 \
    --target ./env \
    --python-version 3.10 \
    --only-binary=:all: \
    --upgrade \
    --no-deps

echo ""
echo "步骤 2: 安装 pysqlite3-binary（Linux 平台）..."
python3 -m pip install \
    pysqlite3-binary==0.5.4 \
    --platform manylinux_2_17_x86_64 \
    --target ./env \
    --python-version 3.10 \
    --only-binary=:all: \
    --upgrade \
    --no-deps

echo ""
echo "步骤 3: 补充安装所有传递依赖（允许纯 Python 包在本地平台安装）..."
# 创建临时 requirements（排除 pysqlite3-binary）
cat > /tmp/crewai_deps_temp.txt << EOF
fastapi==0.125.0
cloudbase-agent-server==0.1.11
cloudbase-agent-core==0.1.11
cloudbase-agent-crewai==0.1.11
crewai==1.7.2
litellm==1.50.0
openai==1.83.0
python-dotenv==1.1.1
EOF

# 先安装传递依赖，允许重新检查已安装的包
python3 -m pip install \
    -r /tmp/crewai_deps_temp.txt \
    --target ./env \
    --upgrade \
    --force-reinstall \
    --no-binary pysqlite3-binary || echo "部分包已安装，继续..."

rm /tmp/crewai_deps_temp.txt

echo ""
echo "步骤 4: 强制安装所有 C/Rust 扩展包为 Linux 版本..."
echo "（这是最关键的步骤，确保所有二进制包与 SCF Linux 环境兼容）"
python3 -m pip install \
    pydantic \
    pydantic-core \
    numpy \
    Pillow \
    cffi \
    aiohttp \
    bcrypt \
    charset-normalizer \
    chromadb \
    cryptography \
    frozenlist \
    grpcio \
    hf-xet \
    httptools \
    jiter \
    MarkupSafe \
    mmh3 \
    multidict \
    onnxruntime \
    orjson \
    propcache \
    pybase64 \
    regex \
    rpds-py \
    tiktoken \
    tokenizers \
    uvloop \
    watchfiles \
    websockets \
    PyYAML \
    yarl \
    --platform manylinux_2_17_x86_64 \
    --target ./env \
    --python-version 3.10 \
    --only-binary=:all: \
    --upgrade \
    --force-reinstall \
    --no-deps

echo ""
echo "步骤 5: 补充纯 Python 传递依赖（不触碰已安装的 C 扩展包）..."
# 只安装缺失的纯 Python 包
python3 -m pip install \
    exceptiongroup \
    lazy-loader \
    --target ./env \
    --upgrade \
    --no-deps

echo ""
echo "步骤 6: 清理残留的 macOS .so 文件..."
DARWIN_FILES=$(find env -name "*darwin.so" -o -name "*darwin.dylib" 2>/dev/null)
if [ -n "$DARWIN_FILES" ]; then
    echo "$DARWIN_FILES" | while read file; do
        echo "  删除: $file"
        rm -f "$file"
    done
    echo "✅ 已删除 macOS 二进制文件"
else
    echo "✅ 没有 macOS 二进制文件"
fi

echo ""
echo "=== 完成 ==="
echo "已安装的包数量: $(ls -1 env | wc -l)"
echo ""
echo "验证关键包:"
echo "- pydantic_core (.so): $(file env/pydantic_core/_pydantic_core*.so 2>/dev/null | grep -c 'ELF' || echo '❌')"
echo "- numpy (.so): $(file env/numpy/_core/_multiarray_umath*.so 2>/dev/null | grep -c 'ELF' || echo '❌')"
echo "- rpds-py (.so): $(file env/rpds/rpds*.so 2>/dev/null | grep -c 'ELF' || echo '❌')"
echo "- orjson (.so): $(file env/orjson/orjson*.so 2>/dev/null | grep -c 'ELF' || echo '❌')"
echo "- pysqlite3: $(ls env | grep -c 'pysqlite3' || echo '❌')"
echo "- exceptiongroup: $(ls env | grep -c '^exceptiongroup$' || echo '❌')"
echo "- crewai: $(ls env | grep -c '^crewai$' || echo '❌')"
echo ""
echo "检查是否还有 macOS .so 文件（应该为 0）:"
DARWIN_COUNT=$(find env -name "*darwin.so" 2>/dev/null | wc -l | tr -d ' ')
if [ "$DARWIN_COUNT" -eq 0 ]; then
    echo "✅ 没有 macOS .so 文件"
else
    echo "⚠️  警告: 还有 $DARWIN_COUNT 个 macOS .so 文件"
    find env -name "*darwin.so" 2>/dev/null | head -5
fi
echo ""
echo "✅ 可以部署到 SCF 了！"
