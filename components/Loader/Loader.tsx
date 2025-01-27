export const Loader = () => {
  return (
    <div className="flex h-screen items-center justify-center space-x-2">
      <span className="sr-only">Loading...</span>
      <div className="h-8 w-8 animate-bounce rounded-full bg-primary [animation-delay:-0.3s]"></div>
      <div className="h-8 w-8 animate-bounce rounded-full bg-primary [animation-delay:-0.15s]"></div>
      <div className="h-8 w-8 animate-bounce rounded-full bg-primary"></div>
    </div>
  );
};
