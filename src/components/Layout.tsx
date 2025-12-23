import { ReactNode } from 'react';
import Navigation from './Navigation';
import Footer from './Footer';
import PageTransition from './PageTransition';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <PageTransition>
      <div className="min-h-screen bg-background text-foreground relative noise">
        <Navigation />
        <main className="relative z-10">{children}</main>
        <Footer />
      </div>
    </PageTransition>
  );
};

export default Layout;
