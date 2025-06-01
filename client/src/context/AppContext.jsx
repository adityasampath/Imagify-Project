import { createContext, useEffect, useState } from "react";
import axios from 'axios'
import { toast } from 'react-toastify'
import { useNavigate } from "react-router-dom";

export const AppContext = createContext()

const AppContextProvider = (props) => {

    const [showLogin, setShowLogin] = useState(false)
    const [token, setToken] = useState(localStorage.getItem('token'))
    const [user, setUser] = useState(null)

    const [credit, setCredit] = useState(false)

    const backendUrl = import.meta.env.VITE_BACKEND_URL
    const navigate = useNavigate()

    const loadCreditsData = async () => {
        try {

            const { data } = await axios.get(backendUrl + '/api/user/credits', { headers: { token } })
            if (data.success) {
                setCredit(data.credits)
                setUser(data.user)
            }

        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }
    }

    const generateImage = async (prompt) => {
        try {
            if (!token || !user) {
                toast.error('Please login first');
                setShowLogin(true);
                return;
            }

            console.log('Making image generation request:', {
                prompt,
                token: token ? 'present' : 'missing',
                user: user ? 'present' : 'missing'
            });
            
            const { data } = await axios.post(
                `${backendUrl}/api/image/generate-image`, 
                { prompt }, 
                { 
                    headers: { 
                        'Authorization': `Bearer ${token}`,
                        'token': token 
                    }
                }
            );

            if (data.success) {
                loadCreditsData();
                return data.resultImage;
            } else {
                console.error('Image generation failed:', data.message);
                toast.error(data.message);
                loadCreditsData();
                if (data.creditBalance === 0) {
                    navigate('/buy');
                }
            }

        } catch (error) {
            console.error('Image generation error:', error);
            if (error.response) {
                console.error('Response error:', error.response.data);
                toast.error(error.response.data.message || 'Failed to generate image');
            } else {
                toast.error(error.message || 'Network error occurred');
            }
        }
    }

    const logout = () => {
        localStorage.removeItem('token')
        setToken('')
        setUser(null)
    }

    useEffect(()=>{
        if (token) {
            loadCreditsData()
        }
    },[token])

    const value = {
        token, setToken,
        user, setUser,
        showLogin, setShowLogin,
        credit, setCredit,
        loadCreditsData,
        backendUrl,
        generateImage,
        logout
    }

    return (
        <AppContext.Provider value={value}>
            {props.children}
        </AppContext.Provider>
    )

}

export default AppContextProvider