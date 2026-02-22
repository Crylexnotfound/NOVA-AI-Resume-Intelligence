#!/usr/bin/env python3
"""
Simple Python HTTP Server for AIRA - AI Resume Analyzer
This server serves the static files and handles basic API endpoints
"""

import http.server
import socketserver
import json
import os
import webbrowser
import threading
import time
from pathlib import Path
from urllib.parse import urlparse, parse_qs

class AIRARequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory="public", **kwargs)
    
    def end_headers(self):
        # Add CORS headers
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        super().end_headers()
    
    def do_GET(self):
        parsed_path = urlparse(self.path)
        
        # Handle API endpoints
        if parsed_path.path.startswith('/api/'):
            self.handle_api_get(parsed_path.path)
            return
        
        # Serve static files
        if parsed_path.path == '/':
            self.path = '/index.html'
        
        # Ensure we're serving from the public directory
        if not self.path.startswith('/'):
            self.path = '/' + self.path
            
        try:
            super().do_GET()
        except Exception as e:
            self.send_error(404, f"File not found: {e}")
    
    def do_POST(self):
        parsed_path = urlparse(self.path)
        
        # Handle API endpoints
        if parsed_path.path.startswith('/api/'):
            self.handle_api_post(parsed_path.path)
            return
        
        # For other POST requests, return 404
        self.send_error(404, "Endpoint not found")
    
    def do_OPTIONS(self):
        # Handle CORS preflight requests
        self.send_response(200)
        self.end_headers()
    
    def handle_api_get(self, path):
        """Handle GET requests to API endpoints"""
        try:
            if path == '/api/templates':
                # Mock templates data
                templates = [
                    {
                        "id": "1",
                        "name": "Professional Executive",
                        "description": "Clean and professional design for executive roles",
                        "color": "from-blue-500 to-blue-700",
                        "icon": "fa-briefcase"
                    },
                    {
                        "id": "2", 
                        "name": "Modern Tech",
                        "description": "Modern design perfect for tech professionals",
                        "color": "from-green-500 to-teal-600",
                        "icon": "fa-laptop-code"
                    },
                    {
                        "id": "3",
                        "name": "Creative Designer", 
                        "description": "Creative layout for design professionals",
                        "color": "from-purple-500 to-pink-600",
                        "icon": "fa-palette"
                    }
                ]
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps(templates).encode())
                
            else:
                self.send_error(404, "API endpoint not found")
                
        except Exception as e:
            self.send_error(500, f"Server error: {e}")
    
    def handle_api_post(self, path):
        """Handle POST requests to API endpoints"""
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            
            if path == '/api/analyze':
                # Mock analysis response
                analysis_data = {
                    "atsScore": 85,
                    "categories": {
                        "content": {
                            "score": 80,
                            "feedback": ["Good content structure", "Clear experience descriptions"],
                            "suggestions": ["Add more quantifiable achievements", "Include action verbs"]
                        },
                        "formatting": {
                            "score": 85,
                            "feedback": ["Clean layout", "Good use of white space"],
                            "suggestions": ["Ensure consistent formatting", "Use bullet points effectively"]
                        },
                        "keywords": {
                            "score": 75,
                            "found": ["project management", "team leadership", "communication"],
                            "missing": ["data analysis", "problem solving", "strategic planning"],
                            "suggestions": ["Add industry-specific keywords", "Include technical skills"]
                        },
                        "structure": {
                            "score": 90,
                            "feedback": ["Well-organized sections", "Logical flow"],
                            "suggestions": ["Add professional summary", "Ensure section order is optimal"]
                        },
                        "tone": {
                            "score": 75,
                            "feedback": ["Professional tone", "Clear communication"],
                            "suggestions": ["Use more active language", "Strengthen achievement statements"]
                        }
                    },
                    "strengths": ["Strong experience section", "Good educational background", "Professional presentation"],
                    "weaknesses": ["Limited quantifiable achievements", "Could use more keywords", "Summary section needs improvement"],
                    "improvements": {
                        "summary": ["Add a 2-3 sentence professional summary", "Highlight key qualifications"],
                        "experience": ["Quantify achievements with numbers", "Use more action verbs"],
                        "education": ["Add graduation date if missing", "Include relevant coursework"],
                        "skills": ["Create a dedicated skills section", "Group technical and soft skills"]
                    },
                    "atsCompatibility": {
                        "score": 85,
                        "issues": ["Some formatting may affect ATS parsing", "Missing keywords for target roles"],
                        "fixes": ["Use standard section headers", "Add industry-specific terminology"]
                    }
                }
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps(analysis_data).encode())
                
            else:
                self.send_error(404, "API endpoint not found")
                
        except Exception as e:
            self.send_error(500, f"Server error: {e}")

def start_server():
    """Start the AIRA server"""
    PORT = 3000
    Directory = "public"
    
    # Change to the public directory
    if os.path.exists(Directory):
        os.chdir(Directory)
        print(f"📁 Serving files from: {Path.cwd()}")
    else:
        print(f"❌ Directory '{Directory}' not found!")
        return
    
    # Create server
    handler = AIRARequestHandler
    httpd = socketserver.TCPServer(("", PORT), handler)
    
    print(f"🚀 AIRA Server running on http://localhost:{PORT}")
    print(f"🌐 Open your browser and navigate to: http://localhost:{PORT}")
    print("⚠️  Note: This is a development server with mock AI responses")
    print("🛑 Press Ctrl+C to stop the server")
    
    # Open browser in a separate thread
    def open_browser():
        time.sleep(1)  # Wait for server to start
        try:
            webbrowser.open(f'http://localhost:{PORT}')
            print("✅ Browser opened automatically")
        except:
            print("⚠️  Could not open browser automatically")
            print(f"🌐 Please manually open: http://localhost:{PORT}")
    
    browser_thread = threading.Thread(target=open_browser)
    browser_thread.daemon = True
    browser_thread.start()
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
    finally:
        httpd.server_close()
        print("👋 Server shutdown complete")

if __name__ == "__main__":
    start_server()
