const User = require('../models/User');
const bcrypt = require('bcryptjs');
const auth = require('../auth');
const { errorHandler } = require('../auth');


// Register a new user
module.exports.registerUser = async function (req, res) {
  const { email, username, password } = req.body;

  // Check if all required fields are present
  if (!email || !username || !password) {
    return res.status(400).json({ message: 'Email, username, and password are required' });
  }

  try {
    // Check if user already exists by email
    const existingUser = await User.findOne({ email: email });

    if (existingUser) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    // Hash the password using bcrypt
    const salt = await bcrypt.genSalt(10); // 10 rounds of salt
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create a new user instance with the hashed password
    const newUser = new User({ email, username, password: hashedPassword });

    // Save the new user to the database
    const savedUser = await newUser.save();

    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    console.error(err);  // Log the error for debugging
    errorHandler(err, res);
  }
};


module.exports.loginUser = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Check if either username or email is provided
        if (!username && !email) {
            return res.status(400).send({ error: 'Username or email is required' });
        }

        // Find user by either username or email
        const user = await User.findOne({
            $or: [{ username }, { email }]
        });

        if (!user) {
            return res.status(404).send({ error: 'User not found' });
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).send({ error: 'Invalid password' });
        }

        // Generate access token
        const token = auth.createAccessToken(user);

        return res.status(200).send({
            auth: `${token}`
        });

    } catch (error) {
        console.error(error);
        return res.status(500).send({ error: 'Internal server error' });
    }
};








// Get user profile (Requires authentication)
module.exports.getProfile = async (req, res) => {
    try {
        // User ID is available from the decoded token after auth.verify middleware
        const userId = req.user.id;

        const user = await User.findById(userId).select('-password');
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Return user profile including user ID
        const userProfile = {
            id: user._id,
            email: user.email,
            username: user.username,
        };

        return res.status(200).json(userProfile);

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};








