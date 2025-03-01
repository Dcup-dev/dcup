import { Card } from '../ui/card'
import { Button } from '../ui/button'
import { SiNotion, SiAwslambda, SiGmail, SiSlack, SiConfluence } from "react-icons/si";
import { FaGoogleDrive } from "react-icons/fa";
import Link from "next/link"
import { authGoogleDrive } from '@/lib/connectors/googleDrive';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { redirect } from 'next/navigation';
import { databaseDrizzle } from '@/db';

export const Connectors = async () => {
  const session = await getServerSession(authOptions)
  if (!session?.user.id) return redirect("/login")

  const connections = await databaseDrizzle.query.connections.findMany({
    where: (c, ops) => ops.eq(c.userId, session.user.id!)
  })

  const connectors = [
    {
      id: 'google-drive',
      name: 'Google Drive',
      icon: <FaGoogleDrive className="w-6 h-6" />,
      description: 'Connect your Google Drive to access documents and files',
      checkIsConnected: () => !!connections.find(c => c.service === 'GOOGLE_DRIVE'),
      link: authGoogleDrive,
    },
    {
      id: 'aws',
      name: 'AWS',
      icon: <SiAwslambda className="w-6 h-6" />,
      description: 'Integrate with AWS services and storage',
      checkIsConnected: () => !!connections.find(c => c.service === 'AWS'),
      link: () => "/"

    },
    {
      id: 'notion',
      name: 'Notion',
      icon: <SiNotion className="w-6 h-6" />,
      description: 'Sync your Notion workspace and databases',
      checkIsConnected: () => !!connections.find(c => c.service === 'NOTION'),
      link: () => "/"

    },
    {
      id: 'slack',
      name: 'Slack',
      icon: <SiSlack className="w-6 h-6" />,
      description: 'Connect Slack workspaces and channels',
      checkIsConnected: () => !!connections.find(c => c.service === 'SLACK'),
      link: () => "/"
    },
    {
      id: 'gmail',
      name: 'Gmail',
      icon: <SiGmail className="w-6 h-6" />,
      description: 'Integrate Gmail account and emails',
      checkIsConnected: () => !!connections.find(c => c.service === 'GMAIL'),
      link: () => "/"
    },
    {
      id: "confluence",
      name: "Confluence",
      icon: <SiConfluence className='w-6 h-6' />,
      description: "connect Confluence",
      checkIsConnected: () => !!connections.find(c => c.service === 'CONFLUENCE'),
      link: () => "/"
    }
  ];



  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {connectors.map((connector) => {
        const isConnected = connector.checkIsConnected()
        return <Card
          key={connector.id}
          className="p-6 hover:shadow-lg transition-shadow duration-200 group"
        >
          <div className="flex flex-col h-full justify-between">
            <div>
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-primary/10 rounded-lg text-primary">
                  {connector.icon}
                </div>
                <h3 className="text-xl font-semibold">{connector.name}</h3>
              </div>
              <p className="text-muted-foreground mb-6">
                {connector.description}
              </p>
            </div>
            <Button
              disabled={isConnected}
            >{isConnected ? <>
              <span className="mr-2">✓</span>
              Connected
            </> : <Link href={connector.link()}>Connect</Link>
              }
            </Button>
          </div>
        </Card>
      })}
    </div>
  )
}
