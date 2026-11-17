'use client';

import dynamic from 'next/dynamic';

const FloatingCompareBar = dynamic(
  () => import('@/components/public/FloatingCompareBar').then((m) => m.FloatingCompareBar),
  { ssr: false }
);

const TimedEnquiryModal = dynamic(
  () => import('@/components/public/TimedEnquiryModal').then((m) => m.TimedEnquiryModal),
  { ssr: false }
);

export function ClientLayoutWidgets() {
  return (
    <>
      <FloatingCompareBar />
      <TimedEnquiryModal />
    </>
  );
}
