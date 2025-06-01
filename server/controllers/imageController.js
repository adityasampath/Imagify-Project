import axios from 'axios'
import fs from 'fs'
import FormData from 'form-data'
import userModel from '../models/userModel.js'

// Controller function to generate image from prompt
// http://localhost:4000/api/image/generate-image
export const generateImage = async (req, res) => {
  try {
    const { userId, prompt } = req.body
    console.log('Received request with userId:', userId, 'and prompt:', prompt)

    // Clean and validate Clipdrop API key
    let clipdropKey = process.env.CLIPDROP_API || '';
    clipdropKey = clipdropKey
      .replace(/[\n\r]/g, '') // Remove line breaks
      .replace(/\s+/g, '')    // Remove all whitespace
      .replace(/^['"]|['"]$/g, ''); // Remove quotes

    console.log('API Key length:', clipdropKey.length);
    console.log('First 10 chars of API key:', clipdropKey.substring(0, 10) + '...');
    
    if (!clipdropKey) {
      console.error('Clipdrop API key is missing or invalid');
      return res.status(500).json({ success: false, message: 'Server configuration error - API key missing' });
    }

    // Fetching User Details Using userId
    const user = await userModel.findById(userId)
    console.log('Found user:', user ? 'yes' : 'no')
    
    if (!user || !prompt) {
      console.log('Missing details - user:', !user, 'prompt:', !prompt)
      return res.status(400).json({ success: false, message: 'Missing Details' })
    }

    // Checking User creditBalance
    if (user.creditBalance === 0 || user.creditBalance < 0) {
      console.log('No credit balance:', user.creditBalance)
      return res.status(402).json({ success: false, message: 'No Credit Balance', creditBalance: user.creditBalance })
    }

    // Creation of new multi/part formdata
    const formdata = new FormData()
    formdata.append('prompt', prompt)

    const headers = {
      'x-api-key': clipdropKey,
      ...formdata.getHeaders()
    };

    console.log('Making request to Clipdrop API with headers:', {
      ...headers,
      'x-api-key': headers['x-api-key'].substring(0, 10) + '...'
    });
    
    // Calling Clipdrop API
    try {
      const response = await axios({
        method: 'post',
        url: 'https://clipdrop-api.co/text-to-image/v1',
        data: formdata,
        headers: headers,
        responseType: 'arraybuffer',
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
        validateStatus: function (status) {
          return status >= 200 && status < 300; // Accept only success status codes
        }
      });

      console.log('Clipdrop API response status:', response.status);
      console.log('Response headers:', response.headers);

      if (!response.data || response.data.length === 0) {
        console.error('Empty response from Clipdrop API');
        return res.status(500).json({ success: false, message: 'Invalid response from image generation service' });
      }

      // Convert arrayBuffer to base64
      const base64Image = Buffer.from(response.data, 'binary').toString('base64');
      const resultImage = `data:image/png;base64,${base64Image}`

      // Deduct user credit 
      await userModel.findByIdAndUpdate(user._id, { creditBalance: user.creditBalance - 1 })
      console.log('Updated credit balance to:', user.creditBalance - 1)

      // Send Response
      return res.json({ 
        success: true, 
        message: "Image Generated Successfully", 
        resultImage, 
        creditBalance: user.creditBalance - 1 
      })

    } catch (apiError) {
      console.error('Clipdrop API Error:', {
        status: apiError.response?.status,
        statusText: apiError.response?.statusText,
        data: typeof apiError.response?.data === 'string' ? apiError.response?.data : 'Binary data',
        headers: apiError.response?.headers,
        message: apiError.message,
        code: apiError.code
      });
      
      // Check if the error is related to the API key
      if (apiError.response?.status === 401 || apiError.response?.status === 403) {
        return res.status(500).json({ success: false, message: 'Invalid API key configuration' });
      }
      
      return res.status(500).json({ 
        success: false, 
        message: `Failed to generate image - ${apiError.message || 'API service error'}`
      });
    }

  } catch (error) {
    console.error('Error in generateImage:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}