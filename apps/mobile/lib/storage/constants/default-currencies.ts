import { CURRENCIES } from '@nuts/constants';
import type { DBNewCurrency } from '@nuts/types/storage';

export const defaultCurrencies: DBNewCurrency[] = CURRENCIES.map((c) => ({
  code: c.code,
  name: c.name,
}));
