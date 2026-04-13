import { X, MapPin, Navigation } from 'lucide-react';
import { useState } from 'react';

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLocation: string;
  onLocationChange: (location: string) => void;
}

export function LocationModal({ isOpen, onClose, currentLocation, onLocationChange }: LocationModalProps) {
  const [input, setInput] = useState(currentLocation);

  const suggestions = [
    'New York, NY',
    'Los Angeles, CA',
    'Chicago, IL',
    'Houston, TX',
  ];

  const handleConfirm = () => {
    onLocationChange(input);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-md w-full">
        <div className="border-b border-gray-200 p-4 flex items-center justify-between">
          <h2 className="text-gray-800">Select Location</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        <div className="p-6">
          <div className="relative mb-4">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Enter your location"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6FBD7A]"
            />
          </div>

          <button className="w-full flex items-center justify-center gap-2 py-3 border border-[#6FBD7A] text-[#6FBD7A] rounded-lg hover:bg-[#E8F5EA] transition-colors mb-4">
            <Navigation className="w-5 h-5" />
            Use Current Location
          </button>

          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">Suggestions</p>
            <div className="space-y-2">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => setInput(suggestion)}
                  className="w-full text-left px-4 py-3 border border-gray-200 rounded-lg hover:border-[#6FBD7A] transition-colors"
                >
                  <p className="text-sm text-gray-800">{suggestion}</p>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleConfirm}
            className="w-full bg-[#6FBD7A] text-white py-3 rounded-lg hover:bg-[#5da968] transition-colors"
          >
            Confirm Location
          </button>
        </div>
      </div>
    </div>
  );
}
