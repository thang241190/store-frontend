import React, { ReactElement } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import useLanguageStore from '@src/lib/store/languageStore'
import { mainPageContent } from '@src/lib/locale/shop'

type Props = {
  currentPage: number
  numberOfProducts: number
  productsPerPage: number
  maxPages: number
  urlName: string
}

export default function Pagination({
  currentPage,
  numberOfProducts,
  productsPerPage,
  maxPages,
  urlName,
}: Props): ReactElement {
  const router = useRouter()
  let totalPages = Math.ceil(numberOfProducts / productsPerPage)
  const language = useLanguageStore((state) => state.language)
  if (currentPage < 1) {
    currentPage = 1
  } else if (currentPage > totalPages) {
    currentPage = totalPages
  }

  let startPage: number, endPage: number

  if (totalPages <= maxPages) {
    // total pages less than max so show all pages
    startPage = 1
    endPage = totalPages
  } else {
    // total pages more than max so calculate start and end pages
    let maxPagesBeforeCurrentPage = Math.floor(maxPages / 2)
    let maxPagesAfterCurrentPage = Math.ceil(maxPages / 2) - 1
    if (currentPage <= maxPagesBeforeCurrentPage) {
      // current page near the start
      startPage = 1
      endPage = maxPages
    } else if (currentPage + maxPagesAfterCurrentPage >= totalPages) {
      // current page near the end
      startPage = totalPages - maxPages + 1
      endPage = totalPages
    } else {
      // current page somewhere in the middle
      startPage = currentPage - maxPagesBeforeCurrentPage
      endPage = currentPage + maxPagesAfterCurrentPage
    }
  }

  const isFirst = currentPage === 1
  const isLast = currentPage === totalPages
  let prevPage, nextPage

  prevPage = `/${urlName}/page/${currentPage - 1}`
  nextPage = `/${urlName}/page/${currentPage + 1}`

  // create an array of pages to ng-repeat in the pager control
  let pages = Array.from(Array(endPage + 1 - startPage).keys()).map(
    (i) => startPage + i,
  )

  let hmm = router.query

  if (hmm.hasOwnProperty('page_slug')) {
    delete hmm['page_slug']
  }

  return (
    <div className='pagination'>
      <ul>
        {!isFirst && (
          <>
            <li>
              <Link href={{ pathname: `/${urlName}/page/1`, query: hmm }}>
                <a>{mainPageContent[language].first}</a>
              </Link>
            </li>
            {currentPage === 2 ? (
              <li>
                <Link
                  href={{
                    pathname: `/${urlName}/page/1`,
                    query: hmm,
                  }}>
                  <a>{mainPageContent[language].prev}</a>
                </Link>
              </li>
            ) : (
              <li>
                <Link href={{ pathname: prevPage, query: hmm }}>
                  <a>{mainPageContent[language].prev}</a>
                </Link>
              </li>
            )}
          </>
        )}

        {pages.map((page) => {
          if (page === 1) {
            return (
              <li key={page} className={page === currentPage ? 'active' : ''}>
                <Link
                  href={{
                    pathname: `/${urlName}/page/1`,
                    query: hmm,
                  }}>
                  <a>{page}</a>
                </Link>
              </li>
            )
          } else {
            return (
              <li key={page} className={page === currentPage ? 'active' : ''}>
                <Link
                  href={{
                    pathname: `/${urlName}/page/${page}`,
                    query: hmm,
                  }}>
                  <a>{page}</a>
                </Link>
              </li>
            )
          }
        })}

        {!isLast && (
          <>
            <li>
              <Link href={{ pathname: nextPage, query: hmm }}>
                <a>{mainPageContent[language].next}</a>
              </Link>
            </li>
            <li>
              <Link
                href={{
                  pathname: `/${urlName}/page/${totalPages.toString()}`,
                  query: hmm,
                }}>
                <a>{mainPageContent[language].last}</a>
              </Link>
            </li>
          </>
        )}
      </ul>
    </div>
  )
}
