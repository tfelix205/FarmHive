const router = require("express").Router();
const Order = require("../models/order");
const auth = require("../middleware/auth.middleware");

router.post("/", async (req, res) => {
  const order = await Order.create(req.body);
  res.json(order);
});

router.get("/", auth, async (req, res) => {
  const orders = await Order.find();
  res.json(orders);
});

router.patch("/:id/status", auth, async (req, res) => {
  const order = await Order.findByIdAndUpdate(
    req.params.id,
    { status: req.body.status },
    { new: true }
  );
  res.json(order);
});


module.exports = router;
