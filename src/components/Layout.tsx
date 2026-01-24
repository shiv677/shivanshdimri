import { ReactNode } from 'react';
import Navigation from './Navigation';
import Footer from './Footer';
import PageTransition from './PageTransition';
import ScrollProgress from './ScrollProgress';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <PageTransition>
      <div className="min-h-screen bg-background text-foreground relative noise">
        <ScrollProgress />
        <Navigation />
        <main className="relative z-10">{children}</main>
        <Footer />
      </div>
    </PageTransition>
  );
};

export default Layout;
