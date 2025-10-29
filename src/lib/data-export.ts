import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { format } from 'date-fns';
import { toast } from 'sonner';
import i18n from '@/i18n'; // Import i18n for translation

// Helper to convert array of objects to CSV string
const arrayToCsv = (arr: any[], title: string) => {
  if (arr.length === 0) return '';
  const headers = Object.keys(arr[0]);
  const headerRow = headers.join(',');
  const dataRows = arr.map(row => headers.map(header => {
    const value = row[header];
    // Handle potential commas in string values by wrapping in quotes
    return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
  }).join(','));
  return `${title}\n${headerRow}\n${dataRows.join('\n')}\n\n`;
};

export const exportAllUserData = async (userUid: string) => {
  if (!userUid) {
    toast.error(i18n.t("common.error"));
    return;
  }

  let csvContent = '';

  const collectionsToExport = [
    'transactions',
    'categories',
    'accounts',
    'goals',
    'investments',
    'recurringTransactions',
    'portfolioSnapshots',
    'budgetSettings',
  ];

  try {
    for (const collectionName of collectionsToExport) {
      const q = query(collection(db, collectionName), where("ownerUid", "==", userUid));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      csvContent += arrayToCsv(data, collectionName.charAt(0).toUpperCase() + collectionName.slice(1));
    }

    const date = format(new Date(), 'yyyy-MM-dd');
    const filename = `FinanceFlow_Export_${date}.csv`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      toast.error(i18n.t("common.error"));
    }
  } catch (error) {
    console.error("Error exporting data:", error);
    toast.error(i18n.t("settings.exportDataError"));
    throw error; // Re-throw to be caught by the caller
  }
};