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

if [ -z "$STACK_NAME" ]; then
  echo "Error: STACK_NAME environment variable is not set"
  exit 1
fi

echo "Checking ECS resources for environment: $ENVIRONMENT"
echo "Using CloudFormation stack: $STACK_NAME"
echo "Using AWS region: $AWS_REGION"

# Get ECS resources from CloudFormation stack outputs
echo "Getting ECS resources from CloudFormation stack outputs..."

# Get cluster name from stack outputs
CLUSTER_NAME=$(aws cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --region $AWS_REGION \
  --query 'Stacks[0].Outputs[?OutputKey==`ECSClusterName`].OutputValue' \
  --output text 2>/dev/null)

# Get task definition family from stack outputs  
TASK_DEF_FAMILY=$(aws cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --region $AWS_REGION \
  --query 'Stacks[0].Outputs[?OutputKey==`ECSTaskDefinitionFamily`].OutputValue' \
  --output text 2>/dev/null)

# Get service name from stack outputs
SERVICE_NAME=$(aws cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --region $AWS_REGION \
  --query 'Stacks[0].Outputs[?OutputKey==`ECSServiceName`].OutputValue' \
  --output text 2>/dev/null)

# Check if we got all required outputs
if [ -z "$CLUSTER_NAME" ] || [ -z "$TASK_DEF_FAMILY" ] || [ -z "$SERVICE_NAME" ]; then
  echo "Could not find all required ECS resources in CloudFormation stack outputs"
  echo "Available stack outputs:"
  aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $AWS_REGION \
    --query 'Stacks[0].Outputs[].{Key:OutputKey,Value:OutputValue}' \
    --output table 2>/dev/null || echo "Failed to get stack outputs"
  
  echo "Expected outputs: ECSClusterName, ECSTaskDefinitionFamily, ECSServiceName"
  echo "Found:"
  echo "  Cluster: $CLUSTER_NAME"
  echo "  Task Definition Family: $TASK_DEF_FAMILY"  
  echo "  Service: $SERVICE_NAME"
  echo "ecs_exists=false" >> $GITHUB_OUTPUT
  exit 0
fi

echo "Found ECS resources from CloudFormation stack:"
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