import React, { useState } from 'react'
import { assets } from '../assets/assets'
import { motion } from 'motion/react'
import { useContext } from 'react';
import { AppContext } from '../context/AppContext';

const Result = () => {

  const [image, Setimage] = useState(assets.sample_img_1);
  const [isImageLoading, SetImageLoading] = useState(false);
  const [Loading, SetLoading] = useState(false)
  const [Input, SetInput] = useState('')
  
  const { generateImage } = useContext(AppContext)

  const onSubmitHandler = async(e) => {
    e.preventDefault()
    SetLoading(true)
    if(Input) {
      const image = await generateImage(Input)

      if(image) {
        SetImageLoading(true)
        Setimage(image)
      }
    }

    SetLoading(false)
  }

  return (
    <motion.form 
      initial={{ opacity: 0.2, y: 100 }}
      transition={{ duration: 1 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      onSubmit={onSubmitHandler} 
      className='flex flex-col min-h-[90vh] items-center justify-center'>
      <div>
        <div className='relative'>
          <img src={image} alt="" className='max-w-sm rounded' />
          
          <span
            className={`absolute bottom-0 left-0 h-1 bg-blue-500 ${
            Loading ? 'w-full transition-all duration-[10s]' : 'w-0'
            }`}
          />

        </div>

        <p className={!Loading ? 'hidden' : ''}>Loading.....</p>
      </div>
      {!isImageLoading && 
        <div className='flex w-full max-w-xl bg-neutral-500 text-white text-sm p-0.5 mt-10 rounded-full'>
          <input 
          onChange={(e)=>SetInput(e.target.value) } value={Input}
          type="text" placeholder='Describe what you want to generate' className='flex-1 bg-transparent outline-none ml-8 max-sm:w-20 placeholder-color' />
          <button 
            type="submit" 
            className='bg-zinc-900 px-10 sm:px-16 py-3 rounded-full'>
              Generate
          </button>
        </div>
      }


      {isImageLoading && 
        <div className='flex gap-2 flex-wrap justify-center text-white text-sm p-0.5 mt-10 rounded-full'>
          <p onClick={()=>{SetImageLoading(false)}} className='bg-zinc-900 border-0 border-zinc-900 tex  t-black px-8 py-3 rounded-full cursor-pointer'>Generate another</p>
          <a href={image} download className='bg-zinc-900 px-10 py-3 rounded-full cursor-pointer'>Download</a>
        </div>
      }
    </motion.form>
  )
}

export default Result