import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

import {
  fetchStorefrontCategories,
} from '../lib/catalogService'

import Earrings from './Earrings'
import Necklaces from './Necklaces'
import Bracelets from './Bracelets'
import Rings from './Rings'
import CategoryPage from './CategoryPage'

function CategoryRouter() {
  const { categorySlug } = useParams()

  const [category, setCategory] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    async function loadCategory() {
      try {
        setLoading(true)

        const categories =
          await fetchStorefrontCategories()

        if (!mounted) {
          return
        }

        const normalizedSlug =
          categorySlug
            ?.trim()
            .toLowerCase()

        const foundCategory =
          categories.find(
            (item) =>
              item.slug
                ?.trim()
                .toLowerCase() ===
              normalizedSlug
          )

        setCategory(
          foundCategory || null
        )
      } catch (error) {
        console.error(
          'Failed to load category:',
          error
        )

        if (mounted) {
          setCategory(null)
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    loadCategory()

    return () => {
      mounted = false
    }
  }, [categorySlug])

  if (loading) {
    return (
      <div
        style={{
          minHeight: '50vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        Loading category...
      </div>
    )
  }

  if (!category) {
    return <CategoryPage />
  }

  const slug =
    category.slug
      ?.trim()
      .toLowerCase()

  switch (slug) {
    case 'earrings':
      return <Earrings />

    case 'necklaces':
      return <Necklaces />

    case 'bracelets':
      return <Bracelets />

    case 'rings':
      return <Rings />

    default:
      return <CategoryPage />
  }
}

export default CategoryRouter