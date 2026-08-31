/* ==========================================
   AI SCANNER BACKEND SERVER (Node.js + Express)
========================================== */
const express = require('express');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// 1. Enable CORS (Allows frontend hosted elsewhere to make requests)
app.use(cors());
app.use(express.json());

// 2. Ensure 'uploads' directory exists
const UPLOAD_DIR = './uploads';
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR);
}

// Uploaded photos ko browser par directly dekhne ke liye static route
app.use('/uploads', express.static(UPLOAD_DIR));

// Homepage GET Route ("Cannot GET /" fix karne ke liye)
app.get('/', (req, res) => {
    res.send("🔥 AI Scanner Backend Server is Live & Active!");
});

// 3. Configure Multer (For file storage)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
        // Unique filenames banayein: timestamp + original extension
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

/* ==========================================
   API ROUTE: Receive Photo & Save
========================================== */
// POST /upload route accepts single file with field name 'image'
app.post('/upload', upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        console.log(`Photo saved successfully: ${req.file.path}`);
        
        // Respond back to frontend
        res.status(200).json({ 
            success: true, 
            message: 'Photo saved on YOUR server successfully!',
            path: req.file.path 
        });
    } catch (error) {
        console.error('Server Error:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

// 4. Start Server
app.listen(PORT, () => {
    console.log(`Backend server running on port ${PORT}`);
    console.log(`Uploaded photos will be saved in: ${path.resolve(UPLOAD_DIR)}`);
});
