

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
const restaurant=await db.restaurantOwner.findFirst({
  where:
    {userId:session?.user?.id},
    select: { id: true }
    
  
})

  return <DashboardClient />
}