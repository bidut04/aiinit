import React from 'react'

function searchbar() {
  return (
 <div className='flex items-center justify-between w-full p-5 bg-white border-b'>
        <div className='flex-1 mr-4'>
          <input
            type='text'
            placeholder='Search...'
            className='border border-gray-300 rounded-lg py-2 px-4 w-full text-gray-700'
          />
        </div>

        <div className='flex gap-2'>
          <button className='px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors'>
            Filters
          </button>
          <button className='px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors'>
            Actions
          </button>
          <button className='px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors'>
            Submit Changes
          </button>
        </div>
      </div>
  )
}

export default searchbar