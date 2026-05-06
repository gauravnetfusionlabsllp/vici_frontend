export default function PageContainer({ children }) {
    return (
      <div className="mx-auto max-w-[1440px] px-6 min-h-[1024px] bg-background">
        {children}
      </div>
    );
  }
