import { X, MapPin, Navigation } from 'lucide-react'; // https://lucide.dev/icons/
import { useState, useEffect } from 'react';

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLocation: string;
  onLocationChange: (location: string) => void;
  containerRef: React.RefObject<HTMLElement | null>;
}

export function LocationModal({ isOpen, onClose, currentLocation, onLocationChange, containerRef }: LocationModalProps) {
  const [zip, setZip] = useState('');
  const [error, setError] = useState('');

  useEffect(() => { // if clicked outside of the location selector, hide it. 
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose, containerRef]);

  // zipcode validator, ensuring length of 5. we don't do a number only check because 
  // out input box has inputMode="numeric", but if we decide to support canada in the
  // future, then adjust this function
  const isValidZip = (value: string) => value.length === 5;

  // will have to move to backend most likely and detect if its canada too maybe?
  // API call to https://zippopotam.us/, if bad throws error otherwise returns updated 
  // location string
  const lookupZip = async (zipCode: string): Promise<string> => {
    const res = await fetch(`https://api.zippopotam.us/us/${zipCode}`);
    if (!res.ok) throw new Error('Invalid zip code');
    const data = await res.json();
    const city = data.places[0]['place name'];
    const state = data.places[0]['state abbreviation'];
    return `${city}, ${state} ${zipCode}`;
  };

  // confirm button: validate US Zip, then call lookupZip to call to API
  // if API returns not ok then throw error. if good, then return zip,
  // QUESTION: DO WE WANT TO SUPPORT CANADA TOO?
  const handleConfirm = async () => {
    if (!isValidZip(zip)) {
      setError('Please enter a valid 5-digit US zip code.');
      return;
    }
    setError('');
    try {
      const label = await lookupZip(zip);
      onLocationChange(label);
      onClose();
      setZip('');
    } catch {
      setError('Zip code not found. Please try another.');
    }
  };

  // TODO figure out how to support location?
  const handleUseCurrentLocation = () => {
    setError('Location detection coming soon. Please enter a zip code.');
  };

  // ACTUAL LOCATION POP UP BEHAVIOR RETURNED BELOW: 
  // if not open, don't show anything.
  if (!isOpen) return null;
  // if open show it:
  return (
    <div
      className={`absolute top-full mt-2 w-72 bg-white rounded-xl shadow-lg border border-gray-200 z-[9999] p-4 left-0`}
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-gray-800">Set Your Location</p>
        <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
          <X className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      <p className="text-xs text-gray-400 mb-3">Enter your zipcode to find deals near you.</p>

      <div className="relative mb-2">
        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          inputMode="numeric"
          placeholder="Enter zip code"
          value={zip}
          onChange={(e) => { setZip(e.target.value); setError(''); }}
          /*ADDED ENTER KEY SUPPORT!*/
          onKeyDown={(e) => { if (e.key === 'Enter') handleConfirm(); }}
          className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6FBD7A] tracking-widest font-mono text-sm"
          maxLength={5}
          autoFocus
        />
      </div>

      {currentLocation && (
        <p className="text-xs text-gray-400 mb-2">Current: {currentLocation}</p>
      )}

      {error && (
        <p className="text-xs text-red-500 mb-2">{error}</p>
      )}

      <button
        onClick={handleUseCurrentLocation}
        className="w-full flex items-center justify-center gap-2 py-2 border border-[#6FBD7A] text-[#6FBD7A] rounded-lg hover:bg-[#E8F5EA] transition-colors text-sm mb-3"
      >
        <Navigation className="w-4 h-4" />
        Use Current Location
      </button>

      <button
        onClick={handleConfirm}
        disabled={!isValidZip(zip)}
        className="w-full bg-[#6FBD7A] text-white py-2.5 rounded-lg hover:bg-[#5da968] transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-sm font-medium"
      >
        Confirm
      </button>
    </div>
  );
}
