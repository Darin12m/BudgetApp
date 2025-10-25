"use client";

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"; // For segmented control
import { Save, Trash2, AlertCircle, RefreshCw } from 'lucide-react'; // Added RefreshCw icon
import { format } from 'date-fns';
import { Investment } from '@/hooks/use-investment-data';
import { fetchSingleCryptoPrice, fetchStockPrice, fetchCompanyProfile, getCoingeckoId } from '@/lib/api'; // Import new API functions
import LivePriceDisplay from './LivePriceDisplay'; // New component
import { toast } from 'sonner'; // Import toast from sonner
import { useCurrency } from '@/context/CurrencyContext'; // Import useCurrency
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
} from "@/components/ui/alert-dialog"; // Import AlertDialog components

interface InvestmentFormProps {
  investment: Investment | null;
  onSave: (investment: Omit<Investment, 'id' | 'ownerUid' | 'previousPrice' | 'change24hPercent'>) => void; // Updated Omit type
  onDelete: (id: string) => void;
  onClose: () => void;
}

const InvestmentForm: React.FC<InvestmentFormProps> = ({ investment, onSave, onDelete, onClose }) => {
  const { formatCurrency, formatUSD, selectedCurrency, convertInputToUSD, convertUSDToSelected } = useCurrency(); // Use currency context
  const [name, setName] = useState(investment?.name || '');
  const [type, setType] = useState<'Stock' | 'Crypto'>(investment?.type || 'Stock');
  const [quantity, setQuantity] = useState(investment?.quantity.toString() || '');
  const [buyPrice, setBuyPrice] = useState(investment?.buyPrice ? convertUSDToSelected(investment.buyPrice).toString() : ''); // Convert from USD for display
  const [datePurchased, setDatePurchased] = useState(investment?.datePurchased || format(new Date(), 'yyyy-MM-dd'));
  const [symbolOrId, setSymbolOrId] = useState(investment?.symbol || investment?.coingeckoId || '');
  const [companyName, setCompanyName] = useState(investment?.companyName || null); // New state for company name

  const [livePrice, setLivePrice] = useState<number | null>(null);
  const [livePriceLoading, setLivePriceLoading] = useState(false);
  const [livePriceError, setLivePriceError] = useState<string | null>(null);

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false); // State for delete confirmation dialog

  // Debounce timer ref
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Helper function to get current form errors without setting state
  const getFormErrors = useCallback(() => {
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

    // Only add a livePrice error if there's an actual error message or it's not loading
    if (livePriceError) {
      newErrors.livePrice = livePriceError;
    } else if (!livePriceLoading && livePrice === null && symbolOrId.trim()) {
      newErrors.livePrice = "Live price not available.";
    }
    return newErrors;
  }, [name, quantity, buyPrice, datePurchased, symbolOrId, type, livePrice, livePriceLoading, livePriceError]);

  const fetchAndSetLivePrice = useCallback(async (currentSymbolOrId: string, currentType: 'Stock' | 'Crypto') => {
    if (!currentSymbolOrId.trim()) {
      setLivePrice(null);
      setLivePriceError(null);
      setCompanyName(null);
      return;
    }

    setLivePriceLoading(true);
    setLivePriceError(null);
    setCompanyName(null); // Clear company name on new fetch

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
      errorMsg = priceResult.error || profileResult.error; // Prioritize price error
      if (fetchedPrice === null && !errorMsg) {
        errorMsg = "Invalid stock ticker or price unavailable.";
      }
    } else { // Crypto
      const result = await fetchSingleCryptoPrice(currentSymbolOrId);
      fetchedPrice = result.price;
      fetchedName = result.name;
      errorMsg = result.error;
      if (fetchedPrice === null && !errorMsg) {
        errorMsg = "Invalid crypto symbol or price unavailable.";
      }
    }

    setLivePrice(fetchedPrice);
    setCompanyName(fetchedName);
    setLivePriceError(errorMsg);
    setLivePriceLoading(false);
  }, []);

  // Effect to populate form when an investment is selected for editing
  useEffect(() => {
    if (investment) {
      setName(investment.name);
      setType(investment.type);
      setQuantity(investment.quantity.toString());
      setBuyPrice(convertUSDToSelected(investment.buyPrice).toString()); // Convert from USD for display
      setDatePurchased(investment.datePurchased);
      setSymbolOrId(investment.symbol || investment.coingeckoId || '');
      setCompanyName(investment.companyName || null);
      setLivePrice(investment.currentPrice); // Use currentPrice as initial live price (already in USD)
      setLivePriceError(null); // Clear any previous errors
    } else {
      // Reset form for new investment
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
    setErrors({}); // Clear errors on investment change or reset
  }, [investment, convertUSDToSelected]);

  // Effect to fetch live price when type or symbol/ID changes
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      fetchAndSetLivePrice(symbolOrId, type);
    }, 500); // Debounce API calls

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [type, symbolOrId, fetchAndSetLivePrice]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const currentErrors = getFormErrors();
    setErrors(currentErrors); // Set errors only on submit

    if (Object.keys(currentErrors).length > 0) {
      toast.error("Please fix the errors in the form.");
      return;
    }

    if (livePrice === null) {
      toast.error("Cannot save: Live price is not available. Please ensure the ticker is valid.");
      return;
    }

    // Convert buyPrice from selected currency to USD before saving
    const buyPriceInUSD = convertInputToUSD(parseFloat(buyPrice));

    onSave({
      name,
      type,
      quantity: parseFloat(quantity),
      buyPrice: buyPriceInUSD, // Use the converted buy price
      currentPrice: livePrice, // Use the fetched live price (already in USD)
      datePurchased,
      symbol: type === 'Stock' ? symbolOrId.toUpperCase() : undefined,
      coingeckoId: type === 'Crypto' ? getCoingeckoId(symbolOrId) : undefined,
      companyName: companyName, // Save the fetched company name
      lastPrice: livePrice, // Initialize lastPrice with current live price (already in USD)
      priceSource: type === 'Stock' ? 'Finnhub' : 'CoinGecko',
      lastUpdated: new Date().toISOString(),
      inputCurrencyCode: selectedCurrency.code, // Save the currency code used for input
    });
  };

  const handleDeleteClick = () => {
    if (investment?.id) {
      onDelete(investment.id);
      setIsDeleteConfirmOpen(false); // Close dialog after deletion
    }
  };

  const handleRefreshPrice = useCallback(() => {
    fetchAndSetLivePrice(symbolOrId, type);
  }, [symbolOrId, type, fetchAndSetLivePrice]);

  // Determine if save button should be disabled based on current form errors
  const isSaveDisabled = Object.keys(getFormErrors()).length > 0 || livePriceLoading || livePrice === null;

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
              setCompanyName(null);
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
          {companyName && type === 'Stock' && !errors.symbolOrId && (
            <p className="text-muted-foreground text-xs mt-1">{companyName}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-4 items-center gap-4">
        <Label className="text-right">
          Buy Price
        </Label>
        <div className="col-span-3">
          <Input id="buyPrice" type="number" step="0.01" value={buyPrice} onChange={(e) => { setBuyPrice(e.target.value); setErrors(prev => ({ ...prev, buyPrice: '' })); }} placeholder={`${selectedCurrency.symbol} 150.00`} className="bg-muted/50 border-none focus-visible:ring-primary focus-visible:ring-offset-0 min-h-[44px]" />
          {errors.buyPrice && <p className="text-destructive text-xs mt-1">{errors.buyPrice}</p>}
        </div>
      </div>

      <div className="grid grid-cols-4 items-center gap-4">
        <Label className="text-right">
          Live Price
        </Label>
        <div className="col-span-3 flex items-center space-x-2">
          <LivePriceDisplay price={livePrice} loading={livePriceLoading} error={livePriceError} />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleRefreshPrice}
            disabled={livePriceLoading || !symbolOrId.trim()}
            className="h-8 w-8 text-muted-foreground hover:bg-muted/50"
          >
            <RefreshCw className={`h-4 w-4 ${livePriceLoading ? 'animate-spin' : ''}`} />
          </Button>
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
        <Label htmlFor="datePurchased" className="text-right">
          Date Purchased
        </Label>
        <div className="col-span-3">
          <Input id="datePurchased" type="date" value={datePurchased} onChange={(e) => { setDatePurch2ased(e.target.value); setErrors(prev => ({ ...prev, date: '' })); }} className="bg-muted/50 border-none focus-visible:ring-primary focus-visible:ring-offset-0 min-h-[44px]" />
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
          <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
            <AlertDialogTrigger asChild>
              <Button type="button" variant="destructive" className="w-full sm:w-auto transition-transform hover:scale-[1.02] active:scale-98 min-h-[44px]">
                <Trash2 className="h-4 w-4 mr-2" /> Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete your investment in "{investment.name}".
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="bg-muted/50 border-none hover:bg-muted">Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteClick} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
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