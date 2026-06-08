import paramiko, socket, threading, select

def forward_tunnel(local_port, remote_host, remote_port, transport):
    server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, True)
    server.bind(('127.0.0.1', local_port))
    server.listen(100)
    print(f'Tunnel ready: localhost:{local_port} -> {remote_host}:{remote_port}', flush=True)
    while True:
        client_sock, addr = server.accept()
        try:
            chan = transport.open_channel('direct-tcpip', (remote_host, remote_port), addr)
        except Exception as e:
            print(f'Channel error: {e}', flush=True)
            client_sock.close()
            continue
        def bridge(sock, channel):
            while True:
                r, _, _ = select.select([sock, channel], [], [], 5)
                if sock in r:
                    data = sock.recv(4096)
                    if not data: break
                    channel.sendall(data)
                if channel in r:
                    data = channel.recv(4096)
                    if not data: break
                    sock.sendall(data)
            sock.close(); channel.close()
        threading.Thread(target=bridge, args=(client_sock, chan), daemon=True).start()

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('72.60.68.234', username='root', password='Startsette@2024', timeout=30)
print('SSH connected!', flush=True)
forward_tunnel(8000, 'localhost', 8000, ssh.get_transport())
