import os
import json
import mimetypes
import urllib.parse
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler

PORT = 8000
DB_DIR = "data"
DB_FILE = os.path.join(DB_DIR, "database.json")

# Default database seed values
DEFAULT_USERS = [
    { "id": "usr_luan", "username": "admin", "password": "123", "name": "Tôn Thất Uyên Luận (Sếp)", "role": "manager", "avatar": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=60" },
    { "id": "usr_hai", "username": "hai.ta", "password": "123", "name": "Tạ Quốc Hải (Sale)", "role": "sales", "avatar": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&auto=format&fit=crop&q=60" },
    { "id": "usr_long", "username": "long.tran", "password": "123", "name": "Trần Hữu Nhật Long (3D/Kỹ thuật)", "role": "kts", "avatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=60" },
    { "id": "usr_duong", "username": "duong.tran", "password": "123", "name": "Trần Tùng Dương (Marketing)", "role": "marketing", "avatar": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=60" },
    { "id": "usr_cuong", "username": "cuong.tran", "password": "123", "name": "Trần Nhật Cường (Thợ chính)", "role": "lead_worker", "avatar": "https://images.unsplash.com/photo-1489980508314-941910ded1f4?w=100&auto=format&fit=crop&q=60" },
    { "id": "usr_ut", "username": "ut.ut", "password": "123", "name": "Út Út (Thợ chính)", "role": "lead_worker", "avatar": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&auto=format&fit=crop&q=60" }
]

DEFAULT_PROJECTS = []

DEFAULT_ATTENDANCE = []

def init_db():
    if not os.path.exists(DB_DIR):
        os.makedirs(DB_DIR)
    if not os.path.exists(DB_FILE):
        reset_db()

def reset_db():
    db_data = {
        "users": DEFAULT_USERS,
        "projects": DEFAULT_PROJECTS,
        "attendance": DEFAULT_ATTENDANCE,
        "systemLogs": []
    }
    with open(DB_FILE, "w", encoding="utf-8") as f:
        json.dump(db_data, f, ensure_ascii=False, indent=2)
    return db_data

class MocTienPhatRequestHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        # Enable CORS for development falls
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200, "OK")
        self.end_headers()

    def do_GET(self):
        parsed_path = urllib.parse.urlparse(self.path)
        if parsed_path.path == "/api/db":
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            try:
                with open(DB_FILE, "r", encoding="utf-8") as f:
                    db_data = json.load(f)
                self.wfile.write(json.dumps(db_data, ensure_ascii=False).encode("utf-8"))
            except Exception as e:
                self.wfile.write(json.dumps({"error": str(e)}).encode("utf-8"))
        else:
            # Fall back to standard static file serving
            super().do_GET()

    def do_POST(self):
        parsed_path = urllib.parse.urlparse(self.path)
        if parsed_path.path == "/api/db/save":
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            
            try:
                db_data = json.loads(post_data.decode("utf-8"))
                with open(DB_FILE, "w", encoding="utf-8") as f:
                    json.dump(db_data, f, ensure_ascii=False, indent=2)
                
                self.send_response(200)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.end_headers()
                self.wfile.write(json.dumps({"status": "success"}).encode("utf-8"))
            except Exception as e:
                self.send_response(500)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode("utf-8"))
                
        elif parsed_path.path == "/api/db/reset":
            try:
                db_data = reset_db()
                self.send_response(200)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.end_headers()
                self.wfile.write(json.dumps({"status": "success", "db": db_data}).encode("utf-8"))
            except Exception as e:
                self.send_response(500)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode("utf-8"))
        else:
            self.send_response(404)
            self.end_headers()

if __name__ == "__main__":
    init_db()
    print(f"Starting Moc Tien Phat Server at http://localhost:{PORT} ...")
    server = ThreadingHTTPServer(("0.0.0.0", PORT), MocTienPhatRequestHandler)
    server.serve_forever()
