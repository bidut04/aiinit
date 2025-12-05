'use client';

import { SessionProvider } from 'next-auth/react';
import { Toaster } from "sonner";
import { useEffect } from "react";

export function Providers({ children }: any) {
  useEffect(() => {
    // Add global error handler
    const handleRejection = (event: PromiseRejectionEvent) => {
      console.error('🔴 ========== UNHANDLED REJECTION ==========');
      console.error('🔴 Reason:', event.reason);
      console.error('🔴 Type:', typeof event.reason);
      
      if (event.reason instanceof Error) {
        console.error('🔴 Message:', event.reason.message);
        console.error('🔴 Stack:', event.reason.stack);
      }
      
      // Check if it's a JSON parse error
      if (event.reason?.message?.includes('JSON')) {
        console.error('🔴 ⚠️ THIS IS A JSON PARSE ERROR!');
        console.error('🔴 Check your fetch calls and API responses');
      }
      
      console.error('🔴 ========================================');
    };

    window.addEventListener('unhandledrejection', handleRejection);

    // Intercept all fetch calls
    const originalFetch = window.fetch;

    window.fetch = async (...args) => {
      const req = args[0];
      const url = typeof req === "string" ? req : (req as Request)?.url;

      // Only inspect your API routes
      const isApi = url?.includes("/api/");

      try {
        const response = await originalFetch(...args);

        if (!isApi) {
          return response; // skip image, font, nextjs internal requests
        }

        try {
          const clone = response.clone();
          const text = await clone.text();

          if (!text) {
            console.warn("⚠️ EMPTY RESPONSE from", url);
            return response;
          }

          try {
            JSON.parse(text);
            console.log("✅ Valid JSON:", url);
          } catch {
            console.error("❌ ⚠️ INVALID JSON from", url);
            console.error("❌ Response was:", text.substring(0, 500));
          }
        } catch (e) {
          console.error("❌ Could not read response from", url, e);
        }

        return response;
      } catch (error) {
        console.error("🔴 FETCH ERROR:", url, error);
        throw error;
      }
    };

    return () => {
      window.removeEventListener('unhandledrejection', handleRejection);
      window.fetch = originalFetch;
    };
  }, []);

  return (
    <SessionProvider>
      <Toaster 
        position="top-center" 
        richColors 
        expand={true}
        closeButton
      />
      {children}
    </SessionProvider>
  );
}