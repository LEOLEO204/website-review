import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('103.142.26.189', username='root', password='*?y?=8gFB4O=')

scan_code = r"""import sqlite3, re

conn = sqlite3.connect('/var/www/review_tot_system_com/server/database.sqlite')
c = conn.cursor()

c.execute('SELECT * FROM wc_articles')
rows = c.fetchall()
http_urls = []
for r in rows:
    row_str = str(r)
    matches = re.findall(r'http://[^\s"\\\'\)]+', row_str)
    http_urls.extend(matches)

print('HTTP_URLS_FOUND:', set(http_urls))
"""

sftp = ssh.open_sftp()
with sftp.file('/tmp/scan.py', 'w') as f:
    f.write(scan_code)
sftp.close()

stdin, stdout, stderr = ssh.exec_command('python3 /tmp/scan.py')
print(stdout.read().decode('utf-8'))
print(stderr.read().decode('utf-8'))
ssh.close()
