// lib/getUserFromServer.ts
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function getCurrentUser()  {
  const session = await getServerSession(authOptions)
  if(session?.user?.role!=='SUPERADMIN'){
    return  null
  }
  return session?.user || null
}