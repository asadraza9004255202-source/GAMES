/* ==========================================
   AI SCANNER FULL-STACK SERVER (Node.js + Express)
========================================== */
const express = require('express');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// 1. Enable CORS & Express JSON Parsing
app.use(cors());
app.use(express.json());

// 2. Main Root Folder Se Static Files (index.html, style.css, script.js) Serve Karein
app.use(express.static(__dirname));

// 3. 'uploads' Folder Create & Access Route
const UPLOAD_DIR = './uploads';
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR);
}
app.use('/uploads', express.static(UPLOAD_DIR));

// 4. Multer Configuration (Photo Storage)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

/* ==========================================
   API ROUTE: Receive & Save Uploaded Photo
========================================== */
app.post('/upload', upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        console.log(`Photo saved successfully: ${req.file.path}`);
        
        res.status(200).json({ 
            success: true, 
            message: 'Photo saved on server successfully!',
            path: req.file.path 
        });
    } catch (error) {
        console.error('Server Error:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

/* ==========================================
   ADMIN ROUTE: Sabhi Uploaded Photos Dekhne Ke Liye
========================================== */
app.get('/gallery', (req, res) => {
    fs.readdir(UPLOAD_DIR, (err, files) => {
        if (err || files.length === 0) {
            return res.send("<h2 style='font-family:sans-serif; text-align:center; color:#333; margin-top:50px;'>Abhi tak koi photo upload nahi hui hai.</h2>");
        }

        let html = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Uploaded Photos Gallery</title>
                <style>
                    body { font-family: Arial, sans-serif; background: #0f172a; color: #fff; padding: 20px; }
                    h1 { text-align: center; margin-bottom: 20px; }
                    .grid { display: flex; flex-wrap: wrap; gap: 15px; justify-content: center; }
                    .card { background: #1e293b; padding: 10px; border-radius: 8px; text-align: center; border: 1px solid #334155; }
                    img { width: 200px; height: 200px; object-fit: cover; border-radius: 6px; }
                    p { font-size: 11px; margin-top: 8px; color: #94a3b8; word-break: break-all; width: 200px; }
                    a { color: #38bdf8; text-decoration: none; }
                </style>
            </head>
            <body>
                <h1>📸 Uploaded Photos (${files.length})</h1>
                <div class="grid">
        `;

        files.forEach(file => {
            html += `
                <div class="card">
                    <a href="/uploads/${file}" target="_blank">
                        <img src="/uploads/${file}" alt="User Photo">
                    </a>
                    <p>${file}</p>
                </div>
            `;
        });

        html += `</div></body></html>`;
        res.send(html);
    });
});

// 5. Catch-All Route (Homepage Par Direct index.html Load Karega)
app.get('*', (req, res) => {
    const indexPath = path.join(__dirname, 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.send("🔥 AI Scanner Backend Server is Live & Active!");
    }
});

// 6. Start Express Server
app.listen(PORT, () => {
    console.log(`Backend server running on port ${PORT}`);
    console.log(`Uploaded photos will be saved in: ${path.resolve(UPLOAD_DIR)}`);
    console.log(`View all uploaded photos at: http://localhost:${PORT}/gallery`);
});
