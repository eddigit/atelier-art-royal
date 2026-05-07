import { useEffect } from 'react';
import { base44 } from '@/api/base44Client';

// Lightweight tracker: writes one row to page_views per navigation.
// Schema (existing): page_name, url, referrer, user_agent, ip_address, country, city, user_id, session_id

export default function VisitorTracker({ pageName }) {
  useEffect(() => {
    const track = async () => {
      try {
        let sessionId = sessionStorage.getItem('artroyal_session_id');
        if (!sessionId) {
          sessionId = `s_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
          sessionStorage.setItem('artroyal_session_id', sessionId);
        }

        let userId = null;
        try {
          const u = await base44.auth.me();
          userId = u?.id || null;
        } catch {}

        let geo = {};
        try {
          const r = await fetch('https://ipapi.co/json/', { cache: 'no-store' });
          if (r.ok) geo = await r.json();
        } catch {}

        await base44.entities.PageView.create({
          page_name: pageName || document.title || 'unknown',
          url: window.location.pathname + window.location.search,
          referrer: document.referrer || null,
          user_agent: navigator.userAgent,
          ip_address: geo.ip || null,
          country: geo.country_name || null,
          city: geo.city || null,
          user_id: userId,
          session_id: sessionId,
        });
      } catch (e) {
        // Silently fail — analytics must never break the UX
      }
    };
    track();
  }, [pageName]);

  return null;
}
