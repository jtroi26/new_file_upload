const express = require('express');
const multer = require('multer');
const mysql = require('mysql2/promise');

const app = express();

const conn = {
    host: 'localhost',
    database: 'uploadfile',
    user: 'root',
    password: ''
};

// Set the view engine to EJS
app.set('view engine', 'ejs');
app.use('/uploads', express.static('uploads'));

// Route to render the upload form
app.get('/', async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.query('SELECT * FROM uploaded_files');
        connection.release();

        res.render('index', { files: rows }); // Pass the 'rows' data to the 'files.ejs' template
    } catch (err) {
        console.error('Error fetching files:', err);
        res.status(500).json({ error: 'Error fetching files' });
    }
});

// Create a connection pool
const pool = mysql.createPool(conn);

// Set up Multer for file upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads'); // Set your upload directory here
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

// Endpoint for file upload
app.post('/upload', upload.single('file'), async (req, res) => {
    try {
        // Get file information from req.file
        const { filename, path, mimetype, size } = req.file;

        // Insert file details into the database
        const connection = await pool.getConnection();
        const [result] = await connection.query(
            'INSERT INTO uploaded_files (filename, path, mimetype, size) VALUES (?, ?, ?, ?)',
            [filename, path, mimetype, size]
        );
        connection.release();

        res.redirect('/');
    } catch (err) {
        console.error('Error uploading file:', err);
        res.status(500).json({ error: 'Error uploading file' });
    }
});

app.get('/download/:filename', async (req, res) => {
    try {
        const fileName = req.params.filename;
        // Retrieve the file path from the database based on the provided filename
        const connection = await pool.getConnection();
        const [rows] = await connection.query('SELECT path FROM uploaded_files WHERE filename = ?', [fileName]);
        connection.release();

        if (rows.length > 0) {
            const filePath = rows[0].path;
            // Trigger the download of the specified file
            res.download(filePath);
        } else {
            res.status(404).send('File not found');
        }
    } catch (err) {
        console.error('Error downloading file:', err);
        res.status(500).send('Error downloading file');
    }
});

app.get('/preview/:filename', async (req, res) => {
    try {
        const fileName = req.params.filename;
        // Retrieve the file path from the database based on the provided filename
        // Adjust this query based on your database schema
        const connection = await pool.getConnection();
        const [rows] = await connection.query('SELECT path FROM uploaded_files WHERE filename = ?', [fileName]);
        connection.release();

        if (rows.length > 0) {
            const filePath = rows[0].path;
            // Send the file for preview
            res.sendFile(filePath);
        } else {
            res.status(404).send('File not found');
        }
    } catch (err) {
        console.error('Error previewing file:', err);
        res.status(500).send('Error previewing file');
    }
});




// Start the server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
