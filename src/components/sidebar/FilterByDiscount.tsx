import { productPageContent } from '@src/lib/locale/product'
import useLanguageStore from '@src/lib/store/languageStore'
import { useRouter } from 'next/router'
import React, { useState } from 'react'

const FilterByDiscount = () => {
  const router = useRouter()
  const language = useLanguageStore((state) => state.language)
  const [discount, setDiscount] = useState<boolean>(
    router.query.discount === 'true',
  )
  const handleDiscountRouter = () => {
    setDiscount(!discount)
    let path = router.pathname
    let hmm = { ...router.query, discount: !discount, page_slug: '1' }
    router.push(
      {
        pathname: path,
        query: hmm,
      },
      undefined,
      { shallow: true },
    )
  }
  return (
    <p>
      <input
        type='checkbox'
        checked={discount}
        id='discount'
        className='mr-4 h-4 w-4 align-middle'
        onChange={handleDiscountRouter}
      />
      <label htmlFor='discount' className='text-sm'>
        {productPageContent[language].sales}
      </label>
    </p>
  )
}

export default FilterByDiscount
