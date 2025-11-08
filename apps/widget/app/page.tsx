'use client'
import React, { useCallback, useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, X, ChevronRight, ChevronLeft, Check } from 'lucide-react';
import { ImageUploader } from '../components/ImageUploader';
import type { UploadResult } from '@workspace/cloudinary';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import AuthGuard from '../lib/getUserFormClintSide';
import { debounce } from 'lodash';

type Documents = {
  aadhar: string | null;
  pan: string | null;
  fssai: string | null;
  gst: string | null;
  bankStatement: string | null;
  restaurantPhotos: string[];
};

type FormData = {
  ownerFirstName: string;
  ownerLastName: string;
  ownerEmail: string;
  ownerPhone: string;
  aadharNumber: string;
  panNumber: string;
  restaurantName: string;
  restaurantType: string;
  cuisineTypes: string[];
  establishmentType: string;
  fssaiNumber: string;
  gstNumber: string;
  businessLicense: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
  landmark: string;
  openingTime: string;
  closingTime: string;
  seatingCapacity: string;
  isPureVeg: boolean;
  hasParking: boolean;
  hasWifi: boolean;
  hasAC: boolean;
  accountName: string;
  accountNumber: string;
  confirmAccountNumber: string;
  ifscCode: string;
  bankName: string;
  branchName: string;
  accountType: 'CURRENT' | 'SAVINGS';
  documents: Documents;
  termsAccepted: boolean;
  commissionAgreed: boolean;
};

type Errors = Partial<Record<keyof FormData | keyof Documents, string>>;

const ZomatoPartnerForm = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  const [formData, setFormData] = useState<FormData>({
    ownerFirstName: '',
    ownerLastName: '',
    ownerEmail: '',
    ownerPhone: '',
    aadharNumber: '',
    panNumber: '',
    restaurantName: '',
    restaurantType: '',
    cuisineTypes: [],
    establishmentType: '',
    fssaiNumber: '',
    gstNumber: '',
    businessLicense: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: '',
    landmark: '',
    openingTime: '',
    closingTime: '',
    seatingCapacity: '',
    isPureVeg: false,
    hasParking: false,
    hasWifi: false,
    hasAC: false,
    accountName: '',
    accountNumber: '',
    confirmAccountNumber: '',
    ifscCode: '',
    bankName: '',
    branchName: '',
    accountType: 'CURRENT',
    documents: {
      aadhar: null,
      pan: null,
      fssai: null,
      gst: null,
      bankStatement: null,
      restaurantPhotos: []
    },
    termsAccepted: false,
    commissionAgreed: false
  });

  const [errors, setErrors] = useState<Errors>({});

  useEffect(() => {
    let sid = localStorage.getItem('restaurantFormSessionId');
    if (!sid) {
      sid = `rest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('restaurantFormSessionId', sid);
    }
    setSessionId(sid);
  }, []);

  useEffect(() => {
    if (!sessionId) return;
    
    const loadForm = async () => {
      try {
        const localData = localStorage.getItem('restaurantFormData');
        const localStep = localStorage.getItem('restaurantFormStep');

        if (localData) {
          const parsedData = JSON.parse(localData);
          setFormData(parsedData);
          setCurrentStep(parseInt(localStep || '0'));
        }

        // For Redis implementation
        const response = await fetch(`/api/form/restore?sessionId=${sessionId}`);
        const result = await response.json();
        
        if (result.success && result.data) {
          setFormData(result.data.formData);
          setCurrentStep(result.data.currentStep);
          setLastSyncTime(new Date(result.data.lastSynced));

          localStorage.setItem('restaurantFormData', JSON.stringify(result.data.formData));
          localStorage.setItem('restaurantFormStep', result.data.currentStep.toString());
          
          console.log('✅ Synced from Redis');
        }
      } catch (error) {
        console.error('Error loading form data:', error);
      }
    };

    loadForm();
  }, [sessionId]);

  const cuisineOptions = [
    'North Indian', 'South Indian', 'Chinese', 'Italian', 'Mexican',
    'Continental', 'Thai', 'Japanese', 'Fast Food', 'Street Food',
    'Bakery', 'Desserts', 'Beverages', 'Healthy Food', 'Biryani'
  ];

  const restaurantTypes = [
    'Fine Dining', 'Casual Dining', 'Cafe', 'Quick Service Restaurant (QSR)',
    'Food Court', 'Bakery', 'Sweet Shop', 'Cloud Kitchen', 'Bar & Restaurant'
  ];

  const establishmentTypes = [
    'Standalone Restaurant', 'Hotel Restaurant', 'Chain Restaurant',
    'Franchise', 'Cloud Kitchen', 'Home-based Kitchen'
  ];

  const steps = [
    { title: 'Owner Details', icon: '👤' },
    { title: 'Restaurant Info', icon: '🏪' },
    { title: 'Business Details', icon: '📋' },
    { title: 'Address', icon: '📍' },
    { title: 'Operations', icon: '⏰' },
    { title: 'Banking', icon: '🏦' },
    { title: 'Documents', icon: '📄' },
    { title: 'Review', icon: '✅' }
  ];

  const validateStep = (step: number) => {
    const newErrors: Errors = {};
    
    switch(step) {
      case 0:
        if (!formData.ownerFirstName) newErrors.ownerFirstName = 'Required';
        if (!formData.ownerLastName) newErrors.ownerLastName = 'Required';
        if (!formData.ownerEmail) newErrors.ownerEmail = 'Required';
        else if (!/\S+@\S+\.\S+/.test(formData.ownerEmail)) newErrors.ownerEmail = 'Invalid email';
        if (!formData.ownerPhone) newErrors.ownerPhone = 'Required';
        else if (!/^[6-9]\d{9}$/.test(formData.ownerPhone)) newErrors.ownerPhone = 'Invalid phone';
        if (!formData.aadharNumber) newErrors.aadharNumber = 'Required';
        else if (!/^\d{12}$/.test(formData.aadharNumber)) newErrors.aadharNumber = 'Must be 12 digits';
        if (!formData.panNumber) newErrors.panNumber = 'Required';
        else if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.panNumber)) newErrors.panNumber = 'Invalid PAN';
        break;
        
      case 1:
        if (!formData.restaurantName) newErrors.restaurantName = 'Required';
        if (!formData.restaurantType) newErrors.restaurantType = 'Required';
        if (formData.cuisineTypes.length === 0) newErrors.cuisineTypes = 'Select at least one';
        if (!formData.establishmentType) newErrors.establishmentType = 'Required';
        break;
        
      case 2:
        if (!formData.fssaiNumber) newErrors.fssaiNumber = 'Required';
        else if (!/^\d{14}$/.test(formData.fssaiNumber)) newErrors.fssaiNumber = 'Must be 14 digits';
        break;
        
      case 3:
        if (!formData.addressLine1) newErrors.addressLine1 = 'Required';
        if (!formData.city) newErrors.city = 'Required';
        if (!formData.state) newErrors.state = 'Required';
        if (!formData.pincode) newErrors.pincode = 'Required';
        else if (!/^\d{6}$/.test(formData.pincode)) newErrors.pincode = 'Must be 6 digits';
        break;
        
      case 4:
        if (!formData.openingTime) newErrors.openingTime = 'Required';
        if (!formData.closingTime) newErrors.closingTime = 'Required';
        if (!formData.seatingCapacity) newErrors.seatingCapacity = 'Required';
        break;
        
      case 5:
        if (!formData.accountName) newErrors.accountName = 'Required';
        if (!formData.accountNumber) newErrors.accountNumber = 'Required';
        if (!formData.confirmAccountNumber) newErrors.confirmAccountNumber = 'Required';
        else if (formData.accountNumber !== formData.confirmAccountNumber) {
          newErrors.confirmAccountNumber = 'Account numbers do not match';
        }
        if (!formData.ifscCode) newErrors.ifscCode = 'Required';
        else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(formData.ifscCode)) newErrors.ifscCode = 'Invalid IFSC';
        if (!formData.bankName) newErrors.bankName = 'Required';
        if (!formData.branchName) newErrors.branchName = 'Required';
        break;
        
      case 6:
        if (!formData.documents.aadhar) {
    newErrors.aadhar = 'Aadhar document is required';
  }
  
  
  // Validate FSSAI document
  if (!formData.documents.fssai) {
    newErrors.fssai = 'FSSAI license document is required';
  }
  
  // Validate restaurant photos (at least 1)
  if (!formData.documents.restaurantPhotos || formData.documents.restaurantPhotos.length < 1) {
    newErrors.restaurantPhotos = 'Upload at least 1 restaurant photo';
  }
        break;
        
      case 7:
        if (!formData.termsAccepted) newErrors.termsAccepted = 'Required';
        if (!formData.commissionAgreed) newErrors.commissionAgreed = 'Required';
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const syncToRedis = async (data: FormData, step: number) => {
    if (!sessionId) return;
    setIsSyncing(true);
    try {
      const response = await fetch('/api/form/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId,
          formData: data,
          currentStep: step,
          timestamp: new Date().toISOString()
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setLastSyncTime(new Date());
        console.log('✅ Synced to Redis');
      }
    } catch (error) {
      console.error('Error syncing to Redis:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const debouncedSyncToRedis = useCallback(
    debounce((data: FormData, step: number) => syncToRedis(data, step), 3000),
    [sessionId]
  );

  const handleNext = async () => {
    if (validateStep(currentStep)) {
      const nextStep = Math.min(currentStep + 1, steps.length - 1);
      setCurrentStep(nextStep);
      localStorage.setItem('restaurantFormStep', nextStep.toString());
      debouncedSyncToRedis.cancel();
      await syncToRedis(formData, nextStep);
      window.scrollTo(0, 0);
    }
  };

  const handlePrevious = async () => {
    const prevStep = Math.max(currentStep - 1, 0);
    setCurrentStep(prevStep);
    localStorage.setItem('restaurantFormStep', prevStep.toString());
    debouncedSyncToRedis.cancel();
    await syncToRedis(formData, prevStep);
    window.scrollTo(0, 0);
  };

  const handleInputChange = (field: keyof FormData, value: any) => {
    const updatedData = { ...formData, [field]: value };
    setFormData(updatedData);
    localStorage.setItem('restaurantFormData', JSON.stringify(updatedData));
    localStorage.setItem('restaurantFormStep', currentStep.toString());
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
    
    debouncedSyncToRedis(updatedData, currentStep);
  };

  const handleCuisineToggle = (cuisine: string) => {
    const updatedCuisines = formData.cuisineTypes.includes(cuisine)
      ? formData.cuisineTypes.filter(c => c !== cuisine)
      : [...formData.cuisineTypes, cuisine];
    
    const updatedData = { ...formData, cuisineTypes: updatedCuisines };
    setFormData(updatedData);
    localStorage.setItem('restaurantFormData', JSON.stringify(updatedData));
    
    if (errors.cuisineTypes) {
      setErrors(prev => ({ ...prev, cuisineTypes: undefined }));
    }
    
    debouncedSyncToRedis(updatedData, currentStep);
  };

  const handleFileUpload = (docType: keyof FormData['documents'], result: UploadResult | null) => {
    const updatedData = {
      ...formData,
      documents: {
        ...formData.documents,
        [docType]: result ? result.secureUrl : null
      }
    };
    
    setFormData(updatedData);
    localStorage.setItem('restaurantFormData', JSON.stringify(updatedData));
    
    if (errors[docType]) {
      setErrors(prev => ({ ...prev, [docType]: undefined }));
    }
    
    debouncedSyncToRedis(updatedData, currentStep);
  };

  const handleMultiplePhotos = (result: UploadResult) => {
    const updatedData = {
      ...formData,
      documents: {
        ...formData.documents,
        restaurantPhotos: [...formData.documents.restaurantPhotos, result.secureUrl].slice(0, 10)
      }
    };
    
    setFormData(updatedData);
    localStorage.setItem('restaurantFormData', JSON.stringify(updatedData));
    
    if (errors.restaurantPhotos && updatedData.documents.restaurantPhotos.length >= 1) {
      setErrors(prev => ({ ...prev, restaurantPhotos: undefined }));
    }
    
    debouncedSyncToRedis(updatedData, currentStep);
  };

  const removePhoto = (index: number) => {
    const updatedData = {
      ...formData,
      documents: {
        ...formData.documents,
        restaurantPhotos: formData.documents.restaurantPhotos.filter((_: string, i: number) => i !== index)
      }
    };
    
    setFormData(updatedData);
    localStorage.setItem('restaurantFormData', JSON.stringify(updatedData));
    debouncedSyncToRedis(updatedData, currentStep);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep(currentStep)) {
      return;
    }

    try {
      const response = await fetch('/api/resturentApply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({...formData, sessionId})
      });

      if (response.ok) {
        alert('Application submitted successfully! Our team will review and contact you within 2-3 business days.');
        
        // Cleanup
        localStorage.removeItem('restaurantFormData');
        localStorage.removeItem('restaurantFormStep');
        localStorage.removeItem('restaurantFormSessionId');
        
        // if (sessionId) {
        //   await fetch(`/api/form/cleanup?sessionId=${sessionId}`, {
        //     method: 'DELETE'
        //   });
        // }
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.message || 'Submission failed'}`);
        console.error('Status:', response.status);
        console.error('Error:', errorData);
      }
    } catch (error) {
      console.error('Submission error:', error);
      alert('An error occurred while submitting the form. Please try again.');
    }
  };

  const InputField = ({ label, value, onChange, error, required, ...props }: any) => (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
          error ? 'border-red-500' : 'border-gray-300'
        }`}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );

  const FileUpload = ({
    label,
    docType,
    accept,
    required,
    error
  }: {
    label: string;
    docType: keyof FormData['documents'];
    accept: string;
    required?: boolean;
    error?: string;
  }) => (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {formData.documents[docType] ? (
        <div className="flex items-center justify-between bg-gray-50 p-3 rounded border border-gray-300">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="text-green-500" size={20} />
            <span className="text-sm text-gray-700">File uploaded successfully</span>
          </div>
          <button
            type="button"
            onClick={() => handleFileUpload(docType, null)}
            className="text-red-500 hover:text-red-700"
          >
            <X size={20} />
          </button>
        </div>
      ) : (
        <ImageUploader
          folder={`restaurants/documents/${String(docType)}`}
          onUploadComplete={(result) => handleFileUpload(docType, result)}
          maxSize={5 * 1024 * 1024}
          acceptedFormats={accept.split(',').map(ext => `image/${ext.replace('.', '')}`)}
        />
      )}
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );

  const renderStepContent = () => {
    switch(currentStep) {
      case 0:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Restaurant Owner Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField
                label="First Name"
                value={formData.ownerFirstName}
                onChange={(v: string) => handleInputChange('ownerFirstName', v)}
                error={errors.ownerFirstName}
                required
              />
              <InputField
                label="Last Name"
                value={formData.ownerLastName}
                onChange={(v: string) => handleInputChange('ownerLastName', v)}
                error={errors.ownerLastName}
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField
                label="Email Address"
                type="email"
                value={formData.ownerEmail}
                onChange={(v: string) => handleInputChange('ownerEmail', v)}
                error={errors.ownerEmail}
                required
              />
              <InputField
                label="Phone Number"
                type="tel"
                value={formData.ownerPhone}
                onChange={(v: string) => handleInputChange('ownerPhone', v)}
                error={errors.ownerPhone}
                required
                placeholder="10-digit mobile number"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField
                label="Aadhar Number"
                value={formData.aadharNumber}
                onChange={(v: string) => handleInputChange('aadharNumber', v)}
                error={errors.aadharNumber}
                required
                placeholder="12-digit Aadhar number"
                maxLength={12}
              />
              <InputField
                label="PAN Number"
                value={formData.panNumber}
                onChange={(v: string) => handleInputChange('panNumber', v.toUpperCase())}
                error={errors.panNumber}
                required
                placeholder="e.g., ABCDE1234F"
                maxLength={10}
              />
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Restaurant Information</h2>
            <InputField
              label="Restaurant Name"
              value={formData.restaurantName}
              onChange={(v: string) => handleInputChange('restaurantName', v)}
              error={errors.restaurantName}
              required
              placeholder="Enter your restaurant name"
            />
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Restaurant Type <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.restaurantType}
                onChange={(e) => handleInputChange('restaurantType', e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 ${
                  errors.restaurantType ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select restaurant type</option>
                {restaurantTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              {errors.restaurantType && <p className="mt-1 text-sm text-red-500">{errors.restaurantType}</p>}
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cuisine Types <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {cuisineOptions.map(cuisine => (
                  <button
                    key={cuisine}
                    type="button"
                    onClick={() => handleCuisineToggle(cuisine)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      formData.cuisineTypes.includes(cuisine)
                        ? 'bg-red-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {cuisine}
                  </button>
                ))}
              </div>
              {errors.cuisineTypes && <p className="mt-1 text-sm text-red-500">{errors.cuisineTypes}</p>}
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Establishment Type <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.establishmentType}
                onChange={(e) => handleInputChange('establishmentType', e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 ${
                  errors.establishmentType ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select establishment type</option>
                {establishmentTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              {errors.establishmentType && <p className="mt-1 text-sm text-red-500">{errors.establishmentType}</p>}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Business Details</h2>
            <InputField
              label="FSSAI License Number"
              value={formData.fssaiNumber}
              onChange={(v: string) => handleInputChange('fssaiNumber', v)}
              error={errors.fssaiNumber}
              required
              placeholder="14-digit FSSAI number"
              maxLength={14}
            />
            <InputField
              label="GST Number (if applicable)"
              value={formData.gstNumber}
              onChange={(v: string) => handleInputChange('gstNumber', v.toUpperCase())}
              error={errors.gstNumber}
              placeholder="15-digit GST number"
              maxLength={15}
            />
            <InputField
              label="Business License Number (if applicable)"
              value={formData.businessLicense}
              onChange={(v: string) => handleInputChange('businessLicense', v)}
              error={errors.businessLicense}
              placeholder="Business license/registration number"
            />
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertCircle className="text-blue-500 mr-3 mt-0.5" size={20} />
                <div>
                  <h4 className="font-semibold text-blue-800 mb-1">Important Information</h4>
                  <p className="text-sm text-blue-700">
                    FSSAI license is mandatory for all food businesses in India. If you don't have one, 
                    you can apply at foscos.fssai.gov.in
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Restaurant Address</h2>
            <InputField
              label="Address Line 1"
              value={formData.addressLine1}
              onChange={(v: string) => handleInputChange('addressLine1', v)}
              error={errors.addressLine1}
              required
              placeholder="Building number, street name"
            />
            <InputField
              label="Address Line 2"
              value={formData.addressLine2}
              onChange={(v: string) => handleInputChange('addressLine2', v)}
              placeholder="Area, locality"
            />
            <InputField
              label="Landmark"
              value={formData.landmark}
              onChange={(v: string) => handleInputChange('landmark', v)}
              placeholder="Nearby landmark"
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <InputField
                label="City"
                value={formData.city}
                onChange={(v: string) => handleInputChange('city', v)}
                error={errors.city}
                required
              />
              <InputField
                label="State"
                value={formData.state}
                onChange={(v: string) => handleInputChange('state', v)}
                error={errors.state}
                required
              />
              <InputField
                label="Pincode"
                value={formData.pincode}
                onChange={(v: string) => handleInputChange('pincode', v)}
                error={errors.pincode}
                required
                maxLength={6}
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Operational Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField
                label="Opening Time"
                type="time"
                value={formData.openingTime}
                onChange={(v: string) => handleInputChange('openingTime', v)}
                error={errors.openingTime}
                required
              />
              <InputField
                label="Closing Time"
                type="time"
                value={formData.closingTime}
                onChange={(v: string) => handleInputChange('closingTime', v)}
                error={errors.closingTime}
                required
              />
            </div>
            <InputField
              label="Seating Capacity"
              type="number"
              value={formData.seatingCapacity}
              onChange={(v: string) => handleInputChange('seatingCapacity', v)}
              error={errors.seatingCapacity}
              required
              placeholder="Approximate number of seats"
            />
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Restaurant Amenities
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isPureVeg}
                    onChange={(e) => handleInputChange('isPureVeg', e.target.checked)}
                    className="w-4 h-4 text-red-500 border-gray-300 rounded focus:ring-red-500"
                  />
                  <span className="ml-2 text-gray-700">Pure Vegetarian Restaurant</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.hasParking}
                    onChange={(e) => handleInputChange('hasParking', e.target.checked)}
                    className="w-4 h-4 text-red-500 border-gray-300 rounded focus:ring-red-500"
                  />
                  <span className="ml-2 text-gray-700">Parking Available</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.hasWifi}
                    onChange={(e) => handleInputChange('hasWifi', e.target.checked)}
                    className="w-4 h-4 text-red-500 border-gray-300 rounded focus:ring-red-500"
                  />
                  <span className="ml-2 text-gray-700">WiFi Available</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.hasAC}
                    onChange={(e) => handleInputChange('hasAC', e.target.checked)}
                    className="w-4 h-4 text-red-500 border-gray-300 rounded focus:ring-red-500"
                  />
                  <span className="ml-2 text-gray-700">Air Conditioned</span>
                </label>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Banking Details</h2>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <div className="flex items-start">
                <AlertCircle className="text-yellow-600 mr-3 mt-0.5" size={20} />
                <div>
                  <h4 className="font-semibold text-yellow-800 mb-1">Secure Information</h4>
                  <p className="text-sm text-yellow-700">
                    Your banking details are encrypted and secured. This information is required for settlement payments.
                  </p>
                </div>
              </div>
            </div>
            <InputField
              label="Account Holder Name"
              value={formData.accountName}
              onChange={(v: string) => handleInputChange('accountName', v)}
              error={errors.accountName}
              required
              placeholder="As per bank records"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField
                label="Account Number"
                value={formData.accountNumber}
                onChange={(v: string) => handleInputChange('accountNumber', v)}
                error={errors.accountNumber}
                required
                type="password"
              />
              <InputField
                label="Confirm Account Number"
                value={formData.confirmAccountNumber}
                onChange={(v: string) => handleInputChange('confirmAccountNumber', v)}
                error={errors.confirmAccountNumber}
                required
              />
            </div>
            <InputField
              label="IFSC Code"
              value={formData.ifscCode}
              onChange={(v: string) => handleInputChange('ifscCode', v.toUpperCase())}
              error={errors.ifscCode}
              required
              placeholder="e.g., SBIN0001234"
              maxLength={11}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField
                label="Bank Name"
                value={formData.bankName}
                onChange={(v: string) => handleInputChange('bankName', v)}
                error={errors.bankName}
                required
              />
              <InputField
                label="Branch Name"
                value={formData.branchName}
                onChange={(v: string) => handleInputChange('branchName', v)}
                error={errors.branchName}
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account Type <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.accountType}
                onChange={(e) => handleInputChange('accountType', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
              >
                <option value="CURRENT">Current Account</option>
                <option value="SAVINGS">Savings Account</option>
              </select>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Upload Documents</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FileUpload
                label="Aadhar Card"
                docType="aadhar"
                accept=".pdf,.jpg,.jpeg,.png"
                required
                error={errors.aadhar}
              />
              <FileUpload
                label="PAN Card"
                docType="pan"
                accept=".pdf,.jpg,.jpeg,.png"
                required
                error={errors.pan}
              />
              <FileUpload
                label="FSSAI License"
                docType="fssai"
                accept=".pdf,.jpg,.jpeg,.png"
                required
                error={errors.fssai}
              />
              <FileUpload
                label="GST Certificate (if applicable)"
                docType="gst"
                accept=".pdf,.jpg,.jpeg,.png"
                error={errors.gst}
              />
              <FileUpload
                label="Bank Statement (Last 3 months)"
                docType="bankStatement"
                accept=".pdf"
                error={errors.bankStatement}
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Restaurant Photos <span className="text-red-500">*</span> 
                <span className="text-gray-500 text-xs ml-2">
                  ({formData.documents.restaurantPhotos.length}/10 uploaded)
                </span>
              </label>
              
              {formData.documents.restaurantPhotos.length < 10 && (
                <ImageUploader
                  folder="restaurants/photos"
                  onUploadComplete={handleMultiplePhotos}
                  maxSize={5 * 1024 * 1024}
                  acceptedFormats={['image/jpeg', 'image/png', 'image/webp']}
                />
              )}
              
              {formData.documents.restaurantPhotos.length > 0 && (
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {formData.documents.restaurantPhotos.map((url, index) => (
                    <div key={index} className="relative">
                      <img
                        src={url}
                        alt={`Restaurant ${index + 1}`}
                        className="w-full h-24 object-cover rounded"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-700"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              {errors.restaurantPhotos && <p className="mt-1 text-sm text-red-500">{errors.restaurantPhotos}</p>}
            </div>
          </div>
        );

      case 7:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Review & Submit</h2>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <div className="flex items-start">
                <CheckCircle2 className="text-green-500 mr-3 mt-0.5" size={20} />
                <div>
                  <h4 className="font-semibold text-green-800 mb-1">All Set!</h4>
                  <p className="text-sm text-green-700">
                    Please review all your details before submitting the application. Our team will verify the information and get back to you within 2-3 business days.
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.termsAccepted}
                  onChange={(e) => handleInputChange('termsAccepted', e.target.checked)}
                  className="w-4 h-4 text-red-500 border-gray-300 rounded focus:ring-red-500"
                />
                <span className="ml-2 text-gray-700">I accept the terms and conditions</span>
              </label>
              {errors.termsAccepted && <p className="mt-1 text-sm text-red-500">{errors.termsAccepted}</p>}
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.commissionAgreed}
                  onChange={(e) => handleInputChange('commissionAgreed', e.target.checked)}
                  className="w-4 h-4 text-red-500 border-gray-300 rounded focus:ring-red-500"
                />
                <span className="ml-2 text-gray-700">I agree to the commission structure</span>
              </label>
              {errors.commissionAgreed && <p className="mt-1 text-sm text-red-500">{errors.commissionAgreed}</p>}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <AuthGuard requireRole="RESTAURANT_OWNER">
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto bg-white shadow-md rounded-lg p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Partner with Foodie</h1>
            <p className="text-gray-600">Join our platform to reach more customers and grow your restaurant business.</p>
          </div>
          
          <div className="mb-8">
            <div className="flex items-center justify-between overflow-x-auto pb-2">
              {steps.map((step, index) => (
                <div key={index} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 flex items-center justify-center rounded-full text-lg font-semibold ${
                        index === currentStep
                          ? 'bg-red-500 text-white'
                          : index < currentStep
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-300 text-gray-600'
                      }`}
                    >
                      {index < currentStep ? <Check size={20} /> : index + 1}
                    </div>
                    <span className={`text-xs mt-1 text-center ${
                      index === currentStep
                        ? 'text-red-600 font-semibold'
                        : index < currentStep
                        ? 'text-green-600'
                        : 'text-gray-500'
                    }`}>
                      {step.title}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-12 h-0.5 mx-2 ${
                      index < currentStep ? 'bg-green-500' : 'bg-gray-300'
                    }`}></div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {renderStepContent()}

            <div className="mt-8 flex justify-between">
              {currentStep > 0 && (
                <button
                  type="button"
                  onClick={handlePrevious}
                  className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 flex items-center gap-2"
                >
                  <ChevronLeft size={20} />
                  Back
                </button>
              )}
              <div className="ml-auto">
                {currentStep < steps.length - 1 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center gap-2"
                  >
                    Next
                    <ChevronRight size={20} />
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-semibold"
                  >
                    Submit Application
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </AuthGuard>
  );
};

export default ZomatoPartnerForm;