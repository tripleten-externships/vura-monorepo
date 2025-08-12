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

if [ -z "$TASK_DEF_FAMILY" ]; then
  echo "Error: TASK_DEF_FAMILY environment variable is not set"
  exit 1
fi

echo "Updating ECS service..."
          
# Use the cluster and task definition family from the workflow
echo "Using cluster: $CLUSTER_NAME"
echo "Using task definition family: $TASK_DEF_FAMILY"
          
# List services in the cluster
echo "Finding service in cluster $CLUSTER_NAME..."
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
          
# Extract just the service name from the full ARN
SERVICE_NAME=$(echo $ENVIRONMENT_SERVICE | cut -d'/' -f3)
echo "Found service name: $SERVICE_NAME"
          
# Update service
aws ecs update-service \
  --cluster $CLUSTER_NAME \
  --service $SERVICE_NAME \
  --task-definition $TASK_DEF_FAMILY \
  --force-new-deployment \
  --region $AWS_REGION

echo "ECS service update completed successfully!"
