import os
import sys
import subprocess
import socket
import paramiko

VPS_IP = "103.142.26.189"
VPS_USER = "root"
VPS_PASS = "*?y?=8gFB4O="
DOMAIN = "review.totsystem.com"
TARGET_DIR = "/var/www/review_tot_system_com"

def run_local_build():
    print("==========================================")
    print("1. Building React application locally...")
    print("==========================================")
    try:
        # Run build command
        result = subprocess.run("npm run build", shell=True, check=True)
        if result.returncode == 0:
            print("Local build completed successfully!")
            return True
    except subprocess.CalledProcessError as e:
        print(f"Build failed: {e}")
        return False

def check_dns():
    print(f"\nChecking DNS for {DOMAIN}...")
    try:
        ip = socket.gethostbyname(DOMAIN)
        print(f"Domain {DOMAIN} resolved to {ip}")
        if ip == VPS_IP:
            print("DNS configuration is correct (points to this VPS).")
            return True
        else:
            print(f"Warning: Domain points to {ip}, expected {VPS_IP}.")
            return False
    except socket.gaierror:
        print(f"Warning: DNS query failed for {DOMAIN}. The domain is not pointed to any IP yet.")
        return False

def upload_directory_sftp(sftp, local_dir, remote_dir):
    # Ensure remote directory exists
    try:
        sftp.mkdir(remote_dir)
    except IOError:
        pass  # folder already exists
        
    for item in os.listdir(local_dir):
        if item in ('node_modules', 'database.sqlite', 'backups', 'logs') or item.endswith('.sqlite'):
            continue
        local_path = os.path.join(local_dir, item)
        remote_path = os.path.join(remote_dir, item).replace('\\', '/')
        if os.path.isdir(local_path):
            upload_directory_sftp(sftp, local_path, remote_path)
        else:
            print(f"Uploading {item}...")
            sftp.put(local_path, remote_path)

def deploy_to_vps():
    print("\n==========================================")
    print("2. Connecting to VPS and uploading files...")
    print("==========================================")
    
    # Initialize SSH Client
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        print(f"Connecting to {VPS_IP} via SSH as {VPS_USER}...")
        ssh.connect(VPS_IP, username=VPS_USER, password=VPS_PASS, timeout=15)
        print("Connected to VPS!")
        
        # 1. Create target directory and adjust permissions
        print(f"Ensuring remote directory {TARGET_DIR} exists...")
        ssh.exec_command(f"mkdir -p {TARGET_DIR}")
        
        # Clear existing files in the target directory to avoid stale assets, excluding server and uploads
        print("Cleaning target directory on VPS (excluding server and uploads)...")
        ssh.exec_command(f"find {TARGET_DIR} -mindepth 1 -maxdepth 1 ! -name 'server' ! -name 'uploads' -exec rm -rf {{}} +")
        
        # Ensure server directory exists
        print("Ensuring remote server directory exists...")
        ssh.exec_command(f"mkdir -p {TARGET_DIR}/server")

        # 2. Upload files using SFTP
        print("Uploading build files via SFTP...")
        sftp = ssh.open_sftp()
        upload_directory_sftp(sftp, "dist", TARGET_DIR)
        
        print("Uploading server backend files via SFTP...")
        upload_directory_sftp(sftp, "server", f"{TARGET_DIR}/server")
        sftp.close()
        print("File upload completed!")

        # Run npm install and restart node server on VPS
        print("Running npm install and restarting server via PM2...")
        stdin, stdout, stderr = ssh.exec_command(f"cd {TARGET_DIR}/server && npm install --production")
        stdout.channel.recv_exit_status()
        
        ssh.exec_command("pm2 restart reviewsmart-api")
        print("Backend server successfully restarted via PM2.")
        
        # 3. Setup Nginx
        print("\n==========================================")
        print("3. Configuring Nginx on VPS...")
        print("==========================================")
        
        # Check if Nginx is installed
        stdin, stdout, stderr = ssh.exec_command("nginx -v")
        exit_status = stdout.channel.recv_exit_status()
        
        if exit_status != 0:
            print("Nginx is not installed on VPS. Installing Nginx...")
            # Run apt updates and install Nginx
            stdin, stdout, stderr = ssh.exec_command("apt-get update && apt-get install -y nginx")
            # Wait for install to finish
            stdout.channel.recv_exit_status()
            print("Nginx installed successfully.")
            
        # Write Nginx configuration block
        nginx_config = f"""server {{
    listen 80;
    server_name {DOMAIN};

    root {TARGET_DIR};
    index index.html;

    location / {{
        try_files $uri $uri/ /index.html;
    }}

    location /api/ {{
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        client_max_body_size 50M;
    }}

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}}
"""
        # Remove conflicting gzip.conf if present
        ssh.exec_command("rm -f /etc/nginx/conf.d/gzip.conf")

        # Upload Nginx configuration file
        print("Writing Nginx server block config...")
        # Write local temp config
        temp_config_path = "nginx_temp_config"
        with open(temp_config_path, "w") as f:
            f.write(nginx_config)
            
        sftp = ssh.open_sftp()
        sftp.put(temp_config_path, f"/etc/nginx/sites-available/review_tot_system_com")
        sftp.close()
        os.remove(temp_config_path)
        
        # Enable config and restart Nginx
        print("Enabling Nginx configuration...")
        ssh.exec_command("ln -sf /etc/nginx/sites-available/review_tot_system_com /etc/nginx/sites-enabled/")
        # Remove default if it's there
        ssh.exec_command("rm -f /etc/nginx/sites-enabled/default")
        
        # Test config
        stdin, stdout, stderr = ssh.exec_command("nginx -t")
        err_output = stderr.read().decode('utf-8')
        if "syntax is ok" in err_output or "test is successful" in err_output:
            print("Nginx configuration is valid! Reloading Nginx...")
            ssh.exec_command("systemctl reload nginx || systemctl restart nginx")
        else:
            print(f"Error in Nginx config: {err_output}")
            
        # 4. Optional SSL Setup (Certbot)
        print("\n==========================================")
        print("4. SSL/HTTPS Configuration...")
        print("==========================================")
        
        dns_ok = check_dns()
        if dns_ok:
            print("Installing and running Certbot for SSL...")
            # Install certbot
            ssh.exec_command("apt-get install -y certbot python3-certbot-nginx")
            # Run certbot to obtain cert
            stdin, stdout, stderr = ssh.exec_command(f"certbot --nginx -d {DOMAIN} --non-interactive --agree-tos --email webmaster@tot.system.com --redirect")
            status = stdout.channel.recv_exit_status()
            if status == 0:
                print("SSL Certificate installed successfully!")
            else:
                print("Failed to request SSL certificate. See error logs:")
                print(stderr.read().decode('utf-8'))
        else:
            print("Skipping Certbot setup because DNS is not pointed to this VPS yet.")
            print(f"Once you point '{DOMAIN}' to '{VPS_IP}', you can secure it by running this command on your VPS:")
            print(f"  sudo apt-get install -y certbot python3-certbot-nginx && sudo certbot --nginx -d {DOMAIN}")
            
        print("\n==========================================")
        print("Deployment process finished!")
        print("==========================================")
        
    except Exception as e:
        print(f"An error occurred during deployment: {e}")
    finally:
        ssh.close()

if __name__ == "__main__":
    if run_local_build():
        deploy_to_vps()
