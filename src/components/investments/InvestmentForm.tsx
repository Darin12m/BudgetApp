"use client";

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Save, Trash2, AlertCircle, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { Investment } from '@/hooks/use-investment-data';
import { fetchSingleCryptoPrice, fetchStockPrice, fetchCompanyProfile, getCoingeckoId } from '@/lib/api';
import LivePriceDisplay from './LivePriceDisplay';
import { toast } from 'sonner';
import { useCurrency } from '@/context/CurrencyContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useTranslation } from 'react-i18next'; // Import useTranslation
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface InvestmentFormProps {
  investment: Investment | null;
  onSave: (investment: Omit<Investment, 'id' | 'ownerUid' | 'previousPrice' | 'change24hPercent'>) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

const InvestmentForm: React.FC<InvestmentFormProps> = ({ investment, onSave, onDelete, onClose }) => {
  const { t } = useTranslation(); // Initialize useTranslation hook
  const { formatCurrency, formatUSD, selectedCurrency, convertInputToUSD, convertUSDToSelected } = useCurrency();
  const [name, setName] = useState(investment?.name || '');
  const [type, setType] = useState<'Stock' | 'Crypto'>(investment?.type || 'Stock');
  const [quantity, setQuantity] = useState(investment?.quantity.toString() || '');
  const [buyPrice, setBuyPrice] = useState(investment?.buyPrice ? convertUSDToSelected(investment.buyPrice).toString() : '');
  const [datePurchased, setDatePurchased] = useState(investment?.datePurchased || format(new Date(), 'yyyy-MM-dd'));
  const [symbolOrId, setSymbolOrId] = useState(investment?.symbol || investment?.coingeckoId || '');
  const [companyName, setCompanyName] = useState(investment?.companyName || null);

  const [livePrice, setLivePrice] = useState<number | null>(null);
  const [livePriceLoading, setLivePriceLoading] = useState(false);
  const [livePriceError, setLivePriceError] = useState<string | null>(null);

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const getFormErrors = useCallback(() => {
    const newErrors: { [key: string]: string } = {};
    if (!name.trim()) newErrors.name = t("investments.assetNameRequired");
    if (!quantity || parseFloat(quantity) <= 0) newErrors.quantity = t("investments.quantityPositive");
    if (isNaN(parseFloat(quantity))) newErrors.quantity = t("investments.quantityInvalid");
    if (!buyPrice || parseFloat(buyPrice) <= 0) newErrors.buyPrice = t("investments.buyPricePositive");
    if (isNaN(parseFloat(buyPrice))) newErrors.buyPrice = t("investments.buyPriceInvalid");
    if (!datePurchased) newErrors.datePurchased = t("investments.datePurchasedRequired");
    if (new Date(datePurchased) > new Date()) newErrors.datePurchased = t("investments.datePurchasedFuture");

    if (!symbolOrId.trim()) {
      newErrors.symbolOrId = type === 'Stock' ? t("investments.tickerSymbolRequired") : t("investments.coinSymbolOrIdRequired");
    } else {
      if (type === 'Stock' && !/^[A-Z0-9.-]+$/.test(symbolOrId.toUpperCase())) {
        newErrors.symbolOrId = t("investments.invalidTickerFormat");
      }
    }

    if (livePriceError) {
      newErrors.livePrice = livePriceError;
    } else if (!livePriceLoading && livePrice === null && symbolOrId.trim()) {
      newErrors.livePrice = t("investments.livePriceNotAvailable");
    }
    return newErrors;
  }, [name, quantity, buyPrice, datePurchased, symbolOrId, type, livePrice, livePriceLoading, livePriceError, t]);

  const fetchAndSetLivePrice = useCallback(async (currentSymbolOrId: string, currentType: 'Stock' | 'Crypto') => {
    if (!currentSymbolOrId.trim()) {
      setLivePrice(null);
      setLivePriceError(null);
      setCompanyName(null);
      return;
    }

    setLivePriceLoading(true);
    setLivePriceError(null);
    setCompanyName(null);

    let fetchedPrice: number | null = null;
    let fetchedName: string | null = null;
    let errorMsg: string | null = null;

    if (currentType === 'Stock') {
      const [priceResult, profileResult] = await Promise.all([
        fetchStockPrice(currentSymbolOrId),
        fetchCompanyProfile(currentSymbolOrId)
      ]);
      if (priceResult.price !== null) {
        fetchedPrice = priceResult.price;
        if (profileResult.name !== null) {
          fetchedName = profileResult.name;
        }
      }
      errorMsg = priceResult.error || profileResult.error;
      if (fetchedPrice === null && !errorMsg) {
        errorMsg = t("investments.invalidTickerOrPriceUnavailable");
      }
    } else {
      const result = await fetchSingleCryptoPrice(currentSymbolOrId);
      fetchedPrice = result.price;
      fetchedName = result.name;
      errorMsg = result.error;
      if (fetchedPrice === null && !errorMsg) {
        errorMsg = t("investments.invalidCryptoOrPriceUnavailable");
      }
    }

    setLivePrice(fetchedPrice);
    setCompanyName(fetchedName);
    setLivePriceError(errorMsg);
    setLivePriceLoading(false);
  }, [t]);

  useEffect(() => {
    if (investment) {
      setName(investment.name);
      setType(investment.type);
      setQuantity(investment.quantity.toString());
      setBuyPrice(convertUSDToSelected(investment.buyPrice).toString());
      setDatePurchased(investment.datePurchased);
      setSymbolOrId(investment.symbol || investment.coingeckoId || '');
      setCompanyName(investment.companyName || null);
      setLivePrice(investment.currentPrice);
      setLivePriceError(null);
    } else {
      setName('');
      setType('Stock');
      setQuantity('');
      setBuyPrice('');
      setDatePurchased(format(new Date(), 'yyyy-MM-dd'));
      setSymbolOrId('');
      setCompanyName(null);
      setLivePrice(null);
      setLivePriceError(null);
    }
    setErrors({});
  }, [investment, convertUSDToSelected]);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      fetchAndSetLivePrice(symbolOrId, type);
    }, 500);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [type, symbolOrId, fetchAndSetLivePrice]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const currentErrors = getFormErrors();
    setErrors(currentErrors);

    if (Object.keys(currentErrors).length > 0) {
      toast.error(t("common.error"));
      return;
    }

    if (livePrice === null) {
      toast.error(t("investments.cannotSaveLivePrice"));
      return;
    }

    const buyPriceInUSD = convertInputToUSD(parseFloat(buyPrice));

    onSave({
      name,
      type,
      quantity: parseFloat(quantity),
      buyPrice: buyPriceInUSD,
      currentPrice: livePrice,
      datePurchased,
      symbol: type === 'Stock' ? symbolOrId.toUpperCase() : undefined,
      coingeckoId: type === 'Crypto' ? getCoingeckoId(symbolOrId) : undefined,
      companyName: companyName,
      lastPrice: livePrice,
      priceSource: type === 'Stock' ? 'Finnhub' : 'CoinGecko',
      lastUpdated: new Date().toISOString(),
      inputCurrencyCode: selectedCurrency.code,
    });
  };

  const handleDeleteClick = () => {
    if (investment?.id) {
      onDelete(investment.id);
      setIsDeleteConfirmOpen(false);
    }
  };

  const handleRefreshPrice = useCallback(() => {
    fetchAndSetLivePrice(symbolOrId, type);
  }, [symbolOrId, type, fetchAndSetLivePrice]);

  const isSaveDisabled = Object.keys(getFormErrors()).length > 0 || livePriceLoading || livePrice === null;

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 py-4">
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="name" className="text-right">
          {t("investments.assetName")}
        </Label>
        <div className="col-span-3">
          <Input id="name" value={name} onChange={(e) => { setName(e.target.value); setErrors(prev => ({ ...prev, name: '' })); }} className="bg-muted/50 border-none focus-visible:ring-primary focus-visible:ring-offset-0 min-h-[44px]" />
          {errors.name && <p className="text-destructive text-xs mt-1">{errors.name}</p>}
        </div>
      </div>

      <div className="grid grid-cols-4 items-center gap-4">
        <Label className="text-right">
          {t("investments.type")}
        </Label>
        <ToggleGroup
          type="single"
          value={type}
          onValueChange={(value: 'Stock' | 'Crypto') => {
            if (value) {
              setType(value);
              setSymbolOrId('');
              setLivePrice(null);
              setLivePriceError(null);
              setCompanyName(null);
              setErrors(prev => ({ ...prev, symbolOrId: '', livePrice: '' }));
            }
          }}
          className="col-span-3 justify-start"
        >
          <ToggleGroupItem value="Stock" aria-label="Toggle Stock" className="px-4 py-2 rounded-xl data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-sm min-h-[44px]">
            {t("investments.stock")}
          </ToggleGroupItem>
          <ToggleGroupItem value="Crypto" aria-label="Toggle Crypto" className="px-4 py-2 rounded-xl data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-sm min-h-[44px]">
            {t("investments.crypto")}
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="symbolOrId" className="text-right">
          {type === 'Stock' ? t("investments.tickerSymbol") : t("investments.coinSymbolOrId")}
        </Label>
        <div className="col-span-3">
          <Input
            id="symbolOrId"
            value={symbolOrId}
            onChange={(e) => { setSymbolOrId(e.target.value); setErrors(prev => ({ ...prev, symbolOrId: '' })); }}
            placeholder={type === 'Stock' ? t("investments.tickerSymbolPlaceholder") : t("investments.coinSymbolOrIdPlaceholder")}
            className="bg-muted/50 border-none focus-visible:ring-primary focus-visible:ring-offset-0 min-h-[44px]"
          />
          {errors.symbolOrId && <p className="text-destructive text-xs mt-1">{errors.symbolOrId}</p>}
          {companyName && type === 'Stock' && !errors.symbolOrId && (
            <p className="text-muted-foreground text-xs mt-1">{companyName}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-4 items-center gap-4">
        <Label className="text-right">
          {t("investments.buyPrice")}
        </Label>
        <div className="col-span-3">
          <Input id="buyPrice" type="number" step="0.01" value={buyPrice} onChange={(e) => { setBuyPrice(e.target.value); setErrors(prev => ({ ...prev, buyPrice: '' })); }} placeholder={`${selectedCurrency.symbol} 150.00`} className="bg-muted/50 border-none focus-visible:ring-primary focus-visible:ring-offset-0 min-h-[44px] font-mono" />
          {errors.buyPrice && <p className="text-destructive text-xs mt-1">{errors.buyPrice}</p>}
        </div>
      </div>

      <div className="grid grid-cols-4 items-center gap-4">
        <Label className="text-right">
          {t("investments.livePrice")}
        </Label>
        <div className="col-span-3 flex items-center space-x-2">
          <LivePriceDisplay price={livePrice} loading={livePriceLoading} error={livePriceError} />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleRefreshPrice}
            disabled={livePriceLoading || !symbolOrId.trim()}
            className="h-8 w-8 text-muted-foreground"
          >
            <RefreshCw className={`h-4 w-4 ${livePriceLoading ? 'animate-spin' : ''}`} />
          </Button>
          {errors.livePrice && <p className="text-destructive text-xs mt-1">{errors.livePrice}</p>}
        </div>
      </div>

      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="quantity" className="text-right">
          {t("investments.quantity")}
        </Label>
        <div className="col-span-3">
          <Input id="quantity" type="number" step="0.0001" value={quantity} onChange={(e) => { setQuantity(e.target.value); setErrors(prev => ({ ...prev, quantity: '' })); }} className="bg-muted/50 border-none focus-visible:ring-primary focus-visible:ring-offset-0 min-h-[44px] font-mono" />
          {errors.quantity && <p className="text-destructive text-xs mt-1">{errors.quantity}</p>}
        </div>
      </div>
      
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="datePurchased" className="text-right">
          {t("investments.datePurchased")}
        </Label>
        <div className="col-span-3">
          <Input id="datePurchased" type="date" value={datePurchased} onChange={(e) => { setDatePurchased(e.target.value); setErrors(prev => ({ ...prev, date: '' })); }} className="bg-muted/50 border-none focus-visible:ring-primary focus-visible:ring-offset-0 min-h-[44px]" />
          {errors.datePurchased && <p className="text-destructive text-xs mt-1">{errors.datePurchased}</p>}
          {new Date(datePurchased) > new Date() && (
            <p className="text-amber-500 text-xs mt-1 flex items-center">
              <AlertCircle className="w-3 h-3 mr-1" /> {t("investments.datePurchasedFutureWarning")}
            </p>
          )}
        </div>
      </div>
      <div className="flex flex-col sm:flex-row sm:justify-between gap-2 mt-4">
        {investment && (
          <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
            <AlertDialogTrigger asChild>
              <Button type="button" variant="destructive" className="w-full sm:w-auto">
                <Trash2 className="h-4 w-4 mr-2" /> {t("common.delete")}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="glassmorphic-card">
              <AlertDialogHeader>
                <AlertDialogTitle>{t("common.areYouSure")}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t("investments.investmentDeleteConfirmation", { investmentName: investment.name })}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="bg-muted/50 border-none hover:bg-muted">{t("common.cancel")}</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteClick} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">{t("common.delete")}</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
        <div className="flex gap-2 w-full sm:w-auto">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">
            {t("common.cancel")}
          </Button>
          <Button type="submit" disabled={isSaveDisabled} className="flex-1">
            <Save className="h-4 w-4 mr-2" /> {t("common.save")}
          </Button>
        </div>
      </div>
    </form>
  );
};

export default InvestmentForm;