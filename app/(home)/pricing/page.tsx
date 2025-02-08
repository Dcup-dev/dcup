import { authOptions } from '@/auth'
import { Pricing } from '@/components/Pricing/Pricing'
import { getServerSession } from 'next-auth'
import React from 'react'

export default async function pricing() {
  const sesstion = await getServerSession(authOptions)
  return (<Pricing isAuth={!!sesstion} />)
}
