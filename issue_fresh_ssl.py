import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('103.142.26.189', username='root', password='*?y?=8gFB4O=')

# Install official snap certbot to bypass broken python3-openssl APT package on Ubuntu 24.04
cmd = "snap install --classic certbot && /snap/bin/certbot --nginx -d review.totsystem.com --non-interactive --agree-tos --email webmaster@tot.system.com --redirect --force-renewal"

print("Executing Certbot on VPS...")
stdin, stdout, stderr = ssh.exec_command(cmd)

out = stdout.read().decode('utf-8')
err = stderr.read().decode('utf-8')

print("=== CERTBOT STDOUT ===")
print(out)
print("=== CERTBOT STDERR ===")
print(err)

ssh.close()
