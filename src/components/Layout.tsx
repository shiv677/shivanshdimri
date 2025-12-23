import { ReactNode } from 'react';
import Navigation from './Navigation';
import Footer from './Footer';
import CustomCursor from './CustomCursor';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-background text-foreground relative noise">
      <CustomCursor />
      <Navigation />
      <main className="relative z-10">{children}</main>
      <Footer />
    </div>
  );
};

export default Layout;
