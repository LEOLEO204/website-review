import os
import socket
import time
import paramiko

VPS_IP = "103.142.26.189"
VPS_USER = "root"
VPS_PASS = "*?y?=8gFB4O="
DOMAIN = "review.totsystem.com"

def check_dns():
    try:
        ip = socket.gethostbyname(DOMAIN)
        if ip == VPS_IP:
            return True
    except socket.gaierror:
        pass
    return False

def main():
    print(f"Waiting for DNS to point '{DOMAIN}' to {VPS_IP}...")
    print("This can take anywhere from a few minutes to a few hours depending on DNS propagation.")
    print("Press Ctrl+C to cancel and run later.")
    
    dns_resolved = False
    # Check every 10 seconds for 10 minutes, then exit if not resolved
    for i in range(60):
        if check_dns():
            dns_resolved = True
            break
        print(".", end="", flush=True)
        time.sleep(10)
        
    if not dns_resolved:
        print("\n\nDNS is still not resolved.")
        print(f"Please make sure you have added an 'A' record for '{DOMAIN}' pointing to '{VPS_IP}' at your domain registrar.")
        print("Once done, run this script again to automatically configure HTTPS.")
        return
        
    print("\n\nDNS resolved successfully!")
    print("Connecting to VPS to configure HTTPS (SSL)...")
    
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        ssh.connect(VPS_IP, username=VPS_USER, password=VPS_PASS, timeout=15)
        print("Installing Certbot & obtaining SSL certificate...")
        
        # Install certbot
        stdin, stdout, stderr = ssh.exec_command("apt-get update && apt-get install -y certbot python3-certbot-nginx")
        stdout.channel.recv_exit_status()
        
        # Run certbot
        stdin, stdout, stderr = ssh.exec_command(f"certbot --nginx -d {DOMAIN} --non-interactive --agree-tos --email webmaster@tot.system.com --redirect")
        exit_status = stdout.channel.recv_exit_status()
        
        if exit_status == 0:
            print("\n==========================================")
            print("HTTPS (SSL) has been configured successfully!")
            print(f"Your site is now secure at: https://{DOMAIN}")
            print("==========================================")
        else:
            print("Failed to configure SSL. Certbot error output:")
            print(stderr.read().decode('utf-8'))
            
    except Exception as e:
        print(f"An error occurred: {e}")
    finally:
        ssh.close()

if __name__ == "__main__":
    main()
