import { useState, useEffect, useCallback } from 'react';

export interface Address {
  id: string;
  isDefault: boolean;
  [key: string]: any;
}

export const useCheckoutAddress = (addresses: Address[]) => {
  const [selectedAddress, setSelectedAddress] = useState<string>("");

  // Set default address
  useEffect(() => {
    const defaultAddress = addresses.find((addr) => addr.isDefault);
    if (defaultAddress) {
      setSelectedAddress(defaultAddress.id);
    } else if (addresses.length > 0) {
      // If no default, select the first one
      setSelectedAddress(addresses[0].id);
    }
  }, [addresses]);

  const handleAddressSelect = useCallback((addressId: string) => {
    setSelectedAddress(addressId);
  }, []);

  const getSelectedAddressDetails = useCallback(() => {
    return addresses.find(addr => addr.id === selectedAddress);
  }, [addresses, selectedAddress]);

  return {
    selectedAddress,
    setSelectedAddress: handleAddressSelect,
    getSelectedAddressDetails,
  };
};