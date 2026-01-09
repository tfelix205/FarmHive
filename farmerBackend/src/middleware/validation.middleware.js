// Request validation middleware

const validateProductCreate = (req, res, next) => {
  const { name, price, unit, stock } = req.body;
  const errors = [];

  if (!name || name.trim().length === 0) {
    errors.push("Product name is required");
  }

  if (!price || isNaN(price) || price < 0) {
    errors.push("Valid price is required");
  }

  if (!unit || !["kg", "lb", "piece", "dozen", "gram", "liter"].includes(unit)) {
    errors.push("Valid unit is required");
  }

  if (stock === undefined || isNaN(stock) || stock < 0) {
    errors.push("Valid stock quantity is required");
  }

  if (errors.length > 0) {
    return res.status(400).json({ message: "Validation error", errors });
  }

  next();
};

const validateOrderCreate = (req, res, next) => {
  const { customerName, customerPhone, deliveryAddress, items } = req.body;
  const errors = [];

  if (!customerName || customerName.trim().length === 0) {
    errors.push("Customer name is required");
  }

  if (!customerPhone || customerPhone.trim().length === 0) {
    errors.push("Customer phone is required");
  }

  if (!deliveryAddress || deliveryAddress.trim().length === 0) {
    errors.push("Delivery address is required");
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    errors.push("Order must contain at least one item");
  }

  if (items && Array.isArray(items)) {
    items.forEach((item, index) => {
      if (!item._id && !item.productId) {
        errors.push(`Item ${index + 1}: Product ID is required`);
      }
      if (!item.quantity || item.quantity < 1) {
        errors.push(`Item ${index + 1}: Valid quantity is required`);
      }
    });
  }

  if (errors.length > 0) {
    return res.status(400).json({ message: "Validation error", errors });
  }

  next();
};

const validateUserRegistration = (req, res, next) => {
  const { name, email, password } = req.body;
  const errors = [];

  if (!name || name.trim().length === 0) {
    errors.push("Name is required");
  }

  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    errors.push("Valid email is required");
  }

  if (!password || password.length < 6) {
    errors.push("Password must be at least 6 characters");
  }

  if (errors.length > 0) {
    return res.status(400).json({ message: "Validation error", errors });
  }

  next();
};

const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  const errors = [];

  if (!email || email.trim().length === 0) {
    errors.push("Email is required");
  }

  if (!password || password.trim().length === 0) {
    errors.push("Password is required");
  }

  if (errors.length > 0) {
    return res.status(400).json({ message: "Validation error", errors });
  }

  next();
};

module.exports = {
  validateProductCreate,
  validateOrderCreate,
  validateUserRegistration,
  validateLogin
};