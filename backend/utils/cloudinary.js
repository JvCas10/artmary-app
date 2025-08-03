// backend/utils/cloudinary.js
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const path = require('path'); // Necesitamos 'path' para resolver rutas de directorios
const fs = require('fs'); // Necesitamos 'fs' para manejar el borrado del archivo temporal

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configuración de Multer para guardar archivos temporalmente en el disco
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Asegúrate de que la carpeta 'uploads' exista
    const uploadsDir = path.join(__dirname, '../uploads'); // Asume que 'uploads' está en la raíz de 'backend'
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir);
    }
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/jpg') {
        cb(null, true);
    } else {
        cb(new Error('Tipo de archivo no soportado. Solo JPEG, PNG, JPG.'), false);
    }
};

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 1024 * 1024 * 5 }, // 5MB limit
    fileFilter: fileFilter
});

module.exports = { cloudinary, upload };
