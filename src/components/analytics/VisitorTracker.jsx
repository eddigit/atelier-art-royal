import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

export default function VisitorTracker({ pageName }) {
  useEffect(() => {
    const trackPageView = async () => {
      try {
        // Get or create visitor ID
        let visitorId = localStorage.getItem('visitor_id');
        let isNewVisitor = false;
        
        if (!visitorId) {
          visitorId = `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          localStorage.setItem('visitor_id', visitorId);
          localStorage.setItem('first_visit', new Date().toISOString());
          isNewVisitor = true;
        }

        // Get current user if logged in
        let userId = null;
        try {
          const user = await base44.auth.me();
          userId = user?.id;
        } catch {}

        // Get product ID from URL if on product page
        const urlParams = new URLSearchParams(window.location.search);
        const productId = urlParams.get('id');
        
        // Capture UTM parameters and source
        const utmSource = urlParams.get('utm_source') || null;
        const utmMedium = urlParams.get('utm_medium') || null;
        const utmCampaign = urlParams.get('utm_campaign') || null;
        
        // Detect source from referrer
        const referrer = document.referrer;
        let source = 'direct';
        if (referrer) {
          if (referrer.includes('google')) source = 'google';
          else if (referrer.includes('facebook')) source = 'facebook';
          else if (referrer.includes('instagram')) source = 'instagram';
          else if (referrer.includes('linkedin')) source = 'linkedin';
          else if (utmSource) source = utmSource;
          else source = 'referral';
        }
        
        // Simple bot detection
        const ua = navigator.userAgent.toLowerCase();
        const isLikelyBot = ua.includes('bot') || 
                           ua.includes('crawler') || 
                           ua.includes('spider');

        // Track page view
        await base44.entities.PageView.create({
          visitor_id: visitorId,
          user_id: userId,
          page_url: window.location.pathname + window.location.search,
          page_name: pageName,
          product_id: productId,
          referrer: referrer || null,
          user_agent: navigator.userAgent,
          source: source,
          utm_source: utmSource,
          utm_medium: utmMedium,
          utm_campaign: utmCampaign,
          is_likely_bot: isLikelyBot
        });

        // Update active visitor
        await base44.entities.ActiveVisitor.create({
          visitor_id: visitorId,
          user_id: userId,
          current_page: pageName,
          last_activity: new Date().toISOString(),
          is_new_visitor: isNewVisitor,
          source: source,
          referrer: referrer || null,
          user_agent: navigator.userAgent,
          is_likely_bot: isLikelyBot
        });

        // Update activity every 30 seconds
        const interval = setInterval(async () => {
          try {
            const activeVisitors = await base44.entities.ActiveVisitor.filter({ visitor_id: visitorId });
            if (activeVisitors.length > 0) {
              await base44.entities.ActiveVisitor.update(activeVisitors[0].id, {
                last_activity: new Date().toISOString(),
                current_page: pageName
              });
            }
          } catch (error) {
            console.error('Failed to update activity:', error);
          }
        }, 30000);

        return () => clearInterval(interval);
      } catch (error) {
        console.error('Tracking error:', error);
      }
    };

    trackPageView();
  }, [pageName]);

  return null;
}