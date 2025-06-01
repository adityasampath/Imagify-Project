import React, { useContext } from 'react'
import { assets, plans } from '../assets/assets'
import { AppContext } from '../context/AppContext'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import axios from 'axios'
import { motion } from 'framer-motion'

const BuyCredit = () => {

  const { backendUrl, loadCreditsData, user, token, setShowLogin } = useContext(AppContext)

  const navigate = useNavigate()


  const initPay = async (order) => {
    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: order.amount,
      currency: order.currency,
      name: "Imagify",
      description: "Credit Purchase",
      order_id: order.id,
      handler: async function (response) {
        try {
          const verifyData = {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature
          }
          
          const { data } = await axios.post(
            backendUrl + '/api/user/verify-razor', 
            verifyData, 
            { headers: { token } }
          )
          
          if (data.success) {
            loadCreditsData()
            navigate('/')
            toast.success('Credit Added')
          } else {
            toast.error(data.message || 'Payment verification failed')
          }
        } catch (error) {
          console.error('Payment verification error:', error)
          toast.error(error.message || 'Payment verification failed')
        }
      },
      prefill: {
        name: user?.name || '',
        email: user?.email || '',
      },
      theme: {
        color: "#3399cc"
      }
    }

    try {
      const rzp = new window.Razorpay(options)
      rzp.on('payment.failed', function (response) {
        toast.error(response.error.description || 'Payment failed')
      })
      rzp.open()
    } catch (error) {
      console.error('Razorpay initialization error:', error)
      toast.error('Could not initialize payment')
    }
  }

  const paymentRazorpay = async (planId) => {
    try {
        if (!user) {
            setShowLogin(true);
            return;
        }

        // Check if Razorpay is loaded
        if (!window.Razorpay) {
            toast.error('Payment gateway not ready. Please refresh the page.');
            return;
        }

        const { data } = await axios.post(
            backendUrl + '/api/user/pay-razor',
            { planId },
            { headers: { token } }
        );

        console.log('Server response:', data);

        if (data.success && data.order) {
            const options = {
                key: data.key,
                amount: data.order.amount,
                currency: data.order.currency,
                name: "Imagify",
                description: "Credit Purchase",
                order_id: data.order.id,
                prefill: {
                    name: user?.name || '',
                    email: user?.email || '',
                },
                theme: {
                    color: "#3399cc"
                },
                handler: async function (response) {
                    try {
                        const verifyResponse = await axios.post(
                            backendUrl + '/api/user/verify-razor',
                            {
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature
                            },
                            { headers: { token } }
                        );
                        
                        if (verifyResponse.data.success) {
                            loadCreditsData();
                            navigate('/');
                            toast.success('Payment successful!');
                        }
                    } catch (error) {
                        toast.error('Payment verification failed');
                    }
                }
            };

            const razorpay = new window.Razorpay(options);
            razorpay.on('payment.failed', function (response) {
                toast.error('Payment failed: ' + response.error.description);
            });
            razorpay.open();
        } else {
            toast.error(data.message || 'Could not create payment order');
        }
    } catch (error) {
        toast.error(error.message || 'Payment initialization failed');
    }
  }

  const paymentStripe = async (planId) => {
    try {

      const { data } = await axios.post(backendUrl + '/api/user/pay-stripe', { planId }, { headers: { token } })
      if (data.success) {
        const { session_url } = data
        window.location.replace(session_url)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    }
  }

  return (
    <motion.div className='min-h-[80vh] text-center pt-14 mb-10'
      initial={{ opacity: 0.2, y: 100 }}
      transition={{ duration: 1 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
    >
      <button className='border border-gray-400 px-10 py-2 rounded-full mb-6'>Our Plans</button>
      <h1 className='text-center text-3xl font-medium mb-6 sm:mb-10'>Choose the plan </h1>
      <div className='flex flex-wrap justify-center gap-6 text-left'>
        {plans.map((item, index) => (
          <div className='bg-white drop-shadow-sm border rounded-lg py-12 px-8 text-gray-600 hover:scale-105 transition-all duration-500' key={index}>
            <img width={40} src={assets.logo_icon} alt="" />
            <p className='mt-3 mb-1 font-semibold'>{item.id}</p>
            <p className='text-sm'>{item.desc}</p>
            <p className='mt-6'>
              <span className='text-3xl font-medium'>₹{item.price}</span>/ {item.credits} credits
            </p>
            <div className='flex flex-col mt-4'>
              <button onClick={() => paymentRazorpay(item.id)} className='w-full flex justify-center gap-2 border border-gray-400 mt-2 text-sm rounded-md py-2.5 min-w-52 hover:bg-blue-50 hover:border-blue-400'>
                <img className='h-4' src={assets.razorpay_logo} alt="" />
              </button>
             {/* <button onClick={() => paymentStripe(item.id)} className='w-full flex justify-center gap-2 border border-gray-400 mt-2 text-sm rounded-md py-2.5 min-w-52 hover:bg-blue-50 hover:border-blue-400'>
                  <img className='h-4' src={assets.stripe_logo} alt="" /> 
              </button> */}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

export default BuyCredit