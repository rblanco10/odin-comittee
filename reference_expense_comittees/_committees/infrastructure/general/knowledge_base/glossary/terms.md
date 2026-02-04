# Glossary of Terms

## AWS Services

**ACU (Aurora Capacity Unit)**: Unit of compute and memory capacity for Aurora Serverless. 1 ACU ≈ 2 GB RAM.

**ALB (Application Load Balancer)**: Layer 7 load balancer for HTTP/HTTPS traffic.

**ECR (Elastic Container Registry)**: Managed Docker container registry.

**ECS (Elastic Container Service)**: Container orchestration service.

**Fargate**: Serverless compute engine for containers - no EC2 management required.

**KMS (Key Management Service)**: Managed encryption key service.

**VPC (Virtual Private Cloud)**: Isolated virtual network in AWS.

**WAF (Web Application Firewall)**: Protects web applications from common exploits.

## Infrastructure Concepts

**CDK (Cloud Development Kit)**: IaC tool using programming languages (JS/TS/Python).

**CIDR**: Classless Inter-Domain Routing - IP address range notation (e.g., 10.0.0.0/16).

**NAT Gateway**: Enables private subnet resources to access internet.

**Security Group**: Virtual firewall for EC2/ECS instances.

**VPC Endpoint**: Private connection to AWS services within VPC.

## Elixir/Phoenix

**BEAM**: Erlang VM that runs Elixir code.

**OTP**: Open Telecom Platform - Erlang libraries and design patterns.

**LiveView**: Phoenix feature for real-time, server-rendered UIs.

**Oban**: Job processing library for Elixir.

**Ash Framework**: Data layer and resource modeling framework.

## Deployment

**Blue/Green**: Deployment strategy with two identical environments.

**Rolling Update**: Gradual replacement of old tasks with new.

**Circuit Breaker**: Auto-rollback mechanism on deployment failure.

**Zero-Downtime**: Deployment without service interruption.
