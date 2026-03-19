# Python Observability

OpenTelemetry-based observability for the Python SDK with OpenInference semantic conventions.

## ✨ Key Features

- 🔌 **Optional Configuration** - Enable stdout export via `AUTO_TRACES_STDOUT=true` (default: disabled)
- 🎯 **OpenInference Compatible** - Follows OpenInference semantic conventions for AI/LLM tracing
- 🔗 **Full Span Hierarchy** - Captures AG-UI.Server → Adapter → Framework → LLM/Tool spans
- 🚀 **Built-in Configuration API** - Simple `ConsoleTraceConfig()` / `OTLPTraceConfig()` setup
- 📊 **OTLP Export** - Works with Langfuse, Jaeger, and any OTLP-compatible backend
- ⚡ **Hybrid Mode** - Combine ENV console export with parameter OTLP export

---

## 🚀 Quick Start

### Option 1: Built-in Configuration (Recommended)

```python
from cloudbase_agent.server import AgentServiceApp
from cloudbase_agent.observability.server import ConsoleTraceConfig

app = AgentServiceApp(observability=ConsoleTraceConfig())
app.run(create_agent, port=8000)
```

### Option 2: AUTO_TRACES_STDOUT (Zero Code)

```bash
export AUTO_TRACES_STDOUT=true
python your_agent.py
```

### Option 3: OTLP Export (Langfuse, etc.)

```python
from cloudbase_agent.server import AgentServiceApp
from cloudbase_agent.observability.server import OTLPTraceConfig

app = AgentServiceApp(
    observability=OTLPTraceConfig(
        url="https://cloud.langfuse.com/api/public/otlp/v1/traces",
        headers={"Authorization": "Basic <credentials>"}
    )
)
app.run(create_agent, port=8000)
```

### Option 4: Hybrid (ENV Console + Parameter OTLP)

```python
import os
os.environ["AUTO_TRACES_STDOUT"] = "true"  # Console from ENV

from cloudbase_agent.server import AgentServiceApp
from cloudbase_agent.observability.server import OTLPTraceConfig

app = AgentServiceApp(
    observability=OTLPTraceConfig(url="...")
)
# Both console (from ENV) and OTLP (from param) receive traces!
app.run(create_agent, port=8000)
```

---

## 📦 Installation

```bash
# Install observability package
pip install cloudbase-agent-observability

# Or with adapter
pip install cloudbase-agent-langgraph[observability]
pip install cloudbase-agent-crewai[observability]
```

---

## 🛠️ Configuration API

### Configuration Types

| Type | Description |
|------|-------------|
| `ConsoleTraceConfig()` | Export to stdout (JSON format) |
| `OTLPTraceConfig(url=...)` | Export to OTLP backend |
| `CustomTraceConfig(setup=fn)` | Custom setup function |
| `BatchConfig()` | Batch processing options |

### ConsoleTraceConfig

```python
from cloudbase_agent.observability.server import ConsoleTraceConfig, BatchConfig

# Default console export
config = ConsoleTraceConfig()

# With custom batch settings
config = ConsoleTraceConfig(
    batch=BatchConfig(max_export_batch_size=200)
)
```

### OTLPTraceConfig

```python
from cloudbase_agent.observability.server import OTLPTraceConfig

config = OTLPTraceConfig(
    url="https://cloud.langfuse.com/api/public/otlp/v1/traces",
    headers={"Authorization": "Basic <credentials>"},
    timeout=10000,
)
```

### CustomTraceConfig

```python
from cloudbase_agent.observability.server import CustomTraceConfig

def my_setup():
    # Your custom OTel setup
    ...

config = CustomTraceConfig(setup=my_setup)
```

---

## 📋 Usage Examples

### LangGraph

```python
from cloudbase_agent.server import AgentServiceApp
from cloudbase_agent.langgraph import LangGraphAgent
from cloudbase_agent.observability.server import ConsoleTraceConfig

app = AgentServiceApp(observability=ConsoleTraceConfig())
app.run(lambda: {"agent": LangGraphAgent(graph=workflow.compile())}, port=8000)
```

### CrewAI

```python
import os
os.environ['CREWAI_DISABLE_TELEMETRY'] = 'true'  # Before CrewAI imports!

from cloudbase_agent.server import AgentServiceApp
from cloudbase_agent.crewai import CrewAIAgent
from cloudbase_agent.observability.server import ConsoleTraceConfig

app = AgentServiceApp(observability=ConsoleTraceConfig())
app.run(create_agent, port=8000)
```

---

## 🔧 Advanced: Manual TracerProvider

For advanced use cases requiring custom TracerProvider:

```python
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import ConsoleSpanExporter, BatchSpanProcessor
from opentelemetry.sdk.resources import Resource

resource = Resource.create({"service.name": "my-app"})
provider = TracerProvider(resource=resource)
provider.add_span_processor(BatchSpanProcessor(ConsoleSpanExporter()))
trace.set_tracer_provider(provider)

app = AgentServiceApp()  # Will use your provider
app.run(create_agent, port=8000)
```

**Note:** This bypasses the built-in configuration API. Use only when necessary.

---

## 📊 Span Hierarchy Example

```
AG-UI.Server
  └─ Adapter.LangGraph
      └─ LangGraph
          ├─ node_a
          │   └─ ChatOpenAI
          └─ node_b
              └─ ChatOpenAI
```

---

## 🆚 Built-in vs Manual

| Aspect | Built-in API | Manual Setup |
|--------|--------------|--------------|
| Lines of code | 1-2 | 20+ |
| Type safety | ✅ | ❌ |
| Batch defaults | ✅ Optimized | ❌ Manual |
| Multiple exporters | ✅ Array | ❌ Complex |
| ENV support | ✅ AUTO_TRACES_STDOUT | ❌ |

**Migration:**

```python
# Before (Manual)
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import ConsoleSpanExporter, BatchSpanProcessor
from opentelemetry.sdk.resources import Resource

resource = Resource.create({"service.name": "my-app"})
provider = TracerProvider(resource=resource)
provider.add_span_processor(BatchSpanProcessor(ConsoleSpanExporter()))
trace.set_tracer_provider(provider)
app = AgentServiceApp()

# After (Built-in)
from cloudbase_agent.server import AgentServiceApp
from cloudbase_agent.observability.server import ConsoleTraceConfig

app = AgentServiceApp(observability=ConsoleTraceConfig())
```

---

## 🧪 Testing

```bash
# Run built-in config test
python examples/observability/langgraph_simple.py

# Parse span hierarchy
python examples/observability/langgraph_simple.py 2>&1 | \
    python examples/observability/parse_console_spans.py
```

---

## 📝 License

MIT
