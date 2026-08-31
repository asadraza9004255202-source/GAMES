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

// 1. Enable CORS & Express JSON Middleware
app.use(cors());
app.use(express.json());

// 2. Serve Frontend Files ('public' folder se index.html, style.css, script.js serve honge)
app.use(express.static(path.join(__dirname, 'public')));

// 3. Ensure 'uploads' directory exists & serve uploaded photos directly
const UPLOAD_DIR = './uploads';
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR);
}
app.use('/uploads', express.static(UPLOAD_DIR));

// 4. Configure Multer (For file storage)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
        // Unique filenames: timestamp + original extension
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

/* ==========================================
   API ROUTE: Receive Photo & Save
========================================== */
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

// 5. Catch-All Route (Homepage par index.html load karega)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 6. Start Server
app.listen(PORT, () => {
    console.log(`Backend server running on port ${PORT}`);
    console.log(`Uploaded photos will be saved in: ${path.resolve(UPLOAD_DIR)}`);
});
