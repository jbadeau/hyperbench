# ── Extensions ───────────────────────────────────────────────────────

load('ext://helm_resource', 'helm_resource', 'helm_repo')
load('ext://namespace', 'namespace_create')

# ── Safety ───────────────────────────────────────────────────────────

allow_k8s_contexts('kind-hyperbench')

# ── Namespaces ───────────────────────────────────────────────────────

for ns in ['hyperbench-operator', 'todos', 'clients', 'onboarding', 'dashboard', 'workbench']:
  namespace_create(ns)

# ── Docker Builds ────────────────────────────────────────────────────

# Shared files needed by all Node.js Dockerfiles (npm workspaces require every package.json for npm ci)
NODE_SHARED = [
  'package.json', 'package-lock.json',
  'hyperbench/hyperbench-shared/',
  'hyperbench/hyperbench-dashboard/package.json',
  'todos/todos/package.json',
  'clients/clients/package.json',
  'onboarding/onboarding/package.json',
]

# Operator (self-contained context)
docker_build(
  'hyperbench-operator',
  'hyperbench/hyperbench-operator',
  dockerfile='hyperbench/hyperbench-operator/Dockerfile',
  only=['cmd/', 'api/', 'internal/', 'go.mod', 'go.sum'],
)

# Dashboard
docker_build(
  'hyperbench-dashboard',
  '.',
  dockerfile='hyperbench/hyperbench-dashboard/Dockerfile',
  only=NODE_SHARED + ['hyperbench/hyperbench-dashboard/'],
)

# Node.js frontends
docker_build(
  'todos',
  '.',
  dockerfile='todos/todos/Dockerfile',
  only=NODE_SHARED + ['todos/todos/'],
)

docker_build(
  'clients',
  '.',
  dockerfile='clients/clients/Dockerfile',
  only=NODE_SHARED + ['clients/clients/'],
)

docker_build(
  'onboarding',
  '.',
  dockerfile='onboarding/onboarding/Dockerfile',
  only=NODE_SHARED + ['onboarding/onboarding/'],
)

# Shared files needed by all Spring Boot Dockerfiles (Maven multi-module requires every pom.xml)
MAVEN_SHARED = [
  'pom.xml',
  'hyperbench/hyperbench-shared-service/',
  'hyperbench/hyperbench-hal-schema-forms-service/',
  'todos/todos-service/pom.xml',
  'clients/clients-service/pom.xml',
  'onboarding/onboarding-service/pom.xml',
]

# Spring Boot APIs
docker_build(
  'todos-service',
  '.',
  dockerfile='todos/todos-service/Dockerfile',
  only=MAVEN_SHARED + ['todos/todos-service/'],
)

docker_build(
  'clients-service',
  '.',
  dockerfile='clients/clients-service/Dockerfile',
  only=MAVEN_SHARED + ['clients/clients-service/'],
)

docker_build(
  'onboarding-service',
  '.',
  dockerfile='onboarding/onboarding-service/Dockerfile',
  only=MAVEN_SHARED + ['onboarding/onboarding-service/'],
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
)

# Todos
helm_resource(
  'todos',
  './todos/todos-chart',
  namespace='todos',
  flags=['--set', 'frontend.imagePullPolicy=Never', '--set', 'api.imagePullPolicy=Never'],
  image_deps=['todos', 'todos-service'],
  image_keys=['frontend.image', 'api.image'],
)

# Clients
helm_resource(
  'clients',
  './clients/clients-chart',
  namespace='clients',
  flags=['--set', 'frontend.imagePullPolicy=Never', '--set', 'api.imagePullPolicy=Never'],
  image_deps=['clients', 'clients-service'],
  image_keys=['frontend.image', 'api.image'],
)

# Onboarding
helm_resource(
  'onboarding',
  './onboarding/onboarding-chart',
  namespace='onboarding',
  flags=['--set', 'frontend.imagePullPolicy=Never', '--set', 'api.imagePullPolicy=Never'],
  image_deps=['onboarding', 'onboarding-service'],
  image_keys=['frontend.image', 'api.image'],
)

# Dashboard
helm_resource(
  'dashboard',
  './hyperbench/hyperbench-dashboard-chart',
  namespace='dashboard',
  flags=['--set', 'imagePullPolicy=Never'],
  image_deps=['hyperbench-dashboard'],
  image_keys=['image'],
)

# Workbench CRs (no images — just custom resources)
helm_resource(
  'workbench',
  './workbench/workbench-chart',
  namespace='workbench',
)

# ── Port Forwards ────────────────────────────────────────────────────

k8s_resource('dashboard', port_forwards='3000:3000')
