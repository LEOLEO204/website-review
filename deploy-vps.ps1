# VPS Deployment Script for ReviewSmart Clone
# Please configure your VPS details below

$VPS_IP = "YOUR_VPS_IP"       # Replace with your VPS IP (e.g., "123.45.67.89")
$SSH_USER = "root"            # Replace with your SSH username (e.g., "root" or "ubuntu")
$SSH_PORT = 22                # Replace with SSH port if not 22
$TARGET_DIR = "/var/www/review_tot_system_com" # Target folder on VPS
$SSH_KEY_PATH = ""            # Optional: Path to private key (e.g., "~/.ssh/id_rsa")

# --- Do not modify below this line ---

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "1. Building the React App..." -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Error "Build failed! Deployment aborted."
    exit
}

Write-Host "`n==========================================" -ForegroundColor Cyan
Write-Host "2. Preparing target directory on VPS..." -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# Construct base SSH command parameters
$ssh_args = @()
if ($SSH_KEY_PATH) {
    $ssh_args += "-i", $SSH_KEY_PATH
}
$ssh_args += "-p", $SSH_PORT
$ssh_args += "$SSH_USER@$VPS_IP"

# Create directories and fix permissions
$remote_cmd = "sudo mkdir -p $TARGET_DIR && sudo chown -R $SSH_USER:$SSH_USER $TARGET_DIR"
ssh @ssh_args $remote_cmd

if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to connect to VPS or create target directory!"
    exit
}

Write-Host "`n==========================================" -ForegroundColor Cyan
Write-Host "3. Uploading build files to VPS..." -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

$scp_args = @()
if ($SSH_KEY_PATH) {
    $scp_args += "-i", $SSH_KEY_PATH
}
$scp_args += "-P", $SSH_PORT
$scp_args += "-r"
$scp_args += "dist/*"
$scp_args += "$SSH_USER@$VPS_IP`:$TARGET_DIR"

scp @scp_args

if ($LASTEXITCODE -ne 0) {
    Write-Error "File upload failed!"
    exit
}

Write-Host "`n==========================================" -ForegroundColor Green
Write-Host "Deployment completed successfully!" -ForegroundColor Green
Write-Host "Don't forget to configure Nginx on your VPS to point review.tot.system.com to $TARGET_DIR" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Green
