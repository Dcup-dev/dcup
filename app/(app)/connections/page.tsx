import { Connectors } from "@/components/Connectors/Connectors";

export default function ConnectionsPage() {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col space-y-4 mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
          Connected Services
        </h1>
        <p className="text-muted-foreground text-lg">
          Manage your data sources and keep your application in sync
        </p>
      </div>
      <Connectors />
      <div className="mt-8 text-center text-sm text-muted-foreground">
        <p>More connectors coming soon...</p>
      </div>
    </div>
  );
}
