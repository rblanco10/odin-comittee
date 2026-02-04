# Tempo Configuration

## Source
`infrastructure/lib/stacks/monitoring-stack.js`

## Deployment
```javascript
// Fargate task
cpu: 256,
memory: 512,
image: 'grafana/tempo:2.1.0'
```

## Purpose
- Distributed tracing backend
- OpenTelemetry/Jaeger receiver
- Trace correlation with logs/metrics

## Integration Points
1. **Application**: Send traces via OpenTelemetry
2. **Grafana**: Query and visualize traces
3. **Loki**: Correlate traces with logs

## Configuration
```yaml
# tempo.yaml
receivers:
  otlp:
    protocols:
      grpc:
        endpoint: 0.0.0.0:4317
      http:
        endpoint: 0.0.0.0:4318
```

## Phoenix/Elixir Integration
```elixir
# deps
{:opentelemetry_api, "~> 1.2"},
{:opentelemetry_exporter, "~> 1.4"},
{:opentelemetry_phoenix, "~> 1.1"}
```

## Action Required
- Add OpenTelemetry to Phoenix application
- Configure trace sampling rate
- Create trace-to-log correlation
