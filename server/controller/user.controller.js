import bcrypt from 'bcrypt'
import userModel from '../models/user.model.js'
import transactionModel from '../models/transaction.model.js'
import jwt from 'jsonwebtoken'
import razorpay from 'razorpay'


const registeruser = async(req, res) => {
    try{
        const { name, email, password } = req.body
        if(!name || !email || !password){
            return res.json({success: false, message: 'Missing Details'})
        }

        const existingUser = await userModel.findOne({ email });
        if (existingUser) {
            return res.json({ success: false, message: 'Email already exists' });
        }
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)

        const userData = {
            name, email, password: hashedPassword
        }

        const newUser = new userModel(userData)
        const user = await newUser.save()

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET )

        res.json({ success: true , token, user: { name: user.name }})
    } catch ( error ) {
        console.log(error)
        res.json({success: false, message: error.message})
    }
}


const loginUser = async(req, res) => {
    try {
        const { email, password } = req.body;
        const user = await userModel.findOne({ email })

        if(!user){
            return res.json({success: false, message: 'User Does not exist'})
        }
        
        const isMatch = await bcrypt.compare(password, user.password)
        
        if(!isMatch) {
            return res.json({success: false, message: 'Invalid Password'})
        } else {
            const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET)

            res.json({ success: true , token, user: { name: user.name }})
        }
    } catch (error) {
        console.log(error)
        res.json({success: false, message: error.message})
    }
}

const userCredits = async(req, res) => {
    try {
        const { userId } = req.body;

        const user = await userModel.findById(userId)

        if(!user) {
            return res.json({success: false, message: 'User not found'})
        }
        res.json({ success: true, credits: user.creditBalance, user: { name: user.name }})
    } catch (error) {
        console.log(error)
        res.json({success: false, message: error.message})
    }
}

const razorpayInstance = new razorpay({
    key_id: process.env.RAZOR_PAY_ID,
    key_secret: process.env.RAZOR_PAY_KEY_SECRET,
});

const paymentRazorpay = async(req, res) => {
    try {
        const {userId, planId} = req.body
        const userData = await userModel.findById(userId)

        if(!userId || !planId) {
            return res.json({success: false, message: 'Missing Details'})
        }

        let credits, plan, amount, date 

        switch (planId) {
            case 'Basic':
                plan = 'Basic'
                credits = '100'
                amount = '299'
                break;

            case 'Advanced':
                plan = 'Advanced'
                credits = '500'
                amount = '1000'
                break;

            case 'Business':
                plan = 'Business'
                credits = '1000'
                amount = '2500'
                break;
        
            default:
                return res.json({success: false, message: 'Plan Not Found'})
        }

        date = Date.now();

        const transactionData = {
            userId, credits, plan, amount, date 
        }

        const newTransaction = await transactionModel.create(transactionData)

        const options = {
            amount: amount * 100,
            currency: process.env.CURRENCY,
            receipt: newTransaction._id,
        }

        await razorpayInstance.orders.create(options, (error, order)=>{
            if(error) {
                console.log(error)
                return res.json({success: false, message: error.message})
            } 

            res.json({success: true, order})
        })

    } catch (error) {
        console.log(error)
        res.json({success: false, message: error.message})
    }
}

const verifyRazorpay = async (req, res) => {
    try {
        console.log(req.body)
        const  {razorpay_order_id} = req.body;
        const orderInfo = await razorpayInstance.orders.fetch(razorpay_order_id)

        if(orderInfo.status === 'paid') {
            const transactionData = await transactionModel.findById(orderInfo.receipt)

            if(transactionData.payment) {
                return res.json({success: false, message: 'Payement Failed'})
            }

            const userData = await userModel.findById(transactionData.userId)

            const creditBalance = userData.creditBalance + transactionData.credits
            await userModel.findByIdAndUpdate(userData._id, {creditBalance})
            await transactionModel.findByIdAndUpdate(transactionData._id, {payment:true})

            res.json({success: true, message: 'Credits Added'})
        } else {
            res.json({success: false, message: 'Payment Failed'})
        }
    } catch (error) {
        console.log(error)
        res.json({success: false, message: error.message})
    }
}

export { registeruser, loginUser, userCredits, paymentRazorpay, verifyRazorpay }