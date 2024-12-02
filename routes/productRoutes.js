
const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;

// Cloudinary Configuration (Make sure your .env file is set up)
cloudinary.config({
  cloud_name: "df2q6gyuq",
  api_key: "259936754944698",
  api_secret: "bTfV4_taJPd1zxxk1KJADTL8JdU",
});

// Multer memory storage (since we're uploading to Cloudinary)
const storage = multer.memoryStorage(); // Store file in memory
const upload = multer({ storage: storage });

// @desc Create a new product
// @route POST /api/products
// @access Public

router.post('/', upload.single('image'), async (req, res) => {
  console.log('Form data received:', req.body);
  console.log('Uploaded file:', req.file);

  const { title, description, category, price, priceCategory, location } = req.body;

  if (!title || !category || !price) {
    return res.status(400).json({
      message: 'Please fill all required fields and provide an image',
    });
  }

  try {
    // Upload image to Cloudinary
    let imageUrl = '';
    if (req.file) {
      const uploadPromise = new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { resource_type: 'image' },
          (error, result) => {
            if (error) {
              reject(error);
            }
            resolve(result);
          }
        );

        require('streamifier').createReadStream(req.file.buffer).pipe(stream);
      });

      try {
        const result = await uploadPromise;
        imageUrl = result.secure_url;
      } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Image upload failed', error: error.message });
      }
    }

    const product = new Product({
      title,
      description,
      category,
      price,
      priceCategory,
      image: imageUrl,
      location,
      tag: "sell", // Explicitly set the tag to "sell"
    });

    console.log('Product data to be saved:', product); // Debug log

    const createdProduct = await product.save();
    if (!createdProduct) {
      return res.status(500).json({ message: 'Failed to create product' });
    }
    res.status(201).json(createdProduct);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});



// @desc Get all products
// @route GET /api/products
// @access Public
router.get('/', async (req, res) => {
  try {
    const products = await Product.find();
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

module.exports = router;


