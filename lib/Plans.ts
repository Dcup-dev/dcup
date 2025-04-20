
export const Plans ={
  FREE: {
    connections: 1,
    pages: 10,
    retrievals: 20,
    price: 0
  },
  BASIC: {
    connections: 10000,
    pages: 100,
    retrievals: 500,
    price: 50
  },
  PRO: {
    connections: 100_000,
    pages: 1_000,
    retrievals: 5_000,
    price: 100
  },
  BUSINESS: {
    connections: 1_000_000,
    pages: 10_000,
    retrievals: 100_000,
    price: 500,
  },
  ENTERPRISE: {
    connections: 1_000_000,
    pages: 1_000_000,
    retrievals: 1_000_000,
    price: 1_000_000,
  }
}
