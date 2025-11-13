import { CURRENCIES as ALL_CURRENCIES, getCurrencySymbol as getSymbol } from '@nuts/constants';
import type { Currency as SharedCurrency } from '@nuts/types';

export interface Currency {
  code: string;
  name: string;
  symbol: string;
}

const POPULAR_CURRENCY_CODES = [
  'USD',
  'EUR',
  'GBP',
  'JPY',
  'CNY',
  'INR',
  'CAD',
  'AUD',
  'CHF',
  'NGN',
  'GHS',
  'KES',
  'ZAR',
  'XOF',
  'XAF',
  'BRL',
  'MXN',
  'RUB',
  'KRW',
  'SGD',
  'HKD',
  'NZD',
  'SEK',
  'NOK',
  'DKK',
  'PLN',
  'TRY',
  'AED',
  'SAR',
];

export const CURRENCIES: Currency[] = ALL_CURRENCIES.filter(
  (c): c is SharedCurrency & { symbol: string } =>
    POPULAR_CURRENCY_CODES.includes(c.code) && c.symbol !== undefined
);

export const getCurrencySymbol = getSymbol;
