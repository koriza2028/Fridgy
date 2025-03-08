const express = require('express');
const mongoose = require('mongoose');
const Product = require('../models/Product');
const basketProductSchema = require('../models/BasketProduct');
const Basket = require('../models/Basket');
const router = express.Router();

// Get all available products
router.get('/', async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get all available products
router.get('/availableProducts', async (req, res) => {
  try {
    const products = await Product.find({ isArchived: false });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get all archived products
router.get('/archivedProducts', async (req, res) => {
  try {
    const products = await Product.find({ isArchived: true });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get available products by category
router.get('/availableProducts/:category', async (req, res) => {
  const filter = req.params.category
  try {
    if (filter == 'All') {
      const products = await Product.find({ isArchived: false });
      return res.json(products);
    }
    const products = await Product.find({ isArchived: false, category: filter });

    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get archived products by category
router.get('/archivedProducts/:category', async (req, res) => {
  const filter = req.params.category
  try {
    if (filter == 'All') {
      const products = await Product.find({ isArchived: true });
      return res.json(products);
    }
    const products = await Product.find({ isArchived: true, category: filter });

    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Create a new product
router.post('/', async (req, res) => {
  const id = req.body.id;
  try {
    if (id && id != '') {
        const updatedProduct = await Product.findByIdAndUpdate(
            id,
            { name: req.body.name, category: req.body.category, amount: req.body.amount, notes: req.body.notes, isArchived: req.body.isArchived, image: req.body.image },
            { new: true }
        );

        if (!updatedProduct) {
            return null;
        }

    } else {
        // Create a new product since no id is provided
        const newProduct = new Product({ name: req.body.name, category: req.body.category, amount: req.body.amount, notes: req.body.notes, isArchived: req.body.isArchived, image: req.body.image });
        newProduct.save();
    }
    const updatedProductList = await Product.find({ isArchived: false });
    return res.json(updatedProductList);

  } catch (error) {
      console.error('Error creating or updating product:', error);
      res.status(500).json({ error: 'Failed to save product' });
  }
});

router.patch('/:id', async (req, res) => {
  const productId = req.params.id;
  try {
    await Product.findOneAndUpdate(
      { _id: productId, amount: { $gt: 0 } },
      [
        {
            $set: {
              amount: {
                $max: [{ $subtract: ["$amount", 1] }, 0]
              },
              isArchived: {
                  $cond: {
                      if: {  $eq: ["$amount", 1] },
                      then: true,
                      else: "$isArchived"
                  }
              }
                
            }
        }
      ],
      { new: true }
    );

    const updatedProductList = await Product.find({ isArchived: false });
    res.json(updatedProductList);
  } catch (error) {
    res.status(500).json({ error: 'Failed to process request' });
  }
});

router.post('/increment', async (req, res) => {
  const id = req.body.id;
  try {
    if (!id) {
      return res.status(400).json({ error: 'Product ID is required' });
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      [
        {
          $set: {
            amount: { $add: ["$amount", 1] },
            isArchived: {
              $cond: {
                if: { $eq: ["$amount", 0] },
                then: false,
                else: "$isArchived"
              }
            }
          }
        }
      ],
      { new: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }

    console.log('Product incremented:', updatedProduct);

    // Fetch the updated list of products
    const products = await Product.find({ isArchived: false });

    // Return the whole list of products
    return res.json(products);
  } catch (error) {
    console.error('Error incrementing product amount:', error);
    return res.status(500).json({ error: 'Failed to increment product amount' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deletedProduct = await Product.findByIdAndDelete(id);

    if (!deletedProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }

    console.log('Product deleted:', deletedProduct);

    // Fetch the updated list of products
    const products = await Product.find({ isArchived: false });

    // Return the whole list of products
    return res.json(products);
  } catch (error) {
    console.error('Error deleting product:', error);
    return res.status(500).json({ error: 'Failed to delete product' });
  }
});

// Move a single product to the basket
router.post('/:id/move-to-basket', async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const BasketProduct = mongoose.model('BasketProduct', basketProductSchema);

    const basketProduct = new BasketProduct({
      _id: id,
      name: product.name,
      category: product.category,
      amount: 1,
      isFromFridge: true
    });

    let basket = await Basket.findOne();
    if (!basket) {
      basket = new Basket({ products: [basketProduct] });
      await basket.save();
    } else {
      basket.products.push(basketProduct);
      await basket.save();
    }


    console.log('Product moved to basket:', basketProduct);

    // Return the whole list of basket products
    return res.status(200);
  } catch (error) {
    console.error('Error moving product to basket:', error);
    return res.status(500).json({ error: 'Failed to move product to basket' });
  }
});

router.patch('/:id/decrement', async (req, res) => {
  const productId = req.params.id;
  try {
    await Product.findOneAndUpdate(
      { _id: productId, amount: { $gt: 0 } },
      [
        {
            $set: {
              amount: {
                $max: [{ $subtract: ["$amount", 1] }, 0]
              },
              isArchived: {
                  $cond: {
                      if: {  $eq: ["$amount", 1] },
                      then: true,
                      else: "$isArchived"
                  }
              }
            }
        }
      ],
      { new: true }
    );

    const updatedProductList = await Product.find({ isArchived: false });
    res.json(updatedProductList);
  } catch (error) {
    res.status(500).json({ error: 'Failed to process request' });
  }
});

module.exports = router;