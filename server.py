#!/usr/bin/env python3
import http.server
import socketserver
import json
import urllib.parse
from datetime import datetime
import threading
import time

# Global storage for user balances
user_balances = {}
PORT = 8888

class ChatHandler(http.server.SimpleHTTPRequestHandler):
    def do_POST(self):
        if self.path == '/api/transfer':
            self.handle_transfer()
        elif self.path == '/api/balance':
            self.handle_balance()
        else:
            self.send_error(404)
    
    def do_GET(self):
        if self.path.startswith('/api/balance'):
            self.get_balance()
        else:
            # Serve static files
            super().do_GET()

    def handle_transfer(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        data = json.loads(post_data.decode('utf-8'))
        
        sender = data['sender']
        recipient = data['recipient']
        amount = float(data['amount'])
        
        # Initialize balances if needed
        if sender not in user_balances:
            user_balances[sender] = 500.0
        if recipient not in user_balances:
            user_balances[recipient] = 500.0
        
        # Check if sender has enough money
        if user_balances[sender] < amount:
            self.send_response(400)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({'status': 'error', 'message': 'Insufficient funds'}).encode())
            return
        
        # Transfer money
        user_balances[sender] -= amount
        user_balances[recipient] += amount
        
        # Debug logging
        print(f"Transfer: {sender} -> {recipient}: ${amount}")
        print(f"New balances - {sender}: ${user_balances[sender]}, {recipient}: ${user_balances[recipient]}")
        
        # Send response
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        response = {
            'status': 'success',
            'sender_balance': user_balances[sender],
            'recipient_balance': user_balances[recipient]
        }
        self.wfile.write(json.dumps(response).encode())
    
    def handle_balance(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        data = json.loads(post_data.decode('utf-8'))
        
        username = data['username']
        amount = float(data['amount'])
        
        # Initialize balance if needed
        if username not in user_balances:
            user_balances[username] = 500.0
        
        # Update balance
        user_balances[username] += amount
        
        # Send response
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        response = {
            'status': 'success',
            'balance': user_balances[username]
        }
        self.wfile.write(json.dumps(response).encode())
    
    def get_balance(self):
        # Get user balance
        try:
            if '?' in self.path:
                query_params = urllib.parse.parse_qs(self.path.split('?')[1])
                username = query_params.get('username', [''])[0]
            else:
                username = ''
            
            balance = user_balances.get(username, 500.0)
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            response = {'balance': balance}
            self.wfile.write(json.dumps(response).encode())
        except Exception as e:
            print(f"Error in get_balance: {e}")
            self.send_error(500)

# Start the server
with socketserver.TCPServer(("", PORT), ChatHandler) as httpd:
    print(f"Server running at http://0.0.0.0:{PORT}/")
    print(f"Transfer API available at http://0.0.0.0:{PORT}/api/transfer")
    httpd.serve_forever()
