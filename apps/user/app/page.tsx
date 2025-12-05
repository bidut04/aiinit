'use client'
import React from 'react'

import YourMind from './components/YourMind'
import Component from "./components/Component";
import Main from './components/Main'
import FoodItem from './components/FoodItem'
function page() {
  return (
    <div className='h-screen w-screen'>

      <div>
         <Component/>
      </div>
      <div>
       
        <YourMind/>
      </div>
      <div>
        <Main/>
      </div>
      <div>
        <FoodItem/>
      </div>



    </div>
  )
}

export default page