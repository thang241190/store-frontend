import LeftNav from '@components/sidebar/LeftNav'
import React, { useEffect, useState } from 'react'
import BreadcrumbsComponent from '@components/main/Breadcrumbs'
import { dehydrate, QueryClient, useQuery, UseQueryResult } from 'react-query'
import { GetServerSideProps } from 'next'
import SortBy from '@components/main/SortBy'
import { getAllProducts } from '@src/lib/queries/product'
import ShopProducts from '@components/main/ShopProducts'
import { useRouter } from 'next/router'
import { Auth } from 'aws-amplify'
import { useFavoriteItems } from '@src/hooks/useFavoriteItems'
import { mainPageContent } from '@src/lib/locale/shop'
import useLanguageStore from '@src/lib/store/languageStore'
import Head from 'next/head'

const productsPerPage = 6

const Shop = () => {
  const router = useRouter()
  const language = useLanguageStore((state) => state.language)
  const page = router.query.page_slug as string

  return (
    <div>
      <Head>
        <title>Perfumes - page {page}</title>
      </Head>
      <div className='container'>
        <BreadcrumbsComponent />
        <h1 className='text-3xl font-bold no-underline mt-4'>
          {mainPageContent[language].perfumes}
        </h1>
        <div className='lg:flex mt-4'>
          <div className=''>
            <LeftNav />
          </div>
          <div className='w-full'>
            <SortBy />
            <ShopProducts
              page={parseInt(page)}
              productsPerPage={productsPerPage}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export const getServerSideProps: GetServerSideProps = async ({ query }) => {
  const page = query.page_slug as string
  const queryClient = new QueryClient()
  let sort = query.order as string
  let gender = query.gender as string
  let discount = query.discount as string
  let price = query.price as string[]
  let brand = query.brand as string
  if (sort === undefined) {
    sort = ''
  }
  if (gender === undefined) {
    gender = ''
  }
  if (discount === undefined) {
    discount = 'false'
  }
  if (price === undefined) {
    price = ['']
  }
  if (brand === undefined) {
    brand = ''
  }

  await queryClient.prefetchQuery(['all_products', sort, gender], () =>
    getAllProducts(
      sort,
      gender,
      discount,
      price,
      brand,
      productsPerPage * parseInt(page) - productsPerPage,
      productsPerPage * parseInt(page),
    ),
  )

  return {
    props: {
      dehydratedState: dehydrate(queryClient),
    },
  }
}

export default Shop
