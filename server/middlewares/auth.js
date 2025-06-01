import jwt from 'jsonwebtoken'; 

// User authentication middleware
const authUser = async (req, res, next) => {
    try {
        // Extract the token from headers
        let token = req.headers.token || req.headers.authorization;

        // Remove Bearer prefix if present
        if (token && token.startsWith('Bearer ')) {
            token = token.slice(7);
        }

        console.log('Processing token:', token ? 'Present' : 'Missing');

        // Check if the token is missing
        if (!token) {
            console.log('Auth middleware - No token provided');
            return res.status(401).json({ success: false, message: 'Not Authorized. Login Again' });
        }

        try {
            // Verify the token using the secret key
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log('Token decoded, user ID:', decoded.id);

            // Check if the decoded token contains a user ID
            if (!decoded.id) {
                console.log('Auth middleware - No user ID in token');
                return res.status(401).json({ success: false, message: 'Invalid token format' });
            }

            // Attach user ID to the request body
            req.body.userId = decoded.id;
            console.log('Auth middleware - User ID attached:', decoded.id);

            // Call the next function in the stack
            next();
        } catch (error) {
            console.error('Token verification failed:', error);
            return res.status(401).json({ success: false, message: 'Invalid or expired token' });
        }
    } catch (error) {
        console.error('Auth middleware error:', error);
        return res.status(500).json({ success: false, message: 'Authentication error' });
    }
};

// Export the middleware
export default authUser; 
