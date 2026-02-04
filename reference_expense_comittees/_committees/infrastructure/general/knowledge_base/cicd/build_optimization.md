# Build Optimization

## Source
`.gitlab-ci.yml`, analysis of build process

## Current Build Process
```yaml
build:
  stage: build
  script:
    - docker build -t $IMAGE_NAME:$IMAGE_TAG .
```

## Optimization Opportunities

### 1. Layer Caching
```dockerfile
# Current: Single stage, no explicit caching
# Improved: Multi-stage with cache mounts
FROM elixir:1.15 AS deps
COPY mix.exs mix.lock ./
RUN --mount=type=cache,target=/root/.hex \
    --mount=type=cache,target=/root/.mix \
    mix deps.get --only prod
```

### 2. GitLab Cache
```yaml
build:
  cache:
    key: ${CI_COMMIT_REF_SLUG}
    paths:
      - deps/
      - _build/
```

### 3. Docker Buildx with Registry Cache
```yaml
build:
  script:
    - docker buildx build \
        --cache-from type=registry,ref=$ECR_REPO:buildcache \
        --cache-to type=registry,ref=$ECR_REPO:buildcache,mode=max \
        -t $IMAGE_NAME:$IMAGE_TAG .
```

### 4. Parallel Compilation
```dockerfile
ENV ERL_COMPILER_OPTIONS="[{:native, true}]"
ENV MIX_ENV=prod
RUN mix compile --force
```

## Expected Improvements
- **Layer caching**: 40-60% faster on unchanged deps
- **Buildx cache**: 30-50% faster on incremental builds
- **Parallel compilation**: 20-30% faster compile
