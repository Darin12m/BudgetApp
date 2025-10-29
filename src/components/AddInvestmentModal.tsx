"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"; // Import Drawer components
import { Investment } from '@/hooks/use-investment-data';
import InvestmentForm from './investments/InvestmentForm';
import { useDeviceDetection } from '@/hooks/use-device-detection'; // Import the new hook

interface AddInvestmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (investment: Omit<Investment, 'id' | 'ownerUid' | 'previousPrice'>) => void;
  onDelete: (id: string) => void;
  investmentToEdit?: Investment | null;
}

const AddInvestmentModal: React.FC<AddInvestmentModalProps> = ({ isOpen, onClose, onSave, onDelete, investmentToEdit }) => {
  const { isMobile } = useDeviceDetection();

  const handleSave = useCallback((newInvestment: Omit<Investment, 'id' | 'ownerUid' | 'previousPrice'>) => {
    onSave(newInvestment);
    onClose();
  }, [onSave, onClose]);

  const handleDelete = useCallback((id: string) => {
    onDelete(id);
    onClose();
  }, [onDelete, onClose]);

  const ModalContent = (
    <> {/* Removed Card wrapper */}
      <DialogHeader> {/* Using DialogHeader for consistent styling, works with Drawer too */}
        <DialogTitle className="flex items-center tracking-tight"> {/* Added flex and items-center */}
          {investmentToEdit ? 'Edit Investment' : 'Add New Investment'}
        </DialogTitle>
      </DialogHeader>
      <InvestmentForm
        investment={investmentToEdit || null}
        onSave={handleSave}
        onDelete={handleDelete}
        onClose={onClose}
      />
    </>
  );

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={onClose}>
        <DrawerContent className="safe-top safe-bottom glassmorphic-card"> {/* Apply glassmorphism to drawer content */}
          <DrawerHeader className="text-left">
            <DrawerTitle className="flex items-center tracking-tight"> {/* Added flex and items-center */}
              {investmentToEdit ? 'Edit Investment' : 'Add New Investment'}
            </DrawerTitle>
          </DrawerHeader>
          <div className="p-4"> {/* Wrap form in a div for padding within drawer */}
            <InvestmentForm
              investment={investmentToEdit || null}
              onSave={handleSave}
              onDelete={handleDelete}
              onClose={onClose}
            />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="z-[1000] sm:max-w-[425px] glassmorphic-card p-6" onPointerDown={(e) => e.stopPropagation()}> {/* Added styling directly to DialogContent */}
        {ModalContent}
      </DialogContent>
    </Dialog>
  );
};

export default AddInvestmentModal;