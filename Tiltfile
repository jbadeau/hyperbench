# ── Extensions ───────────────────────────────────────────────────────

load('ext://helm_resource', 'helm_resource', 'helm_repo')
load('ext://namespace', 'namespace_create')

# ── Safety ───────────────────────────────────────────────────────────

allow_k8s_contexts('kind-hyperbench')

# ── Namespaces ───────────────────────────────────────────────────────

for ns in ['hyperbench-operator', 'todos', 'clients', 'onboarding', 'dashboard', 'workbench']:
  namespace_create(ns)

# ── Local Builds ─────────────────────────────────────────────────────

local_resource(
  'npm-install',
  'npm install',
  deps=['package.json', 'package-lock.json'],
)

local_resource(
  'build-hyperbench-shared',
  'npm run build --workspace=hyperbench/hyperbench-shared',
  deps=['hyperbench/hyperbench-shared/src/'],
  resource_deps=['npm-install'],
)

local_resource(
  'build-dashboard',
  'npm run build --workspace=hyperbench/hyperbench-dashboard',
  deps=['hyperbench/hyperbench-dashboard/src/'],
  resource_deps=['build-hyperbench-shared'],
)

local_resource(
  'build-todos-frontend',
  'npm run build --workspace=todos/todos',
  deps=['todos/todos/src/'],
  resource_deps=['build-hyperbench-shared'],
)

local_resource(
  'build-clients-frontend',
  'npm run build --workspace=clients/clients',
  deps=['clients/clients/src/'],
  resource_deps=['build-hyperbench-shared'],
)

local_resource(
  'build-onboarding-frontend',
  'npm run build --workspace=onboarding/onboarding',
  deps=['onboarding/onboarding/src/'],
  resource_deps=['build-hyperbench-shared'],
)

local_resource(
  'build-mvn',
  'mvn clean package -DskipTests',
  deps=[
    'pom.xml',
    'hyperbench/hyperbench-shared-service/src/',
    'hyperbench/hyperbench-hal-schema-forms-service/src/',
    'todos/todos-service/src/',
    'clients/clients-service/src/',
    'onboarding/onboarding-service/src/',
  ],
)

local_resource(
  'build-operator',
  'cd hyperbench/hyperbench-operator && make manifests generate && CGO_ENABLED=0 GOOS=linux go build -a -o bin/manager cmd/main.go',
  deps=[
    'hyperbench/hyperbench-operator/cmd/',
    'hyperbench/hyperbench-operator/api/',
    'hyperbench/hyperbench-operator/internal/',
    'hyperbench/hyperbench-operator/go.mod',
    'hyperbench/hyperbench-operator/go.sum',
  ],
)

# ── Docker Builds ────────────────────────────────────────────────────

# Operator (self-contained context)
docker_build(
  'hyperbench-operator',
  'hyperbench/hyperbench-operator',
  dockerfile='hyperbench/hyperbench-operator/Dockerfile',
  only=['bin/'],
)

# Dashboard
docker_build(
  'hyperbench-dashboard',
  '.',
  dockerfile='hyperbench/hyperbench-dashboard/Dockerfile',
  only=[
    'node_modules/',
    'hyperbench/hyperbench-shared/',
    'hyperbench/hyperbench-dashboard/',
  ],
)

# Node.js frontends
docker_build(
  'todos',
  '.',
  dockerfile='todos/todos/Dockerfile',
  only=[
    'node_modules/',
    'hyperbench/hyperbench-shared/',
    'todos/todos/',
  ],
)

docker_build(
  'clients',
  '.',
  dockerfile='clients/clients/Dockerfile',
  only=[
    'node_modules/',
    'hyperbench/hyperbench-shared/',
    'clients/clients/',
  ],
)

docker_build(
  'onboarding',
  '.',
  dockerfile='onboarding/onboarding/Dockerfile',
  only=[
    'node_modules/',
    'hyperbench/hyperbench-shared/',
    'onboarding/onboarding/',
  ],
)

# Spring Boot APIs
docker_build(
  'todos-service',
  '.',
  dockerfile='todos/todos-service/Dockerfile',
  only=['todos/todos-service/target/'],
)

docker_build(
  'clients-service',
  '.',
  dockerfile='clients/clients-service/Dockerfile',
  only=['clients/clients-service/target/'],
)

docker_build(
  'onboarding-service',
  '.',
  dockerfile='onboarding/onboarding-service/Dockerfile',
  only=['onboarding/onboarding-service/target/'],
)

# ── Helm Releases ────────────────────────────────────────────────────

# Operator
helm_resource(
  'hyperbench-operator',
  './hyperbench/hyperbench-operator-chart',
  namespace='hyperbench-operator',
  flags=['--set', 'imagePullPolicy=Never'],
  image_deps=['hyperbench-operator'],
  image_keys=['image'],
  resource_deps=['build-operator'],
)

# Todos
helm_resource(
  'todos',
  './todos/todos-chart',
  namespace='todos',
  flags=['--set', 'frontend.imagePullPolicy=Never', '--set', 'api.imagePullPolicy=Never'],
  image_deps=['todos', 'todos-service'],
  image_keys=['frontend.image', 'api.image'],
  resource_deps=['build-todos-frontend', 'build-mvn'],
)

# Clients
helm_resource(
  'clients',
  './clients/clients-chart',
  namespace='clients',
  flags=['--set', 'frontend.imagePullPolicy=Never', '--set', 'api.imagePullPolicy=Never'],
  image_deps=['clients', 'clients-service'],
  image_keys=['frontend.image', 'api.image'],
  resource_deps=['build-clients-frontend', 'build-mvn'],
)

# Onboarding
helm_resource(
  'onboarding',
  './onboarding/onboarding-chart',
  namespace='onboarding',
  flags=['--set', 'frontend.imagePullPolicy=Never', '--set', 'api.imagePullPolicy=Never'],
  image_deps=['onboarding', 'onboarding-service'],
  image_keys=['frontend.image', 'api.image'],
  resource_deps=['build-onboarding-frontend', 'build-mvn'],
)

# Dashboard
helm_resource(
  'dashboard',
  './hyperbench/hyperbench-dashboard-chart',
  namespace='dashboard',
  flags=['--set', 'imagePullPolicy=Never'],
  image_deps=['hyperbench-dashboard'],
  image_keys=['image'],
  resource_deps=['build-dashboard'],
)

# Workbench CRs (no images — just custom resources)
helm_resource(
  'workbench',
  './workbench/workbench-chart',
  namespace='workbench',
)

# ── Port Forwards ────────────────────────────────────────────────────

k8s_resource('dashboard', port_forwards='3000:3000')
