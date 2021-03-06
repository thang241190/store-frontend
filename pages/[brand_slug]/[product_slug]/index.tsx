import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Image from 'next/image'
import BreadcrumbsComponent from '@components/main/Breadcrumbs'
import Link from 'next/link'
import { AiFillHeart } from 'react-icons/ai'
import Star from '@components/main/Star'
import ProductItem from '@components/main/ProductItem'
import { useProductDetail } from '@src/hooks/useProductDetail'
import Loading from '@components/Loading'
import { GetServerSideProps } from 'next'
import { getProductDetail } from '@src/lib/queries/product'
import {
  dehydrate,
  QueryClient,
  useMutation,
  useQueryClient,
} from 'react-query'
import { useNextSanityImage } from 'next-sanity-image'
import { client } from '@src/lib/client'
import useLanguageStore from '@src/lib/store/languageStore'
import Comment from '@components/main/Comment'
import { useCart } from 'react-use-cart'
import { CURRENCY } from '@src/config/cart'
import { Auth } from 'aws-amplify'
import { serializers } from '@config/serializer'
import { mainPageContent } from '@src/lib/locale/shop'
import { productPageContent } from '@src/lib/locale/product'
import Head from 'next/head'
import { useFavoriteList } from '@src/hooks/useFavoriteList'
import { postFavorite } from '@src/lib/queries/favorite'

const BlockContent = require('@sanity/block-content-to-react')

const ProductDetail = () => {
  const language = useLanguageStore((state) => state.language)
  const router = useRouter()
  const { addItem } = useCart()
  const slug = router.query.product_slug as string
  const brand_slug = router.query.brand_slug as string
  const { isLoading, isError, error, data } = useProductDetail(brand_slug, slug)
  const [items, setItems] = useState<ProductVariant[]>([])
  const [currentSize, setCurrentSize] = useState<string>('')
  const [price, setPrice] = useState<PriceType>({
    size: 0,
    price: 0,
    discount: 0,
    sku: 0,
  })
  useEffect(() => {
    let hmm: ProductVariant[] = []
    if (data?.defaultProductVariant) {
      hmm.push({ ...data.defaultProductVariant, main: true })
    }
    if (data?.variants) {
      data.variants.map((product) => hmm.push({ ...product, main: false }))
    }
    hmm.sort(function (a, b) {
      return b.ml - a.ml
    })

    const setPriceDefault = () => {
      const lbmc = hmm.filter((item) => item.main === true)[0].ml
      const filteredItem = hmm.filter((item) => item.ml === lbmc)[0]
      setPrice({
        size: lbmc,
        price: filteredItem.price,
        discount: filteredItem.discount ? filteredItem.discount : 0,
        sku: filteredItem.sku,
      })
      setCurrentSize(lbmc.toString())
    }

    if (router.query.size !== undefined || router.query.size === '') {
      const size = router.query.size as string
      const filteredItem = hmm.filter((item) => item.ml.toString() === size)[0]

      if (filteredItem !== undefined) {
        setCurrentSize(size)
        setPrice({
          size: parseInt(size),
          price: filteredItem.price,
          discount: filteredItem.discount ? filteredItem.discount : 0,
          sku: filteredItem.sku,
        })
      } else {
        setPriceDefault()
      }
    } else {
      setPriceDefault()
    }

    setItems(hmm)
  }, [data, router.query.size])

  const [swap, setSwap] = useState<boolean>(true)

  const handleSelectedVariant = (size: string) => {
    let path = router.pathname
    let hmm = { ...router.query, size: size }
    setCurrentSize(size)
    router.push(
      {
        pathname: path,
        query: hmm,
      },
      undefined,
      { shallow: true },
    )
  }

  const handleAddToCart = (data: ProductDetailType, price: PriceType) => {
    addItem({
      id: price.size ? data.id + price.size.toString() : data.id + currentSize,
      currency: CURRENCY,
      price: (price.price * (100 - price.discount)) / 100,
      name: data.title,
      image: data.images,
      size: price.size,
      href: `/${data.vendor.slug}/${data.slug}`,
    })
    setTimeout(async () => {
      try {
        await Auth.currentAuthenticatedUser()
      } catch (error) {
        router.push('/profile')
      }
    }, 100)
  }
  const [userId, setUserId] = useState('')
  const [profile, setProfile] = useState<IProfile>()
  const queryClient = useQueryClient()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await Auth.currentAuthenticatedUser()
        setProfile(user.attributes)
        setUserId(user.username)
      } catch (error) {}
    }
    checkAuth()
  }, [])
  const favoriteList = useFavoriteList(profile?.email as string)
  const mutation = useMutation(
    (newFav: string[]) =>
      postFavorite(userId, profile?.email as string, newFav),
    {
      onMutate: async () => {
        let favArray: string[] = []
        if (favoriteList.data?.products !== undefined) {
          favArray = favoriteList.data?.products
        }
        const hmm: ProductType[] | undefined = queryClient.getQueryData([
          'favorite_items',
        ])
        if (favorite) {
          queryClient.setQueriesData(
            ['favorite_list', profile?.email as string],
            {
              products: favArray.filter(
                (item) => item !== (data?.id as string),
              ),
            },
          )

          if (hmm !== undefined) {
            queryClient.setQueriesData(
              ['favorite_items'],
              hmm.filter(
                (item: ProductType) => item.id !== (data?.id as string),
              ),
            )
          }
        } else {
          queryClient.setQueriesData(
            ['favorite_list', profile?.email as string],
            { products: favArray.concat(data?.id as string) },
          )
        }
      },
    },
  )

  const handleFavoriteToggle = () => {
    let favArray: string[] = []
    if (favoriteList.data?.products) {
      favArray = favoriteList.data?.products
    }
    if (favorite) {
      mutation.mutate(favArray.filter((item) => item !== (data?.id as string)))
    } else {
      mutation.mutate(favArray.concat(data?.id as string))
    }
  }

  let favorite = false
  if (favoriteList.data) {
    favorite = favoriteList.data.products.includes(data?.id as string)
  }

  if (isLoading) {
    return <Loading />
  }

  if (isError) {
    return (
      <div>
        <p>{error?.message}</p>
      </div>
    )
  }
  if (data === undefined) {
    return (
      <div className='container text-center text-2xl font-bold mt-12'>
        {mainPageContent[language].noItem}
      </div>
    )
  } else {
    const imageProps = useNextSanityImage(client, data.images)
    const language = useLanguageStore((state) => state.language)
    let rating: number = 0
    let total: number = 0
    let count: number = 0
    data.comments.map((comment) => {
      if (comment.rating) {
        total += comment.rating
        count++
      }
    })
    rating = total / count

    return (
      <div>
        <Head>
          <title>{data.title}</title>
        </Head>
        <div className='container'>
          <div className='md:hidden'>
            <BreadcrumbsComponent />
          </div>
          <div className='md:hidden'>
            <h2 className='mt-4 text-xl'>
              <Link href={`/shop/page/1?brand=${data.vendor.slug}`}>
                <a>{data.vendor.title}</a>
              </Link>
            </h2>
            <h1 className='no-underline text-3xl mt-4 font-bold'>
              {data.title}
            </h1>
          </div>
          <div className='md:flex flex-row'>
            <div className='md:w-2/5 mt-6 md:mt-0 text-center'>
              <Image
                {...imageProps}
                layout='intrinsic'
                height={400}
                width={200}
                alt={data.title}
              />
            </div>
            <div className='md:w-3/5'>
              <div className='hidden md:block'>
                <BreadcrumbsComponent />
                <h2 className='mt-4 text-lg'>
                  <Link href={`/shop/page/1?brand=${data.vendor.slug}`}>
                    <a>{data.vendor.title}</a>
                  </Link>
                </h2>
                <h1 className='no-underline text-2xl font-bold'>
                  {data.title}
                </h1>
                <h2 className=' text-lg mb-2 mt-2'>{data.blurb[language]}</h2>
                <Star rating={rating} />
              </div>
              {data.discount ? (
                <p>
                  <span className='py-1 px-2 bg-red-500 text-white uppercase md:text-xs mt-2 inline-block'>
                    {productPageContent[language].sales}
                  </span>
                </p>
              ) : null}
              <p className='flex flex-row justify-between mt-6 pb-2'>
                <span className='text-xl leading-10 bottle-size'>
                  {price.size}ml
                </span>
                <span className='text-4xl leading-8'>
                  {price.discount > 0 ? (
                    <span>
                      <span className='line-through text-lg text-red-500'>
                        {price.price}&euro;
                      </span>{' '}
                      <span className=''>
                        {(price.price * (100 - price.discount)) / 100}
                      </span>
                    </span>
                  ) : (
                    price.price
                  )}
                  &euro;
                </span>
              </p>
              <hr />
              <p className='mt-6 flex flex-row gap-1'>
                {items.map((item) => (
                  <button
                    onClick={() => handleSelectedVariant(item.ml.toString())}
                    key={item.title}
                    className={`choose-size relative inline-block pl-3 py-1.5 md:pr-8 border border-solid w-1/3 md:w-auto ${
                      currentSize === item.ml.toString()
                        ? 'border-gray-400 cursor-default'
                        : 'border-gray-100 bg-gray-100 hover:bg-gray-200'
                    }`}>
                    <span className='text-sm'>{item.title}</span>
                    <br />
                    <span className='font-bold text-sm'>
                      {item.discount !== undefined
                        ? (item.price * (100 - item.discount)) / 100
                        : item.price}
                      &euro;
                    </span>
                    {item.discount && item.discount > 0 ? (
                      <span className='absolute top-0 right-0 text-sm overflow-hidden h-8 w-8'>
                        <span className='inline-block h-11 w-11 bg-red-500 -rotate-45 transform origin-top-left'></span>
                        <span className='absolute left-1/2 top-1/2 text-white text-xs inline-block -mt-3 ml-0.5'>
                          %
                        </span>
                      </span>
                    ) : null}
                  </button>
                ))}
              </p>
              <p className='mt-4'>
                {price.sku > 0 ? (
                  <span className='text-green-600'>
                    {productPageContent[language].inStock}
                  </span>
                ) : (
                  <span className='text-red-600'>
                    {productPageContent[language].outStock}
                  </span>
                )}
              </p>
              <p className='mt-4'>
                <button
                  onClick={() => handleAddToCart(data, price)}
                  className={`button add-to-cart ${
                    price.sku < 1 ? 'disabled' : ''
                  }`}>
                  {mainPageContent[language].addToCart}
                </button>
              </p>
              <p className='mt-4'>
                {profile ? (
                  <button
                    className={`flex hover:text-red-500 ${
                      favorite ? 'text-red-500' : 'text-black'
                    }`}
                    onClick={handleFavoriteToggle}>
                    <AiFillHeart className='text-xl mr-2' />
                    <span className='text-sm'>
                      {favorite
                        ? mainPageContent[language].addedFav
                        : mainPageContent[language].addFav}
                    </span>
                  </button>
                ) : null}
              </p>
            </div>
          </div>
          <div>
            <p className='flex flex-row gap-8 mt-6 border-b border-solid border-gray-400'>
              <button
                className={`text-sm py-2  border-solid border-transparent hover:border-black ${
                  swap ? 'border-b-2 border-black' : 'border-b'
                }`}
                onClick={() => setSwap(true)}>
                {mainPageContent[language].description}
              </button>
              <button
                className={`text-sm py-2  border-solid border-transparent hover:border-black ${
                  !swap ? 'border-b-2 border-black' : 'border-b'
                }`}
                onClick={() => setSwap(false)}>
                {mainPageContent[language].review}
              </button>
            </p>
            <div
              className={`${
                swap ? 'block md:flex' : 'hidden'
              }  flex-row mt-4 md:mt-8 gap-8`}>
              <div className='content md:w-3/4'>
                <h3 className='text-lg md:text-3xl tracking-tight mb-2 md:mb-6'>
                  <span className='font-bold'>
                    {productPageContent[language].description}
                  </span>{' '}
                  {data.title}
                </h3>
                <BlockContent
                  blocks={data.body[language]}
                  imageOptions={{ w: 640, fit: 'max' }}
                  projectId={process.env.NEXT_PUBLIC_PROJECT_ID}
                  dataset={process.env.NEXT_PUBLIC_DATASET}
                  serializers={serializers}
                />
              </div>
              <div className='md:w-1/4 text-sm mt-6 md:mt-0'>
                <h3 className='text-xl md:text-3xl tracking-tight mb-6'>
                  <span className='font-bold'>
                    {productPageContent[language].ingredients}
                  </span>
                </h3>
                <h4 className='font-bold mt-2'>
                  {productPageContent[language].topNotes}
                </h4>
                <p className='mt-2'>{data.top_notes[language]}</p>
                <h4 className='font-bold mt-2'>
                  {productPageContent[language].middleNotes}
                </h4>
                <p className='mt-2'>{data.middle_notes[language]}</p>
                <h4 className='font-bold mt-2'>
                  {productPageContent[language].baseNotes}
                </h4>
                <p className='mt-2'>{data.base_notes[language]}</p>
              </div>
            </div>
            <div className={`${swap ? 'hidden' : 'block'} mt-4 md:mt-8`}>
              <Comment id={data.id} title={data.title} />
              <div className='mt-8 pt-2 border-t border-solid border-gray-400'>
                {data.comments.length > 0 ? (
                  data.comments.map((comment) => (
                    <div className='mt-4' key={comment.id}>
                      <div className='text-sm'>{comment.comment}</div>
                      <p className='flex flex-row mt-2 text-xs leading-4'>
                        <Star rating={comment.rating} />
                        <span className='font-bold mr-2 ml-4'>
                          {comment.email}
                        </span>
                        {comment.date}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className='mt-4 text-lg'>
                    {mainPageContent[language].noReview}
                  </div>
                )}
              </div>
            </div>
          </div>
          {data.related.length > 0 ? (
            <>
              <h2 className='text-xl md:text-2xl font-bold mt-8'>
                {mainPageContent[language].related}
              </h2>
              <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 md:mt-8'>
                {data.related.map((product) => (
                  <ProductItem product={product} key={product.id} />
                ))}
              </div>
            </>
          ) : null}
        </div>
      </div>
    )
  }
}

export const getServerSideProps: GetServerSideProps = async ({ query }) => {
  const queryClient = new QueryClient()
  const slug = query.product_slug as string
  const brand_slug = query.brand_slug as string

  await queryClient.prefetchQuery(['product_detail: ' + slug], () =>
    getProductDetail(brand_slug, slug),
  )

  return {
    props: {
      dehydratedState: dehydrate(queryClient),
    },
  }
}

export default ProductDetail
