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
});
