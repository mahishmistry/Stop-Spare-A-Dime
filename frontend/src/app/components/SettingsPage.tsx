import { ChevronLeft, X } from 'lucide-react';
import React from "react";
import { useState, useEffect, useRef } from 'react';
import { Header } from './Header.tsx';

interface SettingsPageProps {
  location: string;
  onLocationChange: (location: string) => void;
  onBack: () => void;
  onLogout: () => void;
  onSearch: (query: string) => void;
  isAuthenticated: boolean;
  onLoginClick: () => void;
  onHomeClick: () => void;
  onSettingsClick: (section?: string) => void;
  onHistoryClick?: () => void;
  initialSection?: string;
  accountName: string;
  accountEmail: string;
  accountZip: string;
  onAccountNameChange: (val: string) => void;
  onAccountEmailChange: (val: string) => void;
  onAccountZipChange: (val: string) => void;
}

function EditRow({ label, value, onSave, type = 'text', maxLength }: {
  label: string; value: string; onSave: (val: string) => void; type?: string; maxLength?: number;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  useEffect(() => { setDraft(value); }, [value]);
  const handleSave = () => { if (draft.trim()) onSave(draft.trim()); setEditing(false); };
  const handleCancel = () => { setDraft(value); setEditing(false); };
  return (
    <div className="border-b border-gray-100 last:border-b-0">
      <div className="flex items-center justify-between py-3.5">
        <div>
          <p className="text-xs text-gray-500 mb-0.5">{label}</p>
          <p className="text-sm text-gray-800">{value}</p>
        </div>
        {!editing && (
          <button onClick={() => { setDraft(value); setEditing(true); }} className="text-sm text-[#6FBD7A] hover:text-[#5da968] transition-colors">Edit</button>
        )}
      </div>
      {editing && (
        <div className="mb-3.5 bg-gray-50 rounded-lg p-3 border border-[#6FBD7A]/40">
          <input autoFocus type={type} value={draft} maxLength={maxLength}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') handleCancel(); }}
            className="w-full text-sm bg-white border border-gray-300 rounded-md px-3 py-2 mb-2.5 focus:outline-none focus:ring-2 focus:ring-[#6FBD7A] focus:border-transparent"
          />
          <div className="flex gap-2">
            <button onClick={handleSave} className="text-sm bg-[#6FBD7A] hover:bg-[#5da968] text-white px-4 py-1.5 rounded-md transition-colors">Save</button>
            <button onClick={handleCancel} className="text-sm border border-gray-300 text-gray-600 hover:text-gray-800 px-4 py-1.5 rounded-md transition-colors">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

function PasswordRow() {
  const [editing, setEditing] = useState(false);
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [error, setError] = useState('');
  const handleSave = () => {
    if (newPw.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (newPw !== confirmPw) { setError('Passwords do not match.'); return; }
    setNewPw(''); setConfirmPw(''); setError(''); setEditing(false);
  };
  const handleCancel = () => { setNewPw(''); setConfirmPw(''); setError(''); setEditing(false); };
  return (
    <div className="border-b border-gray-100 last:border-b-0">
      <div className="flex items-center justify-between py-3.5">
        <div>
          <p className="text-xs text-gray-500 mb-0.5">Password</p>
          <p className="text-sm text-gray-800">••••••••</p>
        </div>
        {!editing && (
          <button onClick={() => setEditing(true)} className="text-sm text-[#6FBD7A] hover:text-[#5da968] transition-colors">Edit</button>
        )}
      </div>
      {editing && (
        <div className="mb-3.5 bg-gray-50 rounded-lg p-3 border border-[#6FBD7A]/40">
          <input autoFocus type="password" placeholder="New password" value={newPw}
            onChange={(e) => setNewPw(e.target.value)}
            className="w-full text-sm bg-white border border-gray-300 rounded-md px-3 py-2 mb-2 focus:outline-none focus:ring-2 focus:ring-[#6FBD7A] focus:border-transparent"
          />
          <input type="password" placeholder="Confirm new password" value={confirmPw}
            onChange={(e) => setConfirmPw(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') handleCancel(); }}
            className="w-full text-sm bg-white border border-gray-300 rounded-md px-3 py-2 mb-2.5 focus:outline-none focus:ring-2 focus:ring-[#6FBD7A] focus:border-transparent"
          />
          {error && <p className="text-xs text-red-500 mb-2">{error}</p>}
          <div className="flex gap-2">
            <button onClick={handleSave} className="text-sm bg-[#6FBD7A] hover:bg-[#5da968] text-white px-4 py-1.5 rounded-md transition-colors">Save</button>
            <button onClick={handleCancel} className="text-sm border border-gray-300 text-gray-600 hover:text-gray-800 px-4 py-1.5 rounded-md transition-colors">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

export function SettingsPage({
  location, onLocationChange, onBack, onLogout, onSearch, isAuthenticated,
  onLoginClick, onHomeClick, onSettingsClick, onHistoryClick, initialSection,
  accountName, accountEmail, accountZip,
  onAccountNameChange, onAccountEmailChange, onAccountZipChange,
}: SettingsPageProps) {
  const [activeSection, setActiveSection] = useState<string>(initialSection ?? 'account');
  const scrollRef = useRef<HTMLDivElement>(null);

  const [excludedStores, setExcludedStores] = useState<string[]>(['Target']);
  const [storeSearch, setStoreSearch] = useState('');
  const [memberships, setMemberships] = useState([
    { name: 'Costco Membership', detail: 'Expires: 12/31/2026', status: 'Active' },
    { name: 'Whole Foods Prime', detail: 'Monthly subscription', status: 'Active' },
  ]);
  const [membershipSearch, setMembershipSearch] = useState('');

  const availableMemberships = ['Costco Membership', 'Stop & Shop Membership', 'Whole Foods Prime', "Sam's Club Membership", "BJ's Membership"];
  const availableStores = ['Walmart', 'Target', 'Kroger', 'Whole Foods', 'Safeway', 'Trader Joes', 'Costco', 'Aldi'];

  useEffect(() => {
    if (!initialSection) return;
    const container = scrollRef.current;
    const target = document.getElementById(initialSection);
    if (container && target) setTimeout(() => { container.scrollTop = target.offsetTop - container.offsetTop; }, 50);
  }, [initialSection]);

  const scrollToSection = (id: string) => {
    const container = scrollRef.current;
    const target = document.getElementById(id);
    if (container && target) container.scrollTo({ top: target.offsetTop - container.offsetTop, behavior: 'smooth' });
    setActiveSection(id);
  };

  const removeStore = (store: string) => setExcludedStores(excludedStores.filter(s => s !== store));
  const addStore = (store: string) => { if (!excludedStores.includes(store)) setExcludedStores([...excludedStores, store]); setStoreSearch(''); };
  const addMembership = (name: string) => { if (!memberships.some(m => m.name === name)) setMemberships([...memberships, { name, detail: 'New membership', status: 'Active' }]); setMembershipSearch(''); };
  const removeMembership = (name: string) => setMemberships(memberships.filter(m => m.name !== name));

  return (
    <div className="min-h-screen bg-[#F9F9F9]">
      <Header
        location={location} onLocationChange={onLocationChange} onLogout={onLogout}
        onSearch={onSearch} isAuthenticated={isAuthenticated} onLoginClick={onLoginClick}
        onHomeClick={onHomeClick} onSettingsClick={onSettingsClick} onHistoryClick={onHistoryClick}
        accountName={accountName} accountEmail={accountEmail}
      />

      <div className="max-w-7xl mx-auto px-3 md:px-6 pt-4 md:pt-6">
        <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-gray-800">
          <ChevronLeft className="w-5 h-5" />
          <span className="text-sm">Back</span>
        </button>
      </div>

      {/* Mobile-only pill nav */}
      <div className="md:hidden max-w-7xl mx-auto px-3 pt-3 pb-1 flex gap-2 overflow-x-auto">
        {[
          { id: 'account',            label: 'Account' },
          { id: 'preferences',        label: 'Preferences' },
          { id: 'notifications',      label: 'Notifications' },
          { id: 'favorites',          label: 'Favorites' },
          { id: 'bookmarked-offers',  label: 'Bookmarks' },
          { id: 'manage-memberships', label: 'Memberships' },
        ].map(({ id, label }) => (
          <button key={id} onClick={() => scrollToSection(id)}
            className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full border transition-colors ${
              activeSection === id ? 'bg-[#6FBD7A] text-white border-[#6FBD7A]' : 'bg-white text-gray-600 border-gray-300'
            }`}>
            {label}
          </button>
        ))}
      </div>

      <div className="max-w-7xl mx-auto px-3 md:px-6 py-4 flex gap-8">
        <div ref={scrollRef} className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-8 overflow-y-auto max-h-[calc(100vh-160px)]">

          <section id="account" className="mb-12">
            <h2 className="text-2xl mb-6 text-gray-800">Account</h2>
            <div className="divide-y divide-gray-100">
              <EditRow label="Name"             value={accountName}  onSave={onAccountNameChange} />
              <EditRow label="Email"            value={accountEmail} onSave={onAccountEmailChange} type="email" />
              <EditRow label="Primary zip code" value={accountZip}   onSave={onAccountZipChange}  maxLength={10} />
              <PasswordRow />
            </div>
          </section>

          <section id="preferences" className="mb-12">
            <h2 className="text-2xl mb-6 text-gray-800">Preferences</h2>
            <p className="text-sm text-gray-600 mb-4">Select which stores you do not wish to shop at to better tailor recommendations.</p>
            <div className="relative mb-4">
              <input type="text" placeholder="Search stores..." value={storeSearch}
                onChange={(e) => setStoreSearch(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6FBD7A]"
              />
              {storeSearch && (
                <div className="absolute top-full mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto z-10">
                  {availableStores.filter(s => s.toLowerCase().includes(storeSearch.toLowerCase()) && !excludedStores.includes(s)).map(s => (
                    <button key={s} onClick={() => addStore(s)} className="w-full px-4 py-2 text-left hover:bg-gray-50 text-sm text-gray-700">{s}</button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {excludedStores.map(store => (
                <div key={store} className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full">
                  <span className="text-sm text-gray-700">{store}</span>
                  <button onClick={() => removeStore(store)} className="text-gray-500 hover:text-gray-700"><X className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          </section>

          <section id="notifications" className="mb-12">
            <h2 className="text-2xl mb-6 text-gray-800">Notifications</h2>
            <div className="space-y-4">
              {[
                { label: 'Email Notifications', sub: 'Receive updates about deals and offers', defaultChecked: true },
                { label: 'Push Notifications', sub: 'Get notified about nearby deals', defaultChecked: false },
              ].map(({ label, sub, defaultChecked }) => (
                <div key={label} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-800">{label}</p>
                    <p className="text-xs text-gray-500">{sub}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked={defaultChecked} />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#6FBD7A]"></div>
                  </label>
                </div>
              ))}
            </div>
          </section>

          <section id="favorites" className="mb-12">
            <h2 className="text-2xl mb-6 text-gray-800">Favorites</h2>
            <p className="text-sm text-gray-600 mb-4">Your favorite products will appear here</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {['Organic Bananas', 'Whole Milk'].map(name => (
                <div key={name} className="border border-gray-200 rounded-lg p-4 text-center">
                  <div className="w-full h-32 bg-gray-100 rounded-lg mb-2"></div>
                  <p className="text-sm text-gray-700">{name}</p>
                </div>
              ))}
            </div>
          </section>

          <section id="bookmarked-offers" className="mb-12">
            <h2 className="text-2xl mb-6 text-gray-800">Bookmarked Offers</h2>
            <p className="text-sm text-gray-600 mb-4">Your saved deals and promotions</p>
            <div className="space-y-3">
              {[
                { name: 'Ground Beef - 20% Off', expires: '4/20/2026', price: '$4.99' },
                { name: 'Fresh Strawberries - Buy 1 Get 1', expires: '4/18/2026', price: '$3.99' },
              ].map(({ name, expires, price }) => (
                <div key={name} className="border border-gray-200 rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-800">{name}</p>
                    <p className="text-xs text-gray-500">Expires {expires}</p>
                  </div>
                  <span className="text-sm text-[#6FBD7A]">{price}</span>
                </div>
              ))}
            </div>
          </section>

          <section id="manage-memberships" className="mb-12">
            <h2 className="text-2xl mb-6 text-gray-800">Manage Memberships</h2>
            <div className="relative mb-4">
              <input type="text" placeholder="Add membership..." value={membershipSearch}
                onChange={(e) => setMembershipSearch(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6FBD7A]"
              />
              {membershipSearch && (
                <div className="absolute top-full mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto z-10">
                  {availableMemberships.filter(m => m.toLowerCase().includes(membershipSearch.toLowerCase()) && !memberships.some(e => e.name === m)).map(m => (
                    <button key={m} onClick={() => addMembership(m)} className="w-full px-4 py-2 text-left hover:bg-gray-50 text-sm text-gray-700">{m}</button>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-4">
              {memberships.map(({ name, detail, status }) => (
                <div key={name} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-gray-800">{name}</p>
                    <div className="flex items-center gap-3">
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">{status}</span>
                      <button onClick={() => removeMembership(name)} className="text-sm text-red-500 hover:text-red-600">Remove</button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">{detail}</p>
                </div>
              ))}
            </div>
          </section>

          <section id="logout" className="mb-8">
            <button onClick={() => { onLogout(); onHomeClick(); }} className="text-red-600 hover:text-red-700 flex items-center gap-2">
              <span className="text-sm">&gt; Logout</span>
            </button>
          </section>
        </div>

        {/* Right Navigation Sidebar — desktop only */}
        <div className="hidden md:block w-64 bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-8 h-fit">
          <h3 className="text-lg mb-4 text-gray-800">Settings</h3>
          <nav className="space-y-2">
            {[
              { id: 'account',            label: 'Account' },
              { id: 'preferences',        label: 'Preferences' },
              { id: 'notifications',      label: 'Notifications' },
              { id: 'favorites',          label: 'Favorites' },
              { id: 'bookmarked-offers',  label: 'Bookmarked Offers' },
              { id: 'manage-memberships', label: 'Manage Memberships' },
              { id: 'logout',             label: '> Logout' },
            ].map(({ id, label }) => (
              <a key={id} href={`#${id}`}
                onClick={(e) => { e.preventDefault(); scrollToSection(id); }}
                className={`block text-sm py-2 ${activeSection === id ? 'text-[#6FBD7A]' : 'text-gray-700 hover:text-gray-900'}`}>
                {label}
              </a>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
}