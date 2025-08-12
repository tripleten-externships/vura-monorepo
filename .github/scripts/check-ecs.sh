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

if [ -z "$ECS_CLUSTER" ]; then
  echo "Error: ECS_CLUSTER environment variable is not set"
  exit 1
fi

if [ -z "$ECS_SERVICE" ]; then
  echo "Error: ECS_SERVICE environment variable is not set"
  exit 1
fi

if [ -z "$TASK_DEF_FAMILY" ]; then
  echo "Error: TASK_DEF_FAMILY environment variable is not set"
  exit 1
fi

echo "Checking ECS resources for environment: $ENVIRONMENT"
echo "Using AWS region: $AWS_REGION"

# Use the ECS resources from GitHub environment secrets
CLUSTER_NAME=$ECS_CLUSTER
SERVICE_NAME=$ECS_SERVICE

echo "Using ECS resources from GitHub environment secrets:"
echo "  Cluster: $CLUSTER_NAME"
echo "  Task Definition Family: $TASK_DEF_FAMILY"
echo "  Service: $SERVICE_NAME"

# Verify the resources actually exist
echo "Verifying ECS resources exist..."

# Check if cluster exists
aws ecs describe-clusters --cluster $CLUSTER_NAME --region $AWS_REGION >/dev/null 2>&1
if [ $? -ne 0 ]; then
  echo "Error: ECS cluster $CLUSTER_NAME does not exist"
  echo "ecs_exists=false" >> $GITHUB_OUTPUT
  exit 0
fi

# Check if task definition exists
aws ecs describe-task-definition --task-definition $TASK_DEF_FAMILY --region $AWS_REGION >/dev/null 2>&1
if [ $? -ne 0 ]; then
  echo "Error: ECS task definition $TASK_DEF_FAMILY does not exist"
  echo "ecs_exists=false" >> $GITHUB_OUTPUT
  exit 0
fi

# Check if service exists
aws ecs describe-services --cluster $CLUSTER_NAME --services $SERVICE_NAME --region $AWS_REGION >/dev/null 2>&1
if [ $? -ne 0 ]; then
  echo "Error: ECS service $SERVICE_NAME does not exist in cluster $CLUSTER_NAME"
  echo "ecs_exists=false" >> $GITHUB_OUTPUT
  exit 0
fi

echo "All ECS resources verified successfully!"
echo "ecs_exists=true" >> $GITHUB_OUTPUT
echo "cluster=$CLUSTER_NAME" >> $GITHUB_OUTPUT
echo "task_def_family=$TASK_DEF_FAMILY" >> $GITHUB_OUTPUT
echo "service_name=$SERVICE_NAME" >> $GITHUB_OUTPUT