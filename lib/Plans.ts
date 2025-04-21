
export const Plans ={
  FREE: {
    connections: 1,
    pages: 10,
    retrievals: 20,
    price: 0
  },
  BASIC: {
    connections: 10,
    pages: 50,
    retrievals: 250,
    price: 24.99
  },
  PRO: {
    connections:Infinity,
    pages: 100,
    retrievals: 500,
    price: 49.99
  },
  BUSINESS: {
    connections: Infinity,
    pages: 5_000,
    retrievals: 10_000,
    price: 99.99,
  },
  ENTERPRISE: {
    connections: Infinity,
    pages: 10_000,
    retrievals: Infinity,
    price: 499.99,
  },
  OS: {
    connections: Infinity,
    pages: Infinity,
    retrievals: Infinity,
    price: 0,
  }
}
