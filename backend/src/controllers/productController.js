const Product = require('../models/Product');

exports.createProduct = async (req, res) => {
  try {
    const seller = req.user.uid;
    const { title, description, price, media, location, category, tags, isAnonymous } = req.body;

    const product = new Product({
      sellerId: req.user._id,
      title,
      description,
      price,
      media,
      location,
      category,
      tags,
      isAnonymous: isAnonymous || false
    });

    await product.save();
    res.status(201).json(product);
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
};

exports.getProducts = async (req, res) => {
  try {
    const { tags, location, category } = req.query;
    const filter = { isVisible: true };

    if (tags) filter.tags = { $in: tags.split(',') };
    if (location) filter.location = location;
    if (category) filter.category = category;

    const products = await Product.find(filter).sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product || !product.isVisible) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch product' });
  }
};