import { ChevronLeft, X } from 'lucide-react';
import React from "react";
import { useState } from 'react';

interface SettingsPageProps {
  location: string;
  onBack: () => void;
  onLogout: () => void;
}

export function SettingsPage({ location, onBack, onLogout }: SettingsPageProps) {
  const [activeSection, setActiveSection] = useState<string>('settings');
  const [excludedStores, setExcludedStores] = useState<string[]>(['Target']);
  const [storeSearch, setStoreSearch] = useState('');

  const availableStores = ['Walmart', 'Target', 'Kroger', 'Whole Foods', 'Safeway', 'Trader Joes', 'Costco', 'Aldi'];

  const removeStore = (store: string) => {
    setExcludedStores(excludedStores.filter(s => s !== store));
  };

  const addStore = (store: string) => {
    if (!excludedStores.includes(store)) {
      setExcludedStores([...excludedStores, store]);
    }
    setStoreSearch('');
  };

  return (
    <div className="min-h-screen bg-[#F9F9F9]">
      {/* Header */}
      <header className="bg-[#F5F5F5] border-b border-[#e0e0e0] py-4 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#B3B3B3]"></div>
            <span className="font-semibold text-gray-800">Stop-Spare-A-Dime</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-700">{location}</span>
            <div className="w-12 h-12 rounded-full bg-[#B3B3B3]"></div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8 flex gap-8">
        {/* Main Content */}
        <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 p-8 overflow-y-auto max-h-[calc(100vh-140px)]">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm">Back</span>
          </button>

          {/* Settings Section */}
          <section id="settings" className="mb-12">
            <h2 className="text-2xl mb-6 text-gray-800">Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Email</label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-800">p****@email.com</span>
                  <button className="text-sm text-[#6FBD7A] hover:underline">(Change email)</button>
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Name</label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-800">Zoe</span>
                  <button className="text-sm text-[#6FBD7A] hover:underline">(Change name)</button>
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Primary Zip Code</label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-800">01003</span>
                  <button className="text-sm text-[#6FBD7A] hover:underline">(Change primary zip code)</button>
                </div>
              </div>
              <button className="text-sm text-[#6FBD7A] hover:underline">Change password</button>
            </div>
          </section>

          {/* Preferences Section */}
          <section id="preferences" className="mb-12">
            <h2 className="text-2xl mb-6 text-gray-800">Preferences</h2>
            <p className="text-sm text-gray-600 mb-4">
              You can select which stores you do not wish to shop at to better tailor recommendations.
            </p>
            <div className="relative mb-4">
              <input
                type="text"
                placeholder="Search stores..."
                value={storeSearch}
                onChange={(e) => setStoreSearch(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6FBD7A]"
              />
              {storeSearch && (
                <div className="absolute top-full mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto z-10">
                  {availableStores
                    .filter(store =>
                      store.toLowerCase().includes(storeSearch.toLowerCase()) &&
                      !excludedStores.includes(store)
                    )
                    .map(store => (
                      <button
                        key={store}
                        onClick={() => addStore(store)}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 text-sm text-gray-700"
                      >
                        {store}
                      </button>
                    ))}
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {excludedStores.map(store => (
                <div
                  key={store}
                  className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full"
                >
                  <span className="text-sm text-gray-700">{store}</span>
                  <button onClick={() => removeStore(store)} className="text-gray-500 hover:text-gray-700">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Notifications Section */}
          <section id="notifications" className="mb-12">
            <h2 className="text-2xl mb-6 text-gray-800">Notifications</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-800">Email Notifications</p>
                  <p className="text-xs text-gray-500">Receive updates about deals and offers</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#6FBD7A]"></div>
                </label>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-800">Push Notifications</p>
                  <p className="text-xs text-gray-500">Get notified about nearby deals</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#6FBD7A]"></div>
                </label>
              </div>
            </div>
          </section>

          {/* Favorites Section */}
          <section id="favorites" className="mb-12">
            <h2 className="text-2xl mb-6 text-gray-800">Favorites</h2>
            <p className="text-sm text-gray-600 mb-4">Your favorite products will appear here</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="border border-gray-200 rounded-lg p-4 text-center">
                <div className="w-full h-32 bg-gray-100 rounded-lg mb-2"></div>
                <p className="text-sm text-gray-700">Organic Bananas</p>
              </div>
              <div className="border border-gray-200 rounded-lg p-4 text-center">
                <div className="w-full h-32 bg-gray-100 rounded-lg mb-2"></div>
                <p className="text-sm text-gray-700">Whole Milk</p>
              </div>
            </div>
          </section>

          {/* Bookmarked Offers Section */}
          <section id="bookmarked-offers" className="mb-12">
            <h2 className="text-2xl mb-6 text-gray-800">Bookmarked Offers</h2>
            <p className="text-sm text-gray-600 mb-4">Your saved deals and promotions</p>
            <div className="space-y-3">
              <div className="border border-gray-200 rounded-lg p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-800">Ground Beef - 20% Off</p>
                  <p className="text-xs text-gray-500">Expires 4/20/2026</p>
                </div>
                <span className="text-sm text-[#6FBD7A]">$4.99</span>
              </div>
              <div className="border border-gray-200 rounded-lg p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-800">Fresh Strawberries - Buy 1 Get 1</p>
                  <p className="text-xs text-gray-500">Expires 4/18/2026</p>
                </div>
                <span className="text-sm text-[#6FBD7A]">$3.99</span>
              </div>
            </div>
          </section>

          {/* Manage Memberships Section */}
          <section id="manage-memberships" className="mb-12">
            <h2 className="text-2xl mb-6 text-gray-800">Manage Memberships</h2>
            <div className="space-y-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-800">Costco Membership</p>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Active</span>
                </div>
                <p className="text-xs text-gray-500">Expires: 12/31/2026</p>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-800">Whole Foods Prime</p>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Active</span>
                </div>
                <p className="text-xs text-gray-500">Monthly subscription</p>
              </div>
            </div>
          </section>

          {/* Logout Section */}
          <section id="logout" className="mb-8">
            <button
              onClick={onLogout}
              className="text-red-600 hover:text-red-700 flex items-center gap-2"
            >
              <span className="text-sm">&gt; Logout</span>
            </button>
          </section>
        </div>

        {/* Right Navigation Sidebar */}
        <div className="w-64 bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-8 h-fit">
          <h3 className="text-lg mb-4 text-gray-800">Settings</h3>
          <nav className="space-y-2">
            <a
              href="#settings"
              onClick={(e) => {
                e.preventDefault();
                setActiveSection('settings');
                document.getElementById('settings')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className={`block text-sm py-2 ${
                activeSection === 'settings' ? 'text-[#6FBD7A]' : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              Settings
            </a>
            <a
              href="#preferences"
              onClick={(e) => {
                e.preventDefault();
                setActiveSection('preferences');
                document.getElementById('preferences')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className={`block text-sm py-2 ${
                activeSection === 'preferences' ? 'text-[#6FBD7A]' : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              Preferences
            </a>
            <a
              href="#notifications"
              onClick={(e) => {
                e.preventDefault();
                setActiveSection('notifications');
                document.getElementById('notifications')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className={`block text-sm py-2 ${
                activeSection === 'notifications' ? 'text-[#6FBD7A]' : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              Notifications
            </a>
            <a
              href="#favorites"
              onClick={(e) => {
                e.preventDefault();
                setActiveSection('favorites');
                document.getElementById('favorites')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className={`block text-sm py-2 ${
                activeSection === 'favorites' ? 'text-[#6FBD7A]' : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              Favorites
            </a>
            <a
              href="#bookmarked-offers"
              onClick={(e) => {
                e.preventDefault();
                setActiveSection('bookmarked-offers');
                document.getElementById('bookmarked-offers')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className={`block text-sm py-2 ${
                activeSection === 'bookmarked-offers' ? 'text-[#6FBD7A]' : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              Bookmarked Offers
            </a>
            <a
              href="#manage-memberships"
              onClick={(e) => {
                e.preventDefault();
                setActiveSection('manage-memberships');
                document.getElementById('manage-memberships')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className={`block text-sm py-2 ${
                activeSection === 'manage-memberships' ? 'text-[#6FBD7A]' : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              Manage Memberships
            </a>
            <a
              href="#logout"
              onClick={(e) => {
                e.preventDefault();
                setActiveSection('logout');
                document.getElementById('logout')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className={`block text-sm py-2 ${
                activeSection === 'logout' ? 'text-[#6FBD7A]' : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              &gt; Logout
            </a>
          </nav>
        </div>
      </div>
    </div>
  );
}
