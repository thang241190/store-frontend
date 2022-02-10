import React, { useEffect, useState } from 'react'
import { useNextSanityImage } from 'next-sanity-image'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/router'

import { AiFillHeart, AiOutlineHeart } from 'react-icons/ai'
import Star from './Star'
import { client } from '@src/lib/client'
import { Auth } from 'aws-amplify'
import { useFavoriteItems } from '@src/hooks/useFavoriteItems'
import { postFavorite } from '@src/lib/queries/favorite'
import Loading from '@components/Loading'
import { mainPageContent } from '@src/lib/locale/shop'
import useLanguageStore from '@src/lib/store/languageStore'

type ProductItemType = {
  button?: boolean
  product: ProductType
}

const ProductItem = ({ button = false, product }: ProductItemType) => {
  const [favorite, setFavorite] = useState(false)
  const language = useLanguageStore((state) => state.language)
  const imageProps = useNextSanityImage(client, product.images)
  let rating: number = 0
  let total: number = 0
  let count: number = 0
  product.comments.map((comment) => {
    if (comment.rating) {
      total += comment.rating
      count++
    }
  })
  rating = total / count
  const { locale } = useRouter()
  const [userId, setUserId] = useState('')
  const [profile, setProfile] = useState<IProfile>()
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await Auth.currentAuthenticatedUser()
        setProfile(user.attributes)
        setUserId(user.username)
      } catch (error) {
        console.log(error)
      }
    }

    checkAuth()
  }, [])

  const handleFavoriteToggle = () => {
    setFavorite(!favorite)
  }
  if (locale == 'en' || locale == 'fi' || locale == 'se') {
    return (
      <div className='product-item mt-4 lg:px-8 heart-button'>
        <div className='text-center relative'>
          {/* <button
            onClick={handleFavoriteToggle}
            className={`absolute top-0 right-0 z-10 ${
              favorite ? 'text-red-500' : 'text-black'
            }`}>
            {favorite ? <AiFillHeart /> : <AiOutlineHeart className='heart' />}
          </button> */}
          {product.sales === true ? (
            <div className='text-center absolute top-0 left-0 z-10'>
              <span
                className='bg-red-500  px-4 py-1 text-white inline-block text-xs lg:text-xs'
                style={{ borderRadius: '0 999px 0 999px' }}>
                Sale
              </span>
            </div>
          ) : null}
          <Link href={`/${product.vendor.slug}/${product.slug}`}>
            <a>
              <Image
                {...imageProps}
                layout='intrinsic'
                height={140}
                width={80}
                alt={product.title}
              />
            </a>
          </Link>
        </div>

        <div className='text-center leading-6'>
          <h3 className='mt-2'>
            <Link href={`/${product.vendor.slug}/${product.slug}`}>
              <a>{product.title}</a>
            </Link>
          </h3>
          <h3 className='font-bold mt-1'>
            <Link href={`/shop/page/1?brand=${product.vendor.slug}`}>
              <a>{product.vendor.title}</a>
            </Link>
          </h3>
          <p className='text-xs mt-1 mb-2'>{product.blurb[locale]}</p>
          <Star rating={rating} />
          <p className='font-bold mt-2'>
            {product.discount > 0
              ? product.priceDiscount.toFixed(0)
              : product.price}
            &euro;
          </p>

          {button ? (
            <button className='button mt-4'>
              {mainPageContent[language].addToCart}
            </button>
          ) : null}
        </div>
      </div>
    )
  } else {
    return <Loading />
  }
}

export default ProductItem
