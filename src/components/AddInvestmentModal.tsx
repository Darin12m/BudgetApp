"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Investment } from '@/hooks/use-investment-data';
import InvestmentForm from './investments/InvestmentForm'; // Updated import path

interface AddInvestmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (investment: Omit<Investment, 'id' | 'ownerUid' | 'previousPrice'>) => void;
  onDelete: (id: string) => void;
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
      <DialogContent className="z-[1000] sm:max-w-[425px] bg-card text-foreground card-shadow" onPointerDown={(e) => e.stopPropagation()}>
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