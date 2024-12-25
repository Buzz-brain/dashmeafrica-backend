const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const multer = require('multer');
const User = require('../models/User');
const cloudinary = require('cloudinary').v2;

require('dotenv').config();

// Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Multer memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// @desc Create a new product for sale
// @route POST /api/products
// @access Public
router.post('/', upload.single('image'), async (req, res) => {
  console.log('Form data received:', req.body);
  console.log('Uploaded file:', req.file);

  const { title, description, category, price, priceCategory, location, uploader } = req.body;

  if (!title || !category || !price || !uploader) {
    return res.status(400).json({
      message: 'Please fill all required fields, provide an image, and include uploader information',
    });
  }

  try {
    // Check if uploader exists and has verified bank details
    const user = await User.findById(uploader);
    console.log(user)
    if (!user) {
      return res.status(404).json({ message: 'Uploader not found' });
    }

    if (!user.isVerified) {
      return res.status(403).json({ message: 'Bank details not verified. Please verify your bank details to upload a product.' });
    }

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
        console.log(imageUrl)
      } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Image upload failed', error: error.message });
      }
    }

    // Create new product
    const product = new Product({
      title,
      description,
      category,
      price,
      priceCategory,
      image: imageUrl,
      location,
      tag: 'For sale',
      uploader,
      availability: true,
    });

    console.log('Product data to be saved:', product);

    const createdProduct = await product.save();
    if (!createdProduct) {
      return res.status(500).json({ message: 'Failed to create product' });
    }
    res.status(201).json(createdProduct);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// @desc Create a new product to donate
// @route POST /api/products/donate
// @access Public
router.post('/donate', upload.single('image'), async (req, res) => {
  console.log('Form data received:', req.body);
  console.log('Uploaded file:', req.file);

  const { title, description, category, location, uploader } = req.body;

  if (!title || !category || !location || !uploader) {
    return res.status(400).json({
      message: 'Please fill all required fields, provide an image, and include uploader information',
    });
  }

  try {
    // Check if uploader exists and has verified bank details
    const user = await User.findById(uploader);
    if (!user) {
      return res.status(404).json({ message: 'Uploader not found' });
    }
    if (!user.isVerified) {
      return res.status(403).json({ message: 'Bank details not verified. Please verify your bank details to donate a product.' });
    }

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

    // Create new donation product
    const product = new Product({
      title,
      description,
      category,
      image: imageUrl,
      location,
      tag: 'Donated',
      uploader,
      availability: true,
    });

    console.log('Product to be donated to be saved:', product);

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
    const products = await Product.find().populate('uploader', 'username email'); // Include username and email from the User model
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// @desc Get a product by ID
// @route GET /api/products/:id
// @access Public
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('uploader', 'username email _id');

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.status(200).json(product);
  } catch (error) {
    // If the error is due to an invalid ObjectId
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// router.patch('/:id/availability', async (req, res) => {
//   try {
//     const product = await Product.findById(req.params.id);
//     if (!product) {
//       return res.status(404).json({ message: 'Product not found' });
//     }

//     product.availability = !product.availability; // Toggle availability
//     const updatedProduct = await product.save();
//     res.status(200).json(updatedProduct);
//   } catch (error) {
//     res.status(500).json({ message: 'Server Error', error: error.message });
//   }
// });

module.exports = router;


