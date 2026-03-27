"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Building2, MapPin, Phone, Mail, Receipt, Landmark, FileText, 
  Save, Upload, Trash2, Plus, X, AlertCircle, CheckCircle2, 
  Image as ImageIcon, RefreshCw, Shield
} from 'lucide-react';
import { authFetch } from '@/app/lib/auth-fetch';
import { useToast } from '@/app/_components/ToastProvider';

interface CompanySettings {
  id?: string;
  companyName: string;
  companyShortName: string;
  companyTagline: string;
  logoUrl: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  email: string;
  gstNumber: string;
  panNumber: string;
  sacCode: string;
  bankName: string;
  bankBranch: string;
  accountNumber: string;
  ifscCode: string;
  termsAndConditions: string[];
  jurisdiction: string;
  signatureLabel: string;
  signatureUrl: string;
  footerText: string;
}

const defaultSettings: CompanySettings = {
  companyName: '',
  companyShortName: '',
  companyTagline: '',
  logoUrl: '',
  address: '',
  city: '',
  state: '',
  pincode: '',
  phone: '',
  email: '',
  gstNumber: '',
  panNumber: '',
  sacCode: '',
  bankName: '',
  bankBranch: '',
  accountNumber: '',
  ifscCode: '',
  termsAndConditions: [],
  jurisdiction: '',
  signatureLabel: '',
  signatureUrl: '',
  footerText: '',
};

export default function SettingsPage() {
  const { showToast } = useToast();
  const [settings, setSettings] = useState<CompanySettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingSignature, setUploadingSignature] = useState(false);
  const [newTerm, setNewTerm] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const signatureInputRef = useRef<HTMLInputElement>(null);



  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const res = await authFetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      showToast('error', 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await authFetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
        showToast('success', 'Settings saved successfully!');
      } else {
        showToast('error', 'Failed to save settings');
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      showToast('error', 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingLogo(true);
      const formData = new FormData();
      formData.append('logo', file);

      const res = await authFetch('/api/settings/logo', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setSettings(prev => ({ ...prev, logoUrl: data.logoUrl }));
        showToast('success', 'Logo uploaded successfully!');
      } else {
        showToast('error', 'Failed to upload logo');
      }
    } catch (error) {
      console.error('Failed to upload logo:', error);
      showToast('error', 'Failed to upload logo');
    } finally {
      setUploadingLogo(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveLogo = async () => {
    if (!confirm('Remove company logo?')) return;
    try {
      const res = await authFetch('/api/settings/logo', { method: 'DELETE' });
      if (res.ok) {
        setSettings(prev => ({ ...prev, logoUrl: '' }));
        showToast('success', 'Logo removed');
      }
    } catch (error) {
      console.error('Failed to remove logo:', error);
    }
  };

  const handleSignatureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingSignature(true);
      const formData = new FormData();
      formData.append('signature', file);

      const res = await authFetch('/api/settings/signature', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setSettings(prev => ({ ...prev, signatureUrl: data.signatureUrl }));
        showToast('success', 'Signature uploaded successfully!');
      } else {
        showToast('error', 'Failed to upload signature');
      }
    } catch (error) {
      console.error('Failed to upload signature:', error);
      showToast('error', 'Failed to upload signature');
    } finally {
      setUploadingSignature(false);
      if (signatureInputRef.current) signatureInputRef.current.value = '';
    }
  };

  const handleRemoveSignature = async () => {
    if (!confirm('Remove company signature?')) return;
    try {
      const res = await authFetch('/api/settings/signature', { method: 'DELETE' });
      if (res.ok) {
        setSettings(prev => ({ ...prev, signatureUrl: '' }));
        showToast('success', 'Signature removed');
      }
    } catch (error) {
      console.error('Failed to remove signature:', error);
    }
  };

  const addTerm = () => {
    if (!newTerm.trim()) return;
    setSettings(prev => ({
      ...prev,
      termsAndConditions: [...prev.termsAndConditions, newTerm.trim()]
    }));
    setNewTerm('');
  };

  const removeTerm = (index: number) => {
    setSettings(prev => ({
      ...prev,
      termsAndConditions: prev.termsAndConditions.filter((_, i) => i !== index)
    }));
  };

  const updateTerm = (index: number, value: string) => {
    setSettings(prev => ({
      ...prev,
      termsAndConditions: prev.termsAndConditions.map((t, i) => i === index ? value : t)
    }));
  };

  const updateField = (field: keyof CompanySettings, value: string) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
          <p className="text-sm font-bold text-neutral-400 uppercase tracking-widest">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 p-6 font-sans">
      <div className="max-w-5xl mx-auto space-y-8">



        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-neutral-200 dark:border-neutral-800 pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50 uppercase flex items-center gap-3">
              <Shield className="w-8 h-8 text-indigo-600" />
              Company Settings
            </h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
              Manage your company details, logo, and invoice configuration
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="mt-4 sm:mt-0 flex items-center gap-2 px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-indigo-500/20 active:scale-95 disabled:opacity-50 uppercase tracking-widest text-xs"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        {/* Logo Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800 p-8">
            <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2 mb-6">
              <ImageIcon className="w-5 h-5 text-indigo-500" />
              Company Logo
            </h2>
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="w-32 h-32 bg-neutral-100 dark:bg-neutral-800 rounded-2xl border-2 border-dashed border-neutral-300 dark:border-neutral-700 flex items-center justify-center overflow-hidden relative group shrink-0">
                {settings.logoUrl ? (
                  <>
                    <img 
                      src={settings.logoUrl} 
                      alt="Company Logo" 
                      className="w-full h-full object-contain p-2"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button onClick={handleRemoveLogo} className="p-2 bg-rose-500 rounded-full text-white hover:bg-rose-600 transition-colors">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="text-center">
                    <ImageIcon className="w-8 h-8 text-neutral-300 dark:text-neutral-600 mx-auto" />
                    <p className="text-[10px] text-neutral-400 mt-2 uppercase font-bold tracking-wider">No logo</p>
                  </div>
                )}
              </div>
              <div className="space-y-3">
                <input 
                  ref={fileInputRef} 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleLogoUpload} 
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingLogo}
                  className="flex items-center gap-2 px-6 py-3 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-bold rounded-xl transition-all text-sm w-full"
                >
                  {uploadingLogo ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {uploadingLogo ? 'Uploading...' : 'Upload Logo'}
                </button>
                <p className="text-[10px] text-neutral-400">Recommended: 400×400px</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800 p-8">
            <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2 mb-6">
              <FileText className="w-5 h-5 text-indigo-500" />
              Company Stamp/Signature
            </h2>
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="w-32 h-32 bg-neutral-100 dark:bg-neutral-800 rounded-2xl border-2 border-dashed border-neutral-300 dark:border-neutral-700 flex items-center justify-center overflow-hidden relative group shrink-0">
                {settings.signatureUrl ? (
                  <>
                    <img 
                      src={settings.signatureUrl} 
                      alt="Company Signature" 
                      className="w-full h-full object-contain p-2"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button onClick={handleRemoveSignature} className="p-2 bg-rose-500 rounded-full text-white hover:bg-rose-600 transition-colors">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="text-center">
                    <FileText className="w-8 h-8 text-neutral-300 dark:text-neutral-600 mx-auto" />
                    <p className="text-[10px] text-neutral-400 mt-2 uppercase font-bold tracking-wider">No stamp</p>
                  </div>
                )}
              </div>
              <div className="space-y-3">
                <input 
                  ref={signatureInputRef} 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleSignatureUpload} 
                />
                <button
                  onClick={() => signatureInputRef.current?.click()}
                  disabled={uploadingSignature}
                  className="flex items-center gap-2 px-6 py-3 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-bold rounded-xl transition-all text-sm w-full"
                >
                  {uploadingSignature ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {uploadingSignature ? 'Uploading...' : 'Upload Stamp'}
                </button>
                <p className="text-[10px] text-neutral-400">Displayed in Authorized Signatory space</p>
              </div>
            </div>
          </div>
        </div>

        {/* Company Identity */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800 p-8">
          <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2 mb-6">
            <Building2 className="w-5 h-5 text-indigo-500" />
            Company Identity
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField label="Company Full Name" value={settings.companyName} onChange={(v) => updateField('companyName', v)} placeholder="JCRM Cold Storage LLP" />
            <InputField label="Short Name / Brand" value={settings.companyShortName} onChange={(v) => updateField('companyShortName', v)} placeholder="JCRM" />
            <InputField label="Tagline" value={settings.companyTagline} onChange={(v) => updateField('companyTagline', v)} placeholder="COLD STORAGE" />
          </div>
        </div>

        {/* Address */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800 p-8">
          <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2 mb-6">
            <MapPin className="w-5 h-5 text-indigo-500" />
            Address
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <InputField label="Full Address" value={settings.address} onChange={(v) => updateField('address', v)} placeholder="Full street address..." />
            </div>
            <InputField label="City" value={settings.city} onChange={(v) => updateField('city', v)} placeholder="Surat" />
            <InputField label="State" value={settings.state} onChange={(v) => updateField('state', v)} placeholder="Gujarat" />
            <InputField label="Pincode" value={settings.pincode} onChange={(v) => updateField('pincode', v)} placeholder="394540" />
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800 p-8">
          <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2 mb-6">
            <Phone className="w-5 h-5 text-indigo-500" />
            Contact Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField label="Phone Number" value={settings.phone} onChange={(v) => updateField('phone', v)} placeholder="8128299220" />
            <InputField label="Email Address" value={settings.email} onChange={(v) => updateField('email', v)} placeholder="company@gmail.com" />
          </div>
        </div>

        {/* Tax & Legal */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800 p-8">
          <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2 mb-6">
            <Receipt className="w-5 h-5 text-indigo-500" />
            Tax & Legal
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <InputField label="GST Number" value={settings.gstNumber} onChange={(v) => updateField('gstNumber', v)} placeholder="24AAUFJ0917F1ZD" />
            <InputField label="PAN Number" value={settings.panNumber} onChange={(v) => updateField('panNumber', v)} placeholder="AAUFJ0917F" />
            <InputField label="SAC Code" value={settings.sacCode} onChange={(v) => updateField('sacCode', v)} placeholder="996721" />
          </div>
        </div>

        {/* Bank Details */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800 p-8">
          <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2 mb-6">
            <Landmark className="w-5 h-5 text-indigo-500" />
            Bank Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField label="Bank Name" value={settings.bankName} onChange={(v) => updateField('bankName', v)} placeholder="Canara Bank" />
            <InputField label="Branch" value={settings.bankBranch} onChange={(v) => updateField('bankBranch', v)} placeholder="Hazira" />
            <InputField label="Account Number" value={settings.accountNumber} onChange={(v) => updateField('accountNumber', v)} placeholder="120029409483" />
            <InputField label="IFSC Code" value={settings.ifscCode} onChange={(v) => updateField('ifscCode', v)} placeholder="CNRB0003428" />
          </div>
        </div>

        {/* Invoice Customization */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800 p-8">
          <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2 mb-6">
            <FileText className="w-5 h-5 text-indigo-500" />
            Invoice Customization
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <InputField label="Jurisdiction" value={settings.jurisdiction} onChange={(v) => updateField('jurisdiction', v)} placeholder="SURAT" />
            <InputField label="Signature Label" value={settings.signatureLabel} onChange={(v) => updateField('signatureLabel', v)} placeholder="Authorized Signatory" />
            <div className="md:col-span-2">
              <InputField label="Footer Text" value={settings.footerText} onChange={(v) => updateField('footerText', v)} placeholder="THIS IS A COMPUTER GENERATED DOCUMENT" />
            </div>
          </div>

          {/* Terms & Conditions */}
          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 block">Terms & Conditions</label>
            <div className="space-y-3">
              {settings.termsAndConditions.map((term, idx) => (
                <div key={idx} className="flex items-start gap-3 group">
                  <span className="shrink-0 w-8 h-8 bg-neutral-100 dark:bg-neutral-800 rounded-lg flex items-center justify-center text-xs font-black text-neutral-400">{idx + 1}</span>
                  <input
                    type="text"
                    value={term}
                    onChange={(e) => updateTerm(idx, e.target.value)}
                    className="flex-1 px-4 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm font-medium text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                  <button
                    onClick={() => removeTerm(idx)}
                    className="shrink-0 p-2 text-neutral-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-3 pt-2">
              <input
                type="text"
                value={newTerm}
                onChange={(e) => setNewTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addTerm()}
                placeholder="Add a new term..."
                className="flex-1 px-4 py-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm placeholder-neutral-400 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
              <button
                onClick={addTerm}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 font-bold rounded-xl hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-all text-sm"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Save button */}
        <div className="flex justify-end pb-8">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-10 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-indigo-500/20 active:scale-95 disabled:opacity-50 uppercase tracking-widest text-xs"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : 'Save All Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Reusable input field component
function InputField({ label, value, onChange, placeholder }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 block">{label}</label>
      <input
        type="text"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm font-medium text-neutral-900 dark:text-neutral-100 placeholder-neutral-300 dark:placeholder-neutral-600 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
      />
    </div>
  );
}
