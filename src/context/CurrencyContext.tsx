/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState } from 'react';
import type { CurrencyCode, CurrencyConfig } from '../types';
import { useAuth } from './AuthContext';

interface CurrencyContextType {
  currentCurrency: CurrencyCode;
  currencies: CurrencyConfig[];
  setCurrency: (code: CurrencyCode) => void;
  formatMoney: (amountInYER: number, targetCurrency?: CurrencyCode) => string;
  convertFromYER: (amountInYER: number, targetCurrency?: CurrencyCode) => number;
  convertToYER: (amount: number, fromCurrency: CurrencyCode) => number;
  getCurrencySymbol: (code?: CurrencyCode) => string;
}

const defaultCurrencies: CurrencyConfig[] = [
  { code: 'YER', nameAr: 'ريال يمني', nameEn: 'Yemeni Rial', symbol: 'ر.ي', exchangeRateToYER: 1, isBase: true, decimalPlaces: 0 },
  { code: 'SAR', nameAr: 'ريال سعودي', nameEn: 'Saudi Riyal', symbol: 'ر.س', exchangeRateToYER: 140, isBase: false, decimalPlaces: 2 },
  { code: 'USD', nameAr: 'دولار أمريكي', nameEn: 'US Dollar', symbol: '$', exchangeRateToYER: 535, isBase: false, decimalPlaces: 2 },
];

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currencies: serverCurrencies } = useAuth();
  const [currentCurrency, setCurrentCurrency] = useState<CurrencyCode>('YER');

  const currenciesList = (serverCurrencies && serverCurrencies.length > 0) ? serverCurrencies : defaultCurrencies;

  const getCurrencyConfig = (code: CurrencyCode = currentCurrency): CurrencyConfig => {
    return currenciesList.find(c => c.code === code) || currenciesList[0];
  };

  const convertFromYER = (amountInYER: number, targetCurrency: CurrencyCode = currentCurrency): number => {
    const config = getCurrencyConfig(targetCurrency);
    if (!config || config.isBase || config.exchangeRateToYER === 1) {
      return amountInYER;
    }
    return amountInYER / config.exchangeRateToYER;
  };

  const convertToYER = (amount: number, fromCurrency: CurrencyCode): number => {
    const config = getCurrencyConfig(fromCurrency);
    if (!config || config.isBase) return amount;
    return amount * config.exchangeRateToYER;
  };

  const getCurrencySymbol = (code: CurrencyCode = currentCurrency): string => {
    const config = getCurrencyConfig(code);
    return config.symbol;
  };

  const formatMoney = (amountInYER: number, targetCurrency: CurrencyCode = currentCurrency): string => {
    const config = getCurrencyConfig(targetCurrency);
    const converted = convertFromYER(amountInYER, targetCurrency);
    const decimals = config.decimalPlaces ?? (targetCurrency === 'YER' ? 0 : 2);

    const formattedNum = new Intl.NumberFormat('ar-YE', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(converted);

    return `${formattedNum} ${config.symbol}`;
  };

  return (
    <CurrencyContext.Provider
      value={{
        currentCurrency,
        currencies: currenciesList,
        setCurrency: setCurrentCurrency,
        formatMoney,
        convertFromYER,
        convertToYER,
        getCurrencySymbol,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) throw new Error('useCurrency must be used within a CurrencyProvider');
  return context;
};
