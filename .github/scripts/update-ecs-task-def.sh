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

if [ -z "$ECR_REGISTRY" ]; then
  echo "Error: ECR_REGISTRY environment variable is not set"
  exit 1
fi

if [ -z "$ECR_REPOSITORY" ]; then
  echo "Error: ECR_REPOSITORY environment variable is not set"
  exit 1
fi

if [ -z "$IMAGE_TAG" ]; then
  echo "Error: IMAGE_TAG environment variable is not set"
  exit 1
fi

if [ -z "$TASK_DEF_FAMILY" ]; then
  echo "Error: TASK_DEF_FAMILY environment variable is not set"
  exit 1
fi

echo "Updating ECS task definition..."
          
# Use the task definition family from the workflow
echo "Using task definition family: $TASK_DEF_FAMILY"
          
# Get current task definition
TASK_DEFINITION=$(aws ecs describe-task-definition --task-definition $TASK_DEF_FAMILY --region $AWS_REGION --query 'taskDefinition' --output json)
          
# Update container image
TASK_DEFINITION=$(echo $TASK_DEFINITION | jq --arg IMAGE "$ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG" '.containerDefinitions[0].image = $IMAGE')
          
# Update port mappings
TASK_DEFINITION=$(echo $TASK_DEFINITION | jq '.containerDefinitions[0].portMappings = [{"containerPort":80,"hostPort":80,"protocol":"tcp"}]')
          
# Update environment variables
TASK_DEFINITION=$(echo $TASK_DEFINITION | jq '.containerDefinitions[0].environment = [
  {"name": "NODE_ENV", "value": "production"},
  {"name": "DATABASE_URL", "value": "'$DATABASE_URL'"},
  {"name": "SHADOW_DATABASE_URL", "value": "'$SHADOW_DATABASE_URL'"},
  {"name": "DB_USERNAME", "value": "'$DB_USERNAME'"},
  {"name": "DB_PASSWORD", "value": "'$DB_PASSWORD'"},
  {"name": "DB_HOST", "value": "'$DB_HOST'"},
  {"name": "DB_NAME", "value": "'$DB_NAME'"},
  {"name": "DB_PORT", "value": "'$DB_PORT'"},
  {"name": "PORT", "value": "80"}
]')
          
# Remove fields that can't be updated
TASK_DEFINITION=$(echo $TASK_DEFINITION | jq 'del(.taskDefinitionArn, .revision, .status, .requiresAttributes, .compatibilities, .registeredAt, .registeredBy)')
          
# Register new task definition
echo "Registering new task definition..."
echo "$TASK_DEFINITION" | jq '.'
aws ecs register-task-definition --cli-input-json "$TASK_DEFINITION" --region $AWS_REGION

echo "ECS task definition update completed successfully!"
