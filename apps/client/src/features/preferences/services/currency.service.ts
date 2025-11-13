import { CURRENCIES } from "@nuts/constants";
import { ResultAsync } from "neverthrow";
import type { ServiceError } from "@/lib/result";
import type { Currency } from "@nuts/types";

interface CurrencyInfo {
  code: string;
  name: string;
}

function createCurrencyService() {
  const getCurrencies = (): ResultAsync<CurrencyInfo[], ServiceError> => {
    const currencies: CurrencyInfo[] = CURRENCIES.map((currency: Currency) => ({
      code: currency.code,
      name: currency.name,
    }));

    return ResultAsync.fromSafePromise(Promise.resolve(currencies));
  };

  return {
    getCurrencies,
  };
}

export const currencyService = createCurrencyService();
