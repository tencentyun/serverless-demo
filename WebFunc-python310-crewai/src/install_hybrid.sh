#!/bin/bash
set -e

echo "=== 安装 crewai-python 依赖（SCF Linux 兼容版）==="

# 清空并重建 env 目录
rm -rf env
mkdir -p env

# 检查 requirements.txt 是否存在
if [ ! -f "requirements.txt" ]; then
    echo "[错误] requirements.txt 文件不存在"
    exit 1
fi

echo ""
echo "步骤 1: 从 requirements.txt 读取主要依赖并安装（Linux 平台）..."
# 读取 requirements.txt，排除 pysqlite3-binary 和 async_timeout（纯 Python 包）
MAIN_DEPS=$(grep -E "^[a-zA-Z0-9_-]+[>=<]" requirements.txt | grep -v "pysqlite3-binary" | grep -v "async_timeout" | tr '\n' ' ')

python3 -m pip install \
    $MAIN_DEPS \
    numpy \
    --platform manylinux_2_17_x86_64 \
    --target ./env \
    --python-version 3.10 \
    --only-binary=:all: \
    --upgrade \
    --no-deps

echo ""
echo "步骤 2: 安装 pysqlite3-binary（Linux 平台）..."
PYSQLITE_VERSION=$(grep "pysqlite3-binary" requirements.txt | cut -d'=' -f3)
python3 -m pip install \
    pysqlite3-binary==${PYSQLITE_VERSION} \
    --platform manylinux_2_17_x86_64 \
    --target ./env \
    --python-version 3.10 \
    --only-binary=:all: \
    --upgrade \
    --no-deps

echo ""
echo "步骤 3: 补充安装所有传递依赖（允许纯 Python 包在本地平台安装）..."
# 创建临时 requirements（排除 pysqlite3-binary 和 async_timeout）
grep -E "^[a-zA-Z0-9_-]+[>=<]" requirements.txt | grep -v "pysqlite3-binary" | grep -v "async_timeout" > /tmp/crewai_deps_temp.txt

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
ASYNC_TIMEOUT_SPEC=$(grep "async_timeout" requirements.txt | tr -d ' ')
python3 -m pip install \
    exceptiongroup \
    lazy-loader \
    "${ASYNC_TIMEOUT_SPEC}" \
    --target ./env \
    --upgrade \
    --no-deps

echo ""
echo "步骤 6: 清理非 Linux 平台的二进制文件..."
# 清理可能存在的本地平台二进制文件（darwin/win32）
NON_LINUX_FILES=$(find env -name "*darwin.so" -o -name "*darwin.dylib" -o -name "*.pyd" 2>/dev/null)
if [ -n "$NON_LINUX_FILES" ]; then
    echo "$NON_LINUX_FILES" | while read file; do
        echo "  删除: $file"
        rm -f "$file"
    done
    echo "[完成] 已删除本地平台二进制文件"
else
    echo "[完成] 没有需要清理的本地平台二进制文件"
fi

echo ""
echo "=== 完成 ==="
echo "已安装的包数量: $(ls -1 env | wc -l)"
echo ""
echo "验证关键包:"
echo "- pydantic_core (.so): $(file env/pydantic_core/_pydantic_core*.so 2>/dev/null | grep -c 'ELF' || echo '[失败]')"
echo "- numpy (.so): $(file env/numpy/_core/_multiarray_umath*.so 2>/dev/null | grep -c 'ELF' || echo '[失败]')"
echo "- rpds-py (.so): $(file env/rpds/rpds*.so 2>/dev/null | grep -c 'ELF' || echo '[失败]')"
echo "- orjson (.so): $(file env/orjson/orjson*.so 2>/dev/null | grep -c 'ELF' || echo '[失败]')"
echo "- pysqlite3: $(ls env | grep -c 'pysqlite3' || echo '[失败]')"
echo "- exceptiongroup: $(ls env | grep -c '^exceptiongroup$' || echo '[失败]')"
echo "- crewai: $(ls env | grep -c '^crewai$' || echo '[失败]')"
echo ""
echo "检查是否还有非 Linux 二进制文件（应该为 0）:"
NON_LINUX_COUNT=$(find env \( -name "*darwin.so" -o -name "*.pyd" \) 2>/dev/null | wc -l | tr -d ' ')
if [ "$NON_LINUX_COUNT" -eq 0 ]; then
    echo "[完成] 没有非 Linux 二进制文件"
else
    echo "[警告] 还有 $NON_LINUX_COUNT 个非 Linux 二进制文件"
    find env \( -name "*darwin.so" -o -name "*.pyd" \) 2>/dev/null | head -5
fi
echo ""
echo "[完成] 可以部署到 SCF 了！"
