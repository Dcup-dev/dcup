export type PLAN = {
  connections: number,
  pages: number,
  retrievals: number,
}

export const Plans = {
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
    price: 14.99
  },
  PRO: {
    connections: Infinity,
    pages: 100,
    retrievals: 500,
    price: 29.99
  },
  BUSINESS: {
    connections: Infinity,
    pages: 5_000,
    retrievals: 10_000,
    price: 59.99,
  },
  ENTERPRISE: {
    connections: Infinity,
    pages: 10_000,
    retrievals: Infinity,
    price: 399.99,
  },
  OS: {
    connections: Infinity,
    pages: Infinity,
    retrievals: Infinity,
    price: 0,
  }
}

export function calculateRemainingPages(plan: PLAN, conns: any[], currentConnectionId?: string, pageLimit?: string): number {
  const pageProcessed = conns
    .filter(c => c.id !== currentConnectionId)
    .flatMap(conn => conn.files || [])
    .reduce((sum, file) => sum + (file.totalPages || 0), 0);
  const remainingPages = plan.pages - pageProcessed;

  if (remainingPages <= 0) {
    throw new Error(
      `You’ve reached your processing limits for your current plan` +
      ` please upgrade your subscription.`
    );
  }

  const limits = Number(pageLimit)

  if (limits) {
    if (limits > remainingPages) {
      throw new Error(
        `You requested to process ${pageLimit} pages, but your ` +
        `Your current plan only allows ${remainingPages} ` +
        `more pages this billing period. Please lower the page count or upgrade your plan.`
      );
    } else {
      return limits
    }
  } else {
    return remainingPages
  }
}
