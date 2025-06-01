import axios from "axios";
import { createContext, use, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useNavigate } from 'react-router-dom'


export const AppContext = createContext()

const AppContextProvider = (props) => {
    const [user, Setuser] = useState(null)
    const [showlogin, Setshowlogin] = useState(false)
    const [token, setToken] = useState(localStorage.getItem('token'))
    const [credit, setCredit] = useState(false)
    
    const backendUrl = import.meta.env.VITE_BACKEND_URL
    const navigate = useNavigate();
    
    const loadCreditsdata = async () => {
        try {
            const { data } = await axios.get(backendUrl + '/api/user/credits', {headers: {token}})

            if(data.success) {
                setCredit(data.credits)
                Setuser(data.user)

            }
        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }
    }
    
    const generateImage = async(prompt) => {
        try {
            const { data } = await axios.post(backendUrl + '/api/image/generate-image', {prompt}, {headers: {token}})
            if(data.success) {
                loadCreditsdata()
                return data.resultImage
            } else {
                toast.error(data.message)
                loadCreditsdata()
                if(data.creditBalance == 0){
                    navigate('/buy')
                }
            }
        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }
    }
    
    const logOut = () => {
        localStorage.removeItem('token')
        setToken('')
        Setuser(null)
    }

    useEffect(()=>{
        if(token) {
            loadCreditsdata();
        }
    },[token])
    const value = {
        user, Setuser, showlogin, Setshowlogin, backendUrl, token, setToken, credit, setCredit, loadCreditsdata, logOut, generateImage
    }

    return (
        <AppContext.Provider value={value}>
            {props.children}
        </AppContext.Provider>
    )
}

export default AppContextProvider