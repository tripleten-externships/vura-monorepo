#!/bin/bash

# Validate required environment variables
if [ -z "$AWS_REGION" ]; then
  echo "Error: AWS_REGION environment variable is not set"
  exit 1
fi

if [ -z "$ENVIRONMENT" ]; then
  echo "Error: ENVIRONMENT environment variable is not set"
  exit 1
fi

if [ -z "$CLUSTER_NAME" ]; then
  echo "Error: CLUSTER_NAME environment variable is not set"
  exit 1
fi

echo "Waiting for deployment to complete..."
          
# Use the cluster from the workflow
echo "Waiting for deployment in cluster: $CLUSTER_NAME"
          
# List services in the cluster
SERVICES=$(aws ecs list-services --cluster $CLUSTER_NAME --region $AWS_REGION --query 'serviceArns[]' --output text)
echo "Available services: $SERVICES"

# Find environment-specific service
ENVIRONMENT_SERVICE=""
if [ "$ENVIRONMENT" = "production" ]; then
  # For production, look for a service with 'prod' or 'production' in the name
  for service in $SERVICES; do
    if [[ $service == *"prod"* ]] || [[ $service == *"production"* ]]; then
      ENVIRONMENT_SERVICE=$service
      break
    fi
  done
else
  # For staging, look for a service with 'staging' in the name (exact logic from original)
  for service in $SERVICES; do
    if [[ $service == *"staging"* ]]; then
      ENVIRONMENT_SERVICE=$service
      break
    fi
  done
fi

if [ -z "$ENVIRONMENT_SERVICE" ]; then
  echo "Error: Could not find $ENVIRONMENT service in cluster"
  exit 1
fi

SERVICE_NAME=$(echo $ENVIRONMENT_SERVICE | cut -d'/' -f3)
echo "Waiting for service: $SERVICE_NAME"
          
# Wait for the service to be stable
aws ecs wait services-stable \
  --cluster $CLUSTER_NAME \
  --services $SERVICE_NAME \
  --region $AWS_REGION
          
echo "Deployment completed successfully!" 