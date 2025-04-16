'use client'
import '@xyflow/react/dist/style.css';
import Image from "next/image";
import { Background, Handle, NodeProps, Position, ReactFlow } from "@xyflow/react";
import { AnimatedSvgEdge } from "../animated-svg-edge";
import { FcGoogle } from 'react-icons/fc';
import { FiCloud } from 'react-icons/fi';
import { ConnectionQuery } from "@/app/(protected)/connections/page";
import { FaAws, FaCloud, FaSlack, FaDropbox } from "react-icons/fa";
import { RiNotionFill } from "react-icons/ri";
import { SiConfluence, SiGmail } from "react-icons/si";


export const CustomNode = ({ id, data }: NodeProps) => {
  const isConnectionNode = !['app-logo', 'api-gateway', "no-connections"].includes(id);

  return (
    <div className={`
      group relative
      border border-gray-200 dark:border-gray-700
      rounded-lg p-2
      bg-white dark:bg-gray-800
      shadow-xs hover:shadow-sm
      transition-all duration-200
      ${isConnectionNode || id === 'api-gateway' && 'min-w-[140px] h-[60px]'}
    `}>
      {!isConnectionNode && <Handle
        type="target"
        position={Position.Left}
        className="!w-2.5 !h-2.5 !bg-white !border-2 !border-emerald-400 dark:!bg-gray-800"
      />}
      {id !== 'api-gateway' && id !== 'no-connections' && <Handle
        type="source"
        position={Position.Right}
        className="!w-2.5 !h-2.5 !bg-white !border-2 !border-emerald-400 dark:!bg-gray-800"
      />}

      <div className={`flex items-center h-full ${isConnectionNode ? 'gap-2' : 'justify-center'
        }`}>
        {isConnectionNode ? (
          <>
            <div className="p-1.5 rounded-md bg-emerald-50 dark:bg-emerald-900/20">
              {getConnectionIcone(data.service as string)}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-medium text-gray-700 dark:text-gray-200 truncate capitalize">
                {(data.service as string).replace('_', ' ').toLowerCase()}
              </p>
              <p className="text-[0.7rem] text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                {data.account as string}
              </p>
            </div>
          </>
        ) : id === 'api-gateway' || id === "no-connections" ? (
          <div className="flex gap-2 items-center justify-center">
            <div className="p-1.5 rounded-md bg-emerald-50 dark:bg-emerald-900/20">
              <FiCloud className="w-4 h-4 text-blue-500 dark:text-blue-400" />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-medium text-gray-700 dark:text-gray-200">
                API Gateway
              </p>
              <span className="px-1 py-0.5 text-[0.6rem] bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 rounded-md">
                Connected
              </span>
            </div>
          </div>
        ) : (
          <div className="relative group/logo">
            <Image
              src="/dcup_light.svg"
              alt="App Logo"
              width={40}
              height={40}
              className="hidden dark:inline hover:scale-105 transition-transform duration-300"
            />
            <Image
              src="/dcup_dark.svg"
              alt="App Logo"
              width={40}
              height={40}
              className="inline dark:hidden hover:scale-105 transition-transform duration-300"
            />
          </div>
        )}
      </div>
    </div>
  );
};

const nodeTypes = {
  custom: CustomNode
};


// Static edge (app to API)
const staticEdges = [
  {
    id: 'app-to-api',
    source: 'app-logo',
    target: 'api-gateway',
    type: "animatedSvgEdge",
    data: {
      duration: 2,
      shape: "circle",
      path: "bezier",
    },
  }
] satisfies AnimatedSvgEdge[];

const getConnectionIcone = (service: string) => {
  switch (service) {
    case 'GOOGLE_DRIVE':
      return <FcGoogle className="w-4 h-4" />
    case "AWS":
      return <FaAws className="w-4 h-4" />
    case "DROPBOX":
      return <FaDropbox className='w-4 h-4' />
    case "NOTION":
      return <RiNotionFill className="w-4 h-4" />
    case "SLACK":
      return <FaSlack className="w-4 h-4" />
    case "GMAIL":
      return <SiGmail className="w-4 h-4" />
    case "CONFLUENCE":
      return <SiConfluence className='w-6 h-6' />
    case "DIRECT_UPLOAD":
      return <FaCloud className="w-4 h-4" />
  }
}

const getConnectionNode = (connections: ConnectionQuery[]) => {
  let connection = false;
  const mainNode = {
    id: 'app-logo',
    position: { x: 350, y: 50 },
    type: 'custom',
    data: {},
  }
  if (connections.length === 0) return [mainNode]

  const connectionNodes = connections.map((conn, index) => {
    if (!connection) {
      connection = conn.isConfigSet
    }

    return {
      id: conn.id,
      position: { x: 50, y: 50 * index * 1.5 },  // Vertical layout
      type: 'custom',
      data: { account: conn.identifier, service: conn.service },
    }
  });

  const apiGateway = {
    id: connection ? 'api-gateway' : "no-connections",
    position: { x: 650, y: 50 },
    type: 'custom',
    data: {},
  }


  return [...connectionNodes, mainNode, apiGateway]
}

const edgeTypes = {
  animatedSvgEdge: AnimatedSvgEdge,
};

export default function PipelineFlow({ connections }: { connections: ConnectionQuery[] }) {
  const nodes = getConnectionNode(connections)
  const connectionEdges = connections.map(conn => ({
    id: `${conn.id}-to-app`,
    source: conn.isConfigSet ? conn.id : "1",
    target: 'app-logo',
    type: "animatedSvgEdge",
    data: {
      duration: 2,
      shape: "package",
      path: "bezier",
    },
  }));

  return (
    <div className="h-[300px] w-full">
      <ReactFlow
        nodes={nodes}
        edges={[...connectionEdges, ...staticEdges]}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        minZoom={0.5}
        maxZoom={1.5}
        panOnDrag={false}
        panOnScroll={false}
        zoomOnPinch={false}
        zoomOnScroll={false}
        zoomOnDoubleClick={false}
        nodesDraggable={false}
        nodesConnectable={false}
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Background />
      </ReactFlow>
    </div>
  );
}
