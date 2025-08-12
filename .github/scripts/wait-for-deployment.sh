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

if [ -z "$SERVICE_NAME" ]; then
  echo "Error: SERVICE_NAME environment variable is not set"
  exit 1
fi

echo "Waiting for deployment to complete..."
echo "Monitoring deployment in cluster: $CLUSTER_NAME"
echo "Monitoring service: $SERVICE_NAME"

# Wait for service to stabilize
echo "Waiting for ECS service to reach a steady state..."
aws ecs wait services-stable \
  --cluster $CLUSTER_NAME \
  --services $SERVICE_NAME \
  --region $AWS_REGION

if [ $? -eq 0 ]; then
  echo "Deployment completed successfully!"
else
  echo "Deployment failed or timed out"
  
  # Get service status for debugging
  echo "Current service status:"
  aws ecs describe-services \
    --cluster $CLUSTER_NAME \
    --services $SERVICE_NAME \
    --region $AWS_REGION \
    --query 'services[0].{Status:status,RunningCount:runningCount,DesiredCount:desiredCount,Events:events[0:3]}' \
    --output table
  
  exit 1
fi

echo "Deployment monitoring completed successfully!"