import { Card } from '../ui/card'
import { Button } from '../ui/button'
import { SiNotion, SiAwslambda, SiGmail, SiSlack, SiConfluence } from "react-icons/si";
import { FaGoogleDrive } from "react-icons/fa";
import Link from "next/link"
import { authGoogleDrive } from '@/lib/connectors/googleDrive';

export const Connectors = async () => {
  const connectors = [
    {
      id: 'google-drive',
      name: 'Google Drive',
      icon: <FaGoogleDrive className="w-6 h-6" />,
      description: 'Connect your Google Drive to access documents and files',
      link: authGoogleDrive,
    },
    {
      id: 'aws',
      name: 'AWS',
      icon: <SiAwslambda className="w-6 h-6" />,
      description: 'Integrate with AWS services and storage',
      link: () => "/"
    },
    {
      id: 'notion',
      name: 'Notion',
      icon: <SiNotion className="w-6 h-6" />,
      description: 'Sync your Notion workspace and databases',
      link: () => "/"
    },
    {
      id: 'slack',
      name: 'Slack',
      icon: <SiSlack className="w-6 h-6" />,
      description: 'Connect Slack workspaces and channels',
      link: () => "/"
    },
    {
      id: 'gmail',
      name: 'Gmail',
      icon: <SiGmail className="w-6 h-6" />,
      description: 'Integrate Gmail account and emails',
      link: () => "/"
    },
    {
      id: "confluence",
      name: "Confluence",
      icon: <SiConfluence className='w-6 h-6' />,
      description: "connect Confluence",
      link: () => "/"
    }
  ];

  return (<>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {connectors.map((connector) => {
        return (
          <Card
            key={connector.id}
            className="p-6 hover:shadow-lg transition-shadow duration-200 w-full max-w-sm mx-auto"
          >
            <div className="flex flex-col h-full justify-between">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-primary/10 rounded-lg text-primary">
                  {connector.icon}
                </div>
                <h3 className="text-xl font-semibold">{connector.name}</h3>
              </div>
              <p className="text-muted-foreground mb-6">{connector.description}</p>
              <Button className="w-full" asChild size='lg'>
                <Link href={connector.link()}>Connect</Link>
              </Button>
            </div>
          </Card>
        );
      })}
    </div>
    <div className="mt-8 text-center text-sm text-muted-foreground">
      <p>More connectors coming soon...</p>
    </div>
  </>)
}
