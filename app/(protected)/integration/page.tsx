import React from 'react'
import { GenerateKeyForm } from '@/components/GeneratekeyForm/GeneratekeyForm';
import { KeysList } from '@/components/keysList/KeysList';
import { CardHeader, Card, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';


export default async function IntegrationPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })
  if (!session?.user.id) return redirect("/login")

  return (<main className="container mx-auto p-6 space-y-8">
    <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      <div className="col-span-1 md:col-span-2 lg:col-span-3">
        <Card className="w-full max-w-xl mx-auto mt-5 p-4">
          <CardHeader>
            <CardTitle className="text-xl">Create New API Key</CardTitle>
            <CardDescription className="text-lg">
              Enter a unique name for your API key to differentiate it from other
              keys.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <GenerateKeyForm />
          </CardContent>
        </Card>
      </div>
      <div className="col-span-1 md:col-span-2 lg:col-span-3">
        <KeysList />
      </div>
    </section>
  </main>)
}
