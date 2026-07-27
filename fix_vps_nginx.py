import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('103.142.26.189', username='root', password='*?y?=8gFB4O=')

# Clean up thietkewebpro.io.vn so it does not hijack review.totsystem.com or act as default_server
thietkeweb_config = """server {
    server_name thietkewebpro.io.vn;

    location / {
        proxy_pass http://localhost:18790;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host "thietkewebpro.io.vn";
        proxy_cache_bypass $http_upgrade;
    }

    listen 443 ssl;
    ssl_certificate /etc/letsencrypt/live/thietkewebpro.io.vn/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/thietkewebpro.io.vn/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
}

server {
    listen 80;
    server_name thietkewebpro.io.vn;
    return 301 https://$host$request_uri;
}
"""

sftp = ssh.open_sftp()
with sftp.file('/etc/nginx/sites-available/thietkewebpro.io.vn', 'w') as f:
    f.write(thietkeweb_config)
with sftp.file('/etc/nginx/sites-enabled/thietkewebpro.io.vn', 'w') as f:
    f.write(thietkeweb_config)
sftp.close()

stdin, stdout, stderr = ssh.exec_command('nginx -t && systemctl reload nginx')
print('Nginx test output:', stdout.read().decode('utf-8'))
print('Nginx test error:', stderr.read().decode('utf-8'))
ssh.close()
