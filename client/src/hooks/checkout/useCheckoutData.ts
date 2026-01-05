import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export const useCheckoutData = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);

  const fetchCheckoutData = async (
    fetchAddresses: () => Promise<void>,
    fetchCart: () => Promise<void>,
    fetchCoupons: () => Promise<void>
  ) => {
    setIsLoading(true);
    try {
      await Promise.all([fetchAddresses(), fetchCart(), fetchCoupons()]);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load checkout data",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return { isLoading, fetchCheckoutData };
};