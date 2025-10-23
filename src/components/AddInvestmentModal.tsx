"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { Investment } from '@/hooks/use-investment-data';

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
  const [currentPrice, setCurrentPrice] = useState(investment?.currentPrice.toString() || '');
  const [datePurchased, setDatePurchased] = useState(investment?.datePurchased || format(new Date(), 'yyyy-MM-dd'));
  const [symbol, setSymbol] = useState(investment?.symbol || '');
  const [coingeckoId, setCoingeckoId] = useState(investment?.coingeckoId || '');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!name.trim()) newErrors.name = 'Asset Name is required.';
    if (!quantity || parseFloat(quantity) <= 0) newErrors.quantity = 'Quantity must be a positive number.';
    if (!buyPrice || parseFloat(buyPrice) <= 0) newErrors.buyPrice = 'Buy Price must be a positive number.';
    if (!currentPrice || parseFloat(currentPrice) <= 0) newErrors.currentPrice = 'Current Price must be a positive number.';
    if (!datePurchased) newErrors.datePurchased = 'Date Purchased is required.';
    if (type === 'Stock' && !symbol.trim()) newErrors.symbol = 'Stock Ticker Symbol is required.';
    if (type === 'Crypto' && !coingeckoId.trim()) newErrors.coingeckoId = 'CoinGecko ID is required.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    onSave({
      name,
      type,
      quantity: parseFloat(quantity),
      buyPrice: parseFloat(buyPrice),
      currentPrice: parseFloat(currentPrice),
      datePurchased,
      symbol: type === 'Stock' ? symbol : undefined,
      coingeckoId: type === 'Crypto' ? coingeckoId : undefined,
    });
  };

  const handleDeleteClick = () => {
    if (investment?.id) {
      onDelete(investment.id);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 py-4">
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="name" className="text-right">
          Asset Name
        </Label>
        <div className="col-span-3">
          <Input id="name" value={name} onChange={(e) => { setName(e.target.value); setErrors(prev => ({ ...prev, name: '' })); }} className="bg-muted/50 border-none focus-visible:ring-blue focus-visible:ring-offset-0" />
          {errors.name && <p className="text-destructive text-xs mt-1">{errors.name}</p>}
        </div>
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="type" className="text-right">
          Type
        </Label>
        <Select value={type} onValueChange={(value: 'Stock' | 'Crypto') => setType(value)}>
          <SelectTrigger className="col-span-3 bg-muted/50 border-none focus-visible:ring-blue focus-visible:ring-offset-0">
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Stock">Stock</SelectItem>
            <SelectItem value="Crypto">Crypto</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {type === 'Stock' && (
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="symbol" className="text-right">
            Ticker Symbol
          </Label>
          <div className="col-span-3">
            <Input id="symbol" value={symbol} onChange={(e) => { setSymbol(e.target.value); setErrors(prev => ({ ...prev, symbol: '' })); }} placeholder="e.g., AAPL" className="bg-muted/50 border-none focus-visible:ring-blue focus-visible:ring-offset-0" />
            {errors.symbol && <p className="text-destructive text-xs mt-1">{errors.symbol}</p>}
          </div>
        </div>
      )}

      {type === 'Crypto' && (
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="coingeckoId" className="text-right">
            CoinGecko ID
          </Label>
          <div className="col-span-3">
            <Input id="coingeckoId" value={coingeckoId} onChange={(e) => { setCoingeckoId(e.target.value); setErrors(prev => ({ ...prev, coingeckoId: '' })); }} placeholder="e.g., bitcoin" className="bg-muted/50 border-none focus-visible:ring-blue focus-visible:ring-offset-0" />
            {errors.coingeckoId && <p className="text-destructive text-xs mt-1">{errors.coingeckoId}</p>}
          </div>
        </div>
      )}

      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="quantity" className="text-right">
          Quantity
        </Label>
        <div className="col-span-3">
          <Input id="quantity" type="number" step="0.0001" value={quantity} onChange={(e) => { setQuantity(e.target.value); setErrors(prev => ({ ...prev, quantity: '' })); }} className="bg-muted/50 border-none focus-visible:ring-blue focus-visible:ring-offset-0" />
          {errors.quantity && <p className="text-destructive text-xs mt-1">{errors.quantity}</p>}
        </div>
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="buyPrice" className="text-right">
          Buy Price
        </Label>
        <div className="col-span-3">
          <Input id="buyPrice" type="number" step="0.01" value={buyPrice} onChange={(e) => { setBuyPrice(e.target.value); setErrors(prev => ({ ...prev, buyPrice: '' })); }} className="bg-muted/50 border-none focus-visible:ring-blue focus-visible:ring-offset-0" />
          {errors.buyPrice && <p className="text-destructive text-xs mt-1">{errors.buyPrice}</p>}
        </div>
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="currentPrice" className="text-right">
          Current Price
        </Label>
        <div className="col-span-3">
          <Input id="currentPrice" type="number" step="0.01" value={currentPrice} onChange={(e) => { setCurrentPrice(e.target.value); setErrors(prev => ({ ...prev, currentPrice: '' })); }} className="bg-muted/50 border-none focus-visible:ring-blue focus-visible:ring-offset-0" />
          {errors.currentPrice && <p className="text-destructive text-xs mt-1">{errors.currentPrice}</p>}
        </div>
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="datePurchased" className="text-right">
          Date Purchased
        </Label>
        <div className="col-span-3">
          <Input id="datePurchased" type="date" value={datePurchased} onChange={(e) => { setDatePurchased(e.target.value); setErrors(prev => ({ ...prev, datePurchased: '' })); }} className="bg-muted/50 border-none focus-visible:ring-blue focus-visible:ring-offset-0" />
          {errors.datePurchased && <p className="text-destructive text-xs mt-1">{errors.datePurchased}</p>}
        </div>
      </div>
      <DialogFooter className="flex flex-col sm:flex-row sm:justify-between gap-2 mt-4">
        {investment && (
          <Button type="button" variant="destructive" onClick={handleDeleteClick} className="w-full sm:w-auto transition-transform hover:scale-[1.02] active:scale-98">
            <Trash2 className="h-4 w-4 mr-2" /> Delete
          </Button>
        )}
        <div className="flex gap-2 w-full sm:w-auto">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1 bg-muted/50 border-none hover:bg-muted transition-transform hover:scale-[1.02] active:scale-98">
            Cancel
          </Button>
          <Button type="submit" className="flex-1 bg-blue-600 dark:bg-blue hover:bg-blue-700 dark:hover:bg-blue/80 text-white transition-transform hover:scale-[1.02] active:scale-98">
            <Save className="h-4 w-4 mr-2" /> Save
          </Button>
        </div>
      </DialogFooter>
    </form>
  );
};

interface AddInvestmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (investment: Omit<Investment, 'id' | 'ownerUid' | 'previousPrice'>) => void;
  onDelete: (id: string) => void; // Pass through delete for consistency, though not used for 'add'
  investmentToEdit?: Investment | null;
}

const AddInvestmentModal: React.FC<AddInvestmentModalProps> = ({ isOpen, onClose, onSave, onDelete, investmentToEdit }) => {
  const handleSave = useCallback((newInvestment: Omit<Investment, 'id' | 'ownerUid' | 'previousPrice'>) => {
    onSave(newInvestment);
    onClose();
  }, [onSave, onClose]);

  const handleDelete = useCallback((id: string) => {
    onDelete(id);
    onClose();
  }, [onDelete, onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-card text-foreground card-shadow">
        <DialogHeader>
          <DialogTitle>{investmentToEdit ? 'Edit Investment' : 'Add New Investment'}</DialogTitle>
        </DialogHeader>
        <InvestmentForm
          investment={investmentToEdit || null}
          onSave={handleSave}
          onDelete={handleDelete}
          onClose={onClose}
        />
      </DialogContent>
    </Dialog>
  );
};

export default AddInvestmentModal;