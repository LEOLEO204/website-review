import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('103.142.26.189', username='root', password='*?y?=8gFB4O=')

config = """server {
    server_name review.totsystem.com;

    root /var/www/review_tot_system_com;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        client_max_body_size 50M;
    }

    location /uploads/ {
        alias /var/www/review_tot_system_com/uploads/;
        expires 7d;
        add_header Cache-Control "public";
    }

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    listen 443 ssl;
    ssl_certificate /etc/letsencrypt/live/review.totsystem.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/review.totsystem.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
}

server {
    if ($host = review.totsystem.com) {
        return 301 https://$host$request_uri;
    }

    listen 80;
    server_name review.totsystem.com;
    return 404;
}
"""

sftp = ssh.open_sftp()
with sftp.file('/etc/nginx/sites-available/review_tot_system_com', 'w') as f:
    f.write(config)
with sftp.file('/etc/nginx/sites-enabled/review_tot_system_com', 'w') as f:
    f.write(config)
sftp.close()

stdin, stdout, stderr = ssh.exec_command('nginx -t && systemctl reload nginx')
print('Nginx reload:', stdout.read().decode('utf-8'))
print('Nginx err:', stderr.read().decode('utf-8'))
ssh.close()
