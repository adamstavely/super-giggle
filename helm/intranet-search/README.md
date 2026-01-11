# Intranet Search Helm Chart

This Helm chart deploys the intranet-search Angular application to a Kubernetes cluster.

## Prerequisites

- Kubernetes 1.19+
- Helm 3.0+
- Docker image for intranet-search application

## Installation

### Build the Docker image

First, build and push the Docker image:

```bash
docker build -t intranet-search:latest .
docker tag intranet-search:latest <your-registry>/intranet-search:latest
docker push <your-registry>/intranet-search:latest
```

### Install the chart

```bash
helm install intranet-search ./helm/intranet-search
```

### Install with custom values

```bash
helm install intranet-search ./helm/intranet-search -f my-values.yaml
```

## Configuration

The following table lists the configurable parameters and their default values:

| Parameter | Description | Default |
|-----------|-------------|---------|
| `replicaCount` | Number of replicas | `2` |
| `image.repository` | Image repository | `intranet-search` |
| `image.tag` | Image tag | `latest` |
| `image.pullPolicy` | Image pull policy | `IfNotPresent` |
| `service.type` | Service type | `ClusterIP` |
| `service.port` | Service port | `80` |
| `ingress.enabled` | Enable ingress | `true` |
| `ingress.className` | Ingress class name | `nginx` |
| `ingress.hosts[0].host` | Ingress host | `intranet-search.example.com` |
| `resources.limits.cpu` | CPU limit | `500m` |
| `resources.limits.memory` | Memory limit | `512Mi` |
| `resources.requests.cpu` | CPU request | `100m` |
| `resources.requests.memory` | Memory request | `128Mi` |
| `autoscaling.enabled` | Enable HPA | `true` |
| `autoscaling.minReplicas` | Minimum replicas | `2` |
| `autoscaling.maxReplicas` | Maximum replicas | `10` |
| `env.ELASTICSEARCH_ENDPOINT` | Elasticsearch endpoint | `https://elasticsearch.example.com` |
| `env.ELASTICSEARCH_INDEX` | Elasticsearch index | `intranet-search-logs` |

## Environment Variables

The application supports the following environment variables:

- `ELASTICSEARCH_ENDPOINT`: Elasticsearch server endpoint
- `ELASTICSEARCH_INDEX`: Elasticsearch index name
- `ELASTICSEARCH_API_KEY`: Elasticsearch API key (optional, use secrets)
- `ELASTICSEARCH_USERNAME`: Elasticsearch username (optional, use secrets)
- `ELASTICSEARCH_PASSWORD`: Elasticsearch password (optional, use secrets)

## Secrets

For sensitive data like Elasticsearch credentials, create a Kubernetes secret:

```bash
kubectl create secret generic intranet-search-secrets \
  --from-literal=elasticsearch-api-key='your-api-key' \
  --from-literal=elasticsearch-username='your-username' \
  --from-literal=elasticsearch-password='your-password'
```

Then reference it in your values.yaml:

```yaml
secrets:
  elasticsearch:
    apiKey: "elasticsearch-api-key"
    username: "elasticsearch-username"
    password: "elasticsearch-password"
```

## Upgrading

```bash
helm upgrade intranet-search ./helm/intranet-search
```

## Uninstalling

```bash
helm uninstall intranet-search
```

## Health Checks

The application includes a health check endpoint at `/health` that returns `200 OK` when the service is healthy.

## Notes

- The chart uses nginx to serve the Angular application
- All routes are handled by Angular's router (SPA routing)
- Static assets are cached for 1 year
- Gzip compression is enabled for text-based resources
