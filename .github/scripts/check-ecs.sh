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

echo "Checking for ECS resources in region: $AWS_REGION"
          
# List clusters and find environment-specific cluster
echo "Listing clusters..."
CLUSTERS=$(aws ecs list-clusters --region $AWS_REGION --query 'clusterArns' --output text)
echo "Available clusters: $CLUSTERS"
          
# Find environment-specific cluster
ENVIRONMENT_CLUSTER=""
if [ "$ENVIRONMENT" = "production" ]; then
  # For production, look for a cluster with 'prod' or 'production' in the name
  for cluster in $CLUSTERS; do
    if [[ $cluster == *"prod"* ]] || [[ $cluster == *"production"* ]]; then
      ENVIRONMENT_CLUSTER=$cluster
      break
    fi
  done
else
  # For staging, look for a cluster with 'staging' in the name (exact logic from original)
  for cluster in $CLUSTERS; do
    if [[ $cluster == *"staging"* ]]; then
      ENVIRONMENT_CLUSTER=$cluster
      break
    fi
  done
fi
          
if [ -z "$ENVIRONMENT_CLUSTER" ]; then
  echo "No $ENVIRONMENT cluster found!"
  echo "ecs_exists=false" >> $GITHUB_OUTPUT
  exit 0
fi
          
ENVIRONMENT_CLUSTER_NAME=$(echo $ENVIRONMENT_CLUSTER | cut -d'/' -f2)
echo "Found $ENVIRONMENT cluster: $ENVIRONMENT_CLUSTER_NAME"
          
# List task definitions and find environment-specific task definition
echo "Listing task definitions..."
TASK_DEFS=$(aws ecs list-task-definitions --region $AWS_REGION --query 'taskDefinitionArns' --output text)
echo "Available task definitions: $TASK_DEFS"
          
# Find environment-specific task definition
ENVIRONMENT_TASK_DEF=""
if [ "$ENVIRONMENT" = "production" ]; then
  # For production, look for a task definition with 'prod' or 'production' in the name
  for task_def in $TASK_DEFS; do
    if [[ $task_def == *"prod"* ]] || [[ $task_def == *"production"* ]]; then
      ENVIRONMENT_TASK_DEF=$task_def
      break
    fi
  done
else
  # For staging, look for a task definition with 'staging' in the name (exact logic from original)
  for task_def in $TASK_DEFS; do
    if [[ $task_def == *"staging"* ]]; then
      ENVIRONMENT_TASK_DEF=$task_def
      break
    fi
  done
fi
          
if [ -z "$ENVIRONMENT_TASK_DEF" ]; then
  echo "No $ENVIRONMENT task definition found!"
  echo "ecs_exists=false" >> $GITHUB_OUTPUT
  exit 0
fi
          
ENVIRONMENT_TASK_DEF_FAMILY=$(echo $ENVIRONMENT_TASK_DEF | cut -d'/' -f2 | cut -d':' -f1)
echo "Found $ENVIRONMENT task definition: $ENVIRONMENT_TASK_DEF_FAMILY"
          
# List services for the environment cluster
echo "Listing services for $ENVIRONMENT cluster: $ENVIRONMENT_CLUSTER_NAME"
SERVICES=$(aws ecs list-services --cluster $ENVIRONMENT_CLUSTER_NAME --region $AWS_REGION --query 'serviceArns' --output text)
echo "Available services: $SERVICES"
          
# Store the environment resources for next steps
echo "cluster=$ENVIRONMENT_CLUSTER_NAME" >> $GITHUB_OUTPUT
echo "task_def_family=$ENVIRONMENT_TASK_DEF_FAMILY" >> $GITHUB_OUTPUT
          
# Set output for next steps
if [ ! -z "$ENVIRONMENT_CLUSTER" ] && [ ! -z "$ENVIRONMENT_TASK_DEF" ]; then
  echo "ecs_exists=true" >> $GITHUB_OUTPUT
else
  echo "ecs_exists=false" >> $GITHUB_OUTPUT
fi
