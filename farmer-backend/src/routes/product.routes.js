const router = require("express").Router();
const Product = require("../models/product");
const auth = require("../middleware/auth.middleware");

router.get("/", async (req, res) => {
  const products = await Product.find({ isAvailable: true });
  res.json(products);
});

router.post("/", auth, async (req, res) => {
  const product = await Product.create(req.body);
  res.json(product);
});

module.exports = router;
