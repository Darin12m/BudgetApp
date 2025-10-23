"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"; // For segmented control
import { Save, Trash2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { Investment } from '@/hooks/use-investment-data';
import { fetchSingleCryptoPrice, fetchSingleStockPrice, getCoingeckoId } from '@/lib/api'; // Import API functions
import LivePriceDisplay from './LivePriceDisplay'; // New component

interface InvestmentFormProps {
  investment: Investment | null;
  onSave: (investment: Omit<Investment, 'id' | 'ownerUid' | 'previousPrice'>) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

const InvestmentForm: React.FC<InvestmentFormProps> = ({ investment, onSave, onDelete, onClose }) => {
  const [name, setName] = useState(investment?.name || '');
  const [type, setType] = useState<'Stock' | 'Crypto'>(investment?.type || 'Stock');
  const [quantity, setQuantity] = useState(investment?.quantity.toString() || '');
  const [buyPrice, setBuyPrice] = useState(investment?.buyPrice.toString() || '');
  const [datePurchased, setDatePurchased] = useState(investment?.datePurchased || format(new Date(), 'yyyy-MM-dd'));
  const [symbolOrId, setSymbolOrId] = useState(investment?.symbol || investment?.coingeckoId || '');

  const [livePrice, setLivePrice] = useState<number | null>(null);
  const [livePriceLoading, setLivePriceLoading] = useState(false);
  const [livePriceError, setLivePriceError] = useState<string | null>(null);

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Effect to populate form when an investment is selected for editing
  useEffect(() => {
    if (investment) {
      setName(investment.name);
      setType(investment.type);
      setQuantity(investment.quantity.toString());
      setBuyPrice(investment.buyPrice.toString());
      setDatePurchased(investment.datePurchased);
      setSymbolOrId(investment.symbol || investment.coingeckoId || '');
      setLivePrice(investment.currentPrice); // Use currentPrice as initial live price
    } else {
      // Reset form for new investment
      setName('');
      setType('Stock');
      setQuantity('');
      setBuyPrice('');
      setDatePurchased(format(new Date(), 'yyyy-MM-dd'));
      setSymbolOrId('');
      setLivePrice(null);
    }
    setErrors({}); // Clear errors on investment change or reset
    setLivePriceError(null); // Clear live price error
  }, [investment]);

  // Effect to fetch live price when type or symbol/ID changes
  useEffect(() => {
    const fetchPrice = async () => {
      if (!symbolOrId.trim()) {
        setLivePrice(null);
        setLivePriceError(null);
        return;
      }

      setLivePriceLoading(true);
      setLivePriceError(null);
      let fetchedPrice: number | null = null;
      let errorMsg: string | null = null;

      if (type === 'Stock') {
        fetchedPrice = await fetchSingleStockPrice(symbolOrId.toUpperCase());
        if (fetchedPrice === null) {
          errorMsg = "Couldn't find stock ticker. Please check the symbol.";
        }
      } else { // Crypto
        const coingeckoId = getCoingeckoId(symbolOrId);
        fetchedPrice = await fetchSingleCryptoPrice(coingeckoId);
        if (fetchedPrice === null) {
          errorMsg = `Couldn't find crypto. Try full CoinGecko ID (e.g., 'injective-protocol') or a common symbol (e.g., 'BTC').`;
        }
      }

      setLivePrice(fetchedPrice);
      setLivePriceError(errorMsg);
      setLivePriceLoading(false);
    };

    const debounceTimeout = setTimeout(() => {
      fetchPrice();
    }, 500); // Debounce API calls

    return () => clearTimeout(debounceTimeout);
  }, [type, symbolOrId]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!name.trim()) newErrors.name = 'Asset Name is required.';
    if (!quantity || parseFloat(quantity) <= 0) newErrors.quantity = 'Quantity must be a positive number.';
    if (isNaN(parseFloat(quantity))) newErrors.quantity = 'Quantity must be a valid number.';
    if (!buyPrice || parseFloat(buyPrice) <= 0) newErrors.buyPrice = 'Buy Price must be a positive number.';
    if (isNaN(parseFloat(buyPrice))) newErrors.buyPrice = 'Buy Price must be a valid number.';
    if (!datePurchased) newErrors.datePurchased = 'Date Purchased is required.';
    if (new Date(datePurchased) > new Date()) newErrors.datePurchased = 'Date Purchased cannot be in the future.';

    if (!symbolOrId.trim()) {
      newErrors.symbolOrId = type === 'Stock' ? 'Stock Ticker Symbol is required.' : 'CoinGecko ID or symbol is required.';
    } else {
      if (type === 'Stock' && !/^[A-Z0-9.-]+$/.test(symbolOrId.toUpperCase())) {
        newErrors.symbolOrId = 'Invalid stock ticker format (e.g., AAPL, BRK.B).';
      }
    }

    if (livePrice === null || livePriceLoading || livePriceError) {
      newErrors.livePrice = livePriceError || "Live price not available or still loading.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    if (livePrice === null) {
      toast.error("Cannot save: Live price is not available.");
      return;
    }

    onSave({
      name,
      type,
      quantity: parseFloat(quantity),
      buyPrice: parseFloat(buyPrice),
      currentPrice: livePrice, // Use the fetched live price
      datePurchased,
      symbol: type === 'Stock' ? symbolOrId.toUpperCase() : undefined,
      coingeckoId: type === 'Crypto' ? getCoingeckoId(symbolOrId) : undefined,
      lastPrice: livePrice,
      priceSource: type === 'Stock' ? 'YahooFinance' : 'CoinGecko',
      lastUpdated: new Date().toISOString(),
    });
  };

  const handleDeleteClick = () => {
    if (investment?.id) {
      onDelete(investment.id);
    }
  };

  const isSaveDisabled = !validateForm() || livePriceLoading || livePrice === null;

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 py-4">
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="name" className="text-right">
          Asset Name
        </Label>
        <div className="col-span-3">
          <Input id="name" value={name} onChange={(e) => { setName(e.target.value); setErrors(prev => ({ ...prev, name: '' })); }} className="bg-muted/50 border-none focus-visible:ring-primary focus-visible:ring-offset-0 min-h-[44px]" />
          {errors.name && <p className="text-destructive text-xs mt-1">{errors.name}</p>}
        </div>
      </div>

      <div className="grid grid-cols-4 items-center gap-4">
        <Label className="text-right">
          Type
        </Label>
        <ToggleGroup
          type="single"
          value={type}
          onValueChange={(value: 'Stock' | 'Crypto') => {
            if (value) { // Ensure value is not undefined
              setType(value);
              setSymbolOrId(''); // Clear symbol/ID when type changes
              setLivePrice(null);
              setLivePriceError(null);
              setErrors(prev => ({ ...prev, symbolOrId: '', livePrice: '' }));
            }
          }}
          className="col-span-3 justify-start"
        >
          <ToggleGroupItem value="Stock" aria-label="Toggle Stock" className="px-4 py-2 rounded-full data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-sm min-h-[44px]">
            Stock
          </ToggleGroupItem>
          <ToggleGroupItem value="Crypto" aria-label="Toggle Crypto" className="px-4 py-2 rounded-full data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-sm min-h-[44px]">
            Crypto
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="symbolOrId" className="text-right">
          {type === 'Stock' ? 'Ticker Symbol' : 'Coin (symbol or id)'}
        </Label>
        <div className="col-span-3">
          <Input
            id="symbolOrId"
            value={symbolOrId}
            onChange={(e) => { setSymbolOrId(e.target.value); setErrors(prev => ({ ...prev, symbolOrId: '' })); }}
            placeholder={type === 'Stock' ? 'e.g., AAPL' : 'e.g., BTC or bitcoin'}
            className="bg-muted/50 border-none focus-visible:ring-primary focus-visible:ring-offset-0 min-h-[44px]"
          />
          {errors.symbolOrId && <p className="text-destructive text-xs mt-1">{errors.symbolOrId}</p>}
        </div>
      </div>

      <div className="grid grid-cols-4 items-center gap-4">
        <Label className="text-right">
          Live Price
        </Label>
        <div className="col-span-3">
          <LivePriceDisplay price={livePrice} loading={livePriceLoading} error={livePriceError} />
          {errors.livePrice && <p className="text-destructive text-xs mt-1">{errors.livePrice}</p>}
        </div>
      </div>

      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="quantity" className="text-right">
          Quantity
        </Label>
        <div className="col-span-3">
          <Input id="quantity" type="number" step="0.0001" value={quantity} onChange={(e) => { setQuantity(e.target.value); setErrors(prev => ({ ...prev, quantity: '' })); }} className="bg-muted/50 border-none focus-visible:ring-primary focus-visible:ring-offset-0 min-h-[44px]" />
          {errors.quantity && <p className="text-destructive text-xs mt-1">{errors.quantity}</p>}
        </div>
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="buyPrice" className="text-right">
          Buy Price
        </Label>
        <div className="col-span-3">
          <Input id="buyPrice" type="number" step="0.01" value={buyPrice} onChange={(e) => { setBuyPrice(e.target.value); setErrors(prev => ({ ...prev, buyPrice: '' })); }} className="bg-muted/50 border-none focus-visible:ring-primary focus-visible:ring-offset-0 min-h-[44px]" />
          {errors.buyPrice && <p className="text-destructive text-xs mt-1">{errors.buyPrice}</p>}
        </div>
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="datePurchased" className="text-right">
          Date Purchased
        </Label>
        <div className="col-span-3">
          <Input id="datePurchased" type="date" value={datePurchased} onChange={(e) => { setDatePurchased(e.target.value); setErrors(prev => ({ ...prev, datePurchased: '' })); }} className="bg-muted/50 border-none focus-visible:ring-primary focus-visible:ring-offset-0 min-h-[44px]" />
          {errors.datePurchased && <p className="text-destructive text-xs mt-1">{errors.datePurchased}</p>}
          {new Date(datePurchased) > new Date() && (
            <p className="text-amber-500 text-xs mt-1 flex items-center">
              <AlertCircle className="w-3 h-3 mr-1" /> Date is in the future.
            </p>
          )}
        </div>
      </div>
      <div className="flex flex-col sm:flex-row sm:justify-between gap-2 mt-4">
        {investment && (
          <Button type="button" variant="destructive" onClick={handleDeleteClick} className="w-full sm:w-auto transition-transform hover:scale-[1.02] active:scale-98 min-h-[44px]">
            <Trash2 className="h-4 w-4 mr-2" /> Delete
          </Button>
        )}
        <div className="flex gap-2 w-full sm:w-auto">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1 bg-muted/50 border-none hover:bg-muted transition-transform hover:scale-[1.02] active:scale-98 min-h-[44px]">
            Cancel
          </Button>
          <Button type="submit" disabled={isSaveDisabled} className="flex-1 bg-primary dark:bg-primary hover:bg-primary/90 dark:hover:bg-primary/90 text-primary-foreground transition-transform hover:scale-[1.02] active:scale-98 min-h-[44px]">
            <Save className="h-4 w-4 mr-2" /> Save
          </Button>
        </div>
      </div>
    </form>
  );
};

export default InvestmentForm;