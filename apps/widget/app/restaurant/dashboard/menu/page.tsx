

import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import DashboardClient from './components/dashboardClient'
import { authOptions } from '@workspace/auth'
import db from '@workspace/database'
export default async function Page() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    redirect('/resturantOwnerLogin')
  }



  return <DashboardClient />
}