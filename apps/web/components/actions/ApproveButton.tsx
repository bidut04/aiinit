'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface ApproveButtonProps {
  applicationId: string;
}

export function ApproveButton({ applicationId }: ApproveButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleApprove = async () => {
    if (!confirm('Are you sure you want to approve this application? This will create a restaurant and update the owner\'s role.')) {
      return;
    }

    setIsLoading(true);
    try {
      // Hit the API route
      const response = await fetch(`/api/admin/applications/${applicationId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
console.log(response);

      const data = await response.json();
console.log(data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to approve application');
      }

      // Show success message
      alert('✅ Application approved successfully! Restaurant has been created.');
      
      // Redirect to applications list
      router.push('/admin/applications');
      router.refresh();
      
    } catch (error) {
      console.error('Error approving application:', error);
      alert('❌ ' + (error instanceof Error ? error.message : 'Failed to approve application. Please try again.'));
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleApprove}
      disabled={isLoading}
      className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
    >
      {isLoading ? (
        <>
          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Approving...
        </>
      ) : (
        <>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          Approve Application
        </>
      )}
    </button>
  );
}