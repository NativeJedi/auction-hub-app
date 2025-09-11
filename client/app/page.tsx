"use client";

import AuthComponent from '@/app/components/AuthComponent';
import { MemberSocket, AdminSocket } from '@/app/components/WebSocketConnector';
import AuctionManager from '@/app/components/AuctionManager';
import LotsComponent from '@/app/components/LotsComponents';

export default function Page() {
  return (
    <>
      <AuthComponent />
      <AuctionManager />
      <LotsComponent />
      <AdminSocket/>
      <MemberSocket/>
    </>
  )
}
