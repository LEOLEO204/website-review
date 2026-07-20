import paramiko

VPS_IP = "103.142.26.189"
VPS_USER = "root"
VPS_PASS = "*?y?=8gFB4O="

def check_permissions():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        ssh.connect(VPS_IP, username=VPS_USER, password=VPS_PASS, timeout=15)
        print("Connected to VPS!")
        
        # Check permissions and ownership
        commands = [
            "ls -la /var/www/review_tot_system_com/server",
            "ls -lad /var/www/review_tot_system_com/server",
            "ls -la /var/www/review_tot_system_com",
            "lsattr /var/www/review_tot_system_com/server/database.sqlite",
            "lsof | grep database.sqlite"
        ]
        
        for cmd in commands:
            print(f"\n--- Running: {cmd} ---")
            stdin, stdout, stderr = ssh.exec_command(cmd)
            print(stdout.read().decode('utf-8'))
            print(stderr.read().decode('utf-8'))
            
    except Exception as e:
        print("Error:", e)
    finally:
        ssh.close()

if __name__ == "__main__":
    check_permissions()
