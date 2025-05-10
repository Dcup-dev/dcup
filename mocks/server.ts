import { setupServer } from 'msw/node';

import { handlers, scenarios } from './handlers';
export const mockServer = setupServer(...scenarios['zeroFile'], ...handlers);
