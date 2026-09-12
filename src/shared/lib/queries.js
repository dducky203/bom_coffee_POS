import { categoryApi, productApi, tableApi, toppingApi } from './api'

const noRefetch = {
  refetchOnMount: false,
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
}

export const catalogOptions = {
  staleTime: Infinity,
  gcTime: 60 * 60 * 1000,
  ...noRefetch,
}

export const tablesQuery = {
  queryKey: ['tables'],
  queryFn: () => tableApi.list(false),
  staleTime: 30_000,
  gcTime: 60 * 60 * 1000,
  refetchOnMount: true,
  refetchOnWindowFocus: true,
}

export const categoriesQuery = {
  queryKey: ['categories'],
  queryFn: () => categoryApi.list(),
  ...catalogOptions,
}

export const productsQuery = {
  queryKey: ['products'],
  queryFn: () => productApi.list(),
  ...catalogOptions,
}

export const toppingsQuery = {
  queryKey: ['toppings'],
  queryFn: () => toppingApi.list(false),
  ...catalogOptions,
}

export function prefetchCatalog(queryClient) {
  queryClient.prefetchQuery(tablesQuery)
  queryClient.prefetchQuery(categoriesQuery)
  queryClient.prefetchQuery(productsQuery)
  queryClient.prefetchQuery(toppingsQuery)
}
