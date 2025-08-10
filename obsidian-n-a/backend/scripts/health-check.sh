#!/bin/bash
# Health check script for deployed Azure backend
set -euo pipefail

# Configuration
APP_NAME="obsidian-backend"
RESOURCE_GROUP="ObsidianBackendRG"
BASE_URL="https://${APP_NAME}.azurewebsites.net"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Test health endpoint
test_health() {
    log_info "Testing health endpoint..."
    
    response=$(curl -s -w "%{http_code}" -o /tmp/health_response "$BASE_URL/health")
    
    if [[ "$response" == "200" ]]; then
        log_success "Health endpoint is responding correctly"
        cat /tmp/health_response | jq . 2>/dev/null || cat /tmp/health_response
    else
        log_error "Health endpoint failed with status $response"
        cat /tmp/health_response
        return 1
    fi
}

# Test API documentation
test_docs() {
    log_info "Testing API documentation..."
    
    response=$(curl -s -w "%{http_code}" -o /dev/null "$BASE_URL/docs")
    
    if [[ "$response" == "200" ]]; then
        log_success "API documentation is accessible at $BASE_URL/docs"
    else
        log_warning "API documentation might not be available (status: $response)"
    fi
}

# Test Azure App Service status
test_app_service_status() {
    log_info "Checking Azure App Service status..."
    
    if command -v az &> /dev/null; then
        status=$(az webapp show --name "$APP_NAME" --resource-group "$RESOURCE_GROUP" --query state -o tsv 2>/dev/null || echo "unknown")
        
        if [[ "$status" == "Running" ]]; then
            log_success "App Service is running"
        else
            log_warning "App Service status: $status"
        fi
        
        # Get app service URL
        url=$(az webapp show --name "$APP_NAME" --resource-group "$RESOURCE_GROUP" --query defaultHostName -o tsv 2>/dev/null || echo "unknown")
        log_info "App Service URL: https://$url"
        
        # Check recent deployments
        log_info "Recent deployments:"
        az webapp deployment list --name "$APP_NAME" --resource-group "$RESOURCE_GROUP" --query "[0:3].{status:status,time:receivedTime,id:id}" -o table 2>/dev/null || log_warning "Could not fetch deployment history"
        
    else
        log_warning "Azure CLI not found, skipping Azure-specific checks"
    fi
}

# Test response time
test_response_time() {
    log_info "Testing response time..."
    
    start_time=$(date +%s%3N)
    response=$(curl -s -w "%{http_code}" -o /dev/null "$BASE_URL/health")
    end_time=$(date +%s%3N)
    
    response_time=$((end_time - start_time))
    
    if [[ "$response" == "200" ]]; then
        if [[ $response_time -lt 2000 ]]; then
            log_success "Response time: ${response_time}ms (Good)"
        elif [[ $response_time -lt 5000 ]]; then
            log_warning "Response time: ${response_time}ms (Slow)"
        else
            log_error "Response time: ${response_time}ms (Too slow)"
        fi
    else
        log_error "Failed to get response time (HTTP $response)"
    fi
}

# Test SSL certificate
test_ssl() {
    log_info "Testing SSL certificate..."
    
    if command -v openssl &> /dev/null; then
        cert_info=$(echo | openssl s_client -connect "${APP_NAME}.azurewebsites.net:443" -servername "${APP_NAME}.azurewebsites.net" 2>/dev/null | openssl x509 -noout -dates 2>/dev/null)
        
        if [[ -n "$cert_info" ]]; then
            log_success "SSL certificate is valid"
            echo "$cert_info"
        else
            log_warning "Could not verify SSL certificate"
        fi
    else
        log_warning "OpenSSL not found, skipping SSL check"
    fi
}

# Main health check
main() {
    log_info "Starting health check for $BASE_URL"
    echo "=================================================="
    
    test_health || exit 1
    test_docs
    test_app_service_status
    test_response_time
    test_ssl
    
    echo "=================================================="
    log_success "Health check completed successfully!"
    
    log_info "Next steps:"
    echo "1. Test your plugin connectivity with the backend"
    echo "2. Monitor logs: az webapp log tail --name $APP_NAME --resource-group $RESOURCE_GROUP"
    echo "3. Configure your API keys and test full functionality"
}

# Run main function
main "$@"