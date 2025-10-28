#!/bin/bash

# Docker Deployment Script for Real-Time Team Chat
# This script helps deploy the application using Docker Compose

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    print_info "Docker is installed ✓"
}

# Check if ports are available
check_ports() {
    print_info "Checking if ports are available..."
    
    if lsof -Pi :80 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        print_warning "Port 80 is already in use"
    fi
    
    if lsof -Pi :4000 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        print_warning "Port 4000 is already in use"
    fi
    
    if lsof -Pi :27017 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        print_warning "Port 27017 (MongoDB) is already in use"
    fi
}

# Build and start services
deploy() {
    print_info "Building and starting Docker containers..."
    
    # Check if docker-compose or docker compose command exists
    if command -v docker-compose &> /dev/null; then
        COMPOSE_CMD="docker-compose"
    else
        COMPOSE_CMD="docker compose"
    fi
    
    $COMPOSE_CMD up -d --build
    
    print_info "Waiting for services to be ready..."
    sleep 5
    
    print_info "Checking service status..."
    $COMPOSE_CMD ps
    
    print_info ""
    print_info "🚀 Deployment complete!"
    print_info ""
    print_info "Services are now running:"
    print_info "  - Frontend:  http://localhost"
    print_info "  - Backend:   http://localhost:4000"
    print_info "  - MongoDB:   localhost:27017"
    print_info ""
    print_info "To view logs: docker-compose logs -f"
    print_info "To stop: docker-compose down"
}

# Stop services
stop() {
    print_info "Stopping Docker containers..."
    
    if command -v docker-compose &> /dev/null; then
        docker-compose down
    else
        docker compose down
    fi
    
    print_info "Services stopped."
}

# Show logs
logs() {
    if command -v docker-compose &> /dev/null; then
        docker-compose logs -f "$@"
    else
        docker compose logs -f "$@"
    fi
}

# Main script
case "$1" in
    deploy)
        check_docker
        check_ports
        deploy
        ;;
    stop)
        stop
        ;;
    logs)
        logs "${@:2}"
        ;;
    restart)
        stop
        sleep 2
        check_docker
        deploy
        ;;
    *)
        echo "Usage: $0 {deploy|stop|logs|restart}"
        echo ""
        echo "Commands:"
        echo "  deploy    - Build and start all services"
        echo "  stop      - Stop all services"
        echo "  logs      - Show logs (optionally specify service)"
        echo "  restart   - Restart all services"
        exit 1
        ;;
esac


