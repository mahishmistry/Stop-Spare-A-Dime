import { X, Home, Tag, Heart, User, Settings, HelpCircle, MapPin } from 'lucide-react';
import React from 'react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  location: string;
  onLocationClick: () => void;
}

export function Sidebar({ isOpen, onClose, location, onLocationClick }: SidebarProps) {
  const menuItems = [
    { icon: Home, label: 'Home', active: true },
    { icon: Tag, label: 'Deals & Offers' },
    { icon: Heart, label: 'Favorites' },
    { icon: User, label: 'Account' },
    { icon: Settings, label: 'Settings' },
    { icon: HelpCircle, label: 'Help & Support' },
  ];

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed lg:static top-0 left-0 h-full bg-white border-r border-gray-200 z-50 transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } w-64`}
      >
        <div className="p-4 flex items-center justify-between border-b border-gray-200">
          <h2 className="text-gray-800">Menu</h2>
          <button onClick={onClose} className="lg:hidden p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="p-4">
          <button
            onClick={onLocationClick}
            className="w-full flex items-center gap-3 p-3 bg-[#E8F5EA] rounded-lg mb-4"
          >
            <MapPin className="w-5 h-5 text-[#6FBD7A]" />
            <div className="text-left flex-1">
              <p className="text-xs text-gray-600">Deliver to</p>
              <p className="text-sm text-gray-800 truncate">{location}</p>
            </div>
          </button>

          <nav className="space-y-1">
            {menuItems.map((item, index) => (
              <button
                key={index}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  item.active
                    ? 'bg-[#E8F5EA] text-[#6FBD7A]'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-sm">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </aside>
    </>
  );
}
