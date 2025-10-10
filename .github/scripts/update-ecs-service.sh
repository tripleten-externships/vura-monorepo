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

if [ -z "$SERVICE_NAME" ]; then
  echo "Error: SERVICE_NAME environment variable is not set"
  exit 1
fi

echo "Updating ECS service..."
echo "Using cluster: $CLUSTER_NAME"
echo "Using service: $SERVICE_NAME" 
echo "Using task definition family: $TASK_DEF_FAMILY"
          
# Update service
aws ecs update-service \
  --cluster $CLUSTER_NAME \
  --service $SERVICE_NAME \
  --task-definition $TASK_DEF_FAMILY \
  --force-new-deployment \
  --region $AWS_REGION

echo "ECS service update completed successfully!"
